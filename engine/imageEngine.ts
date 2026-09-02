import type {
  CanvasSurface,
  DecodedImage,
  DecodeLimits,
  ImageEngineAdapter,
} from './adapters';
import { OptimizationError } from './errors';
import { detectInputFormat, formatBytes } from './format';
import { detectFormatFromBytes, parseImageHeader } from './imageHeader';
import {
  binarySearchMaxFeasible,
  computeBaseDimensions,
  dimensionsForFitScale,
  MAX_DECODE_PIXELS,
  MAX_DIMENSION,
  MAX_INPUT_BYTES,
  NO_TARGET_QUALITY,
  PROBE_QUALITY,
  QUALITY_ITERATIONS,
  QUALITY_MAX,
  QUALITY_MIN,
  refineFeasibleValue,
  REFINE_SCALE_STEP,
  SCALE_ITERATIONS,
  scaleFloorFor,
  type PlannedDimensions,
} from './optimizer';
import { isIdentityTransform, normalizeTransform } from './transform';
import type {
  CancellationToken,
  EngineStage,
  ImageFormat,
  ImageMetadata,
  OptimizationInput,
  OptimizationOptions,
  OptimizationResult,
} from './types';

export type ProgressListener = (stage: EngineStage, detail?: string) => void;

export type OptimizeImage = (
  input: OptimizationInput,
  options?: OptimizationOptions,
  onProgress?: ProgressListener,
) => Promise<OptimizationResult>;

export type InspectImage = (
  input: OptimizationInput,
  cancellationToken?: CancellationToken,
  maxDimension?: number,
) => Promise<ImageMetadata>;

interface EncodedResult {
  blob: Blob;
  width: number;
  height: number;
  size: number;
  quality: number | null;
  scale: number;
}

interface AttemptCounter {
  count: number;
}

/**
 * Creates a DOM-free image optimizer around a raster adapter. The worker layer
 * supplies the browser adapter; tests can supply a fake one.
 */
export function createImageEngine(adapter: ImageEngineAdapter): OptimizeImage {
  if (!adapter) {
    throw new TypeError('ImageEngineAdapter is required.');
  }

  return async (input, options = {}, onProgress) => {
    const startedAt = performance.now();
    const attempts: AttemptCounter = { count: 0 };
    const token = options.cancellationToken;

    validateInput(input);
    const inputFormat = detectInputFormat(input.mimeType, input.name);
    if (!inputFormat) {
      throw new OptimizationError(
        'UNSUPPORTED_INPUT_FORMAT',
        'Only JPG, PNG, and WebP images are supported.',
        { mimeType: input.mimeType, name: input.name },
      );
    }

    const dataBytes = input.data instanceof Uint8Array ? input.data : new Uint8Array(input.data);
    validateImageContent(dataBytes, inputFormat);
    if (dataBytes.byteLength > MAX_INPUT_BYTES) {
      throw new OptimizationError(
        'DEVICE_LIMIT_EXCEEDED',
        'Images over 50 MB are not supported yet.',
      );
    }

    const requestedTargetSize = normalizeTargetSize(options.targetSize);
    const targetSize =
      requestedTargetSize === null
        ? null
        : Math.min(requestedTargetSize, dataBytes.byteLength);
    const targetFormat = options.targetFormat ?? inputFormat;
    const fallbackQuality = options.fallbackQuality ?? NO_TARGET_QUALITY;
    const decodeLimit = options.maxOutputDimension ?? MAX_DIMENSION;
    const decodeLimits: DecodeLimits = {
      maxDimension: decodeLimit,
      maxPixels: MAX_DECODE_PIXELS,
    };
    let decoded: DecodedImage | null = null;

    try {
      throwIfCancelled(token);
      onProgress?.('decoding');
      decoded = await adapter.decode(input.data, input.mimeType, decodeLimits);
      throwIfCancelled(token);
      assertDecodedWithinLimits(decoded, decodeLimit);

      const normalizedTransform = normalizeTransform(options.transform);
      if (!isIdentityTransform(normalizedTransform)) {
        const transformed = await adapter.applyTransform(
          decoded,
          normalizedTransform,
          decodeLimits,
        );
        decoded.dispose();
        decoded = transformed;
        assertDecodedWithinLimits(decoded, decodeLimit);
      }

      onProgress?.('planning');
      const base = computeBaseDimensions(
        decoded.width,
        decoded.height,
        options.maxWidth,
        options.maxHeight,
        decodeLimit,
      );

      const encoded =
        targetSize === null
          ? await encodeAtResolution(
              adapter,
              decoded,
              base,
              1,
              targetFormat,
              fallbackQuality,
              onProgress,
              attempts,
              token,
            )
          : await optimizeToTarget(
              adapter,
              decoded,
              base,
              targetFormat,
              targetSize,
              onProgress,
              attempts,
              token,
            );

      return buildResult(
        inputFormat,
        targetFormat,
        targetSize,
        decoded,
        encoded,
        dataBytes.byteLength,
        attempts.count,
        startedAt,
        options,
      );
    } finally {
      decoded?.dispose();
    }
  };
}

export function createImageInspector(adapter: ImageEngineAdapter): InspectImage {
  if (!adapter) {
    throw new TypeError('ImageEngineAdapter is required.');
  }

  return async (input, cancellationToken, maxDimension) => {
    validateInput(input);
    const inputFormat = detectInputFormat(input.mimeType, input.name);
    if (!inputFormat) {
      throw new OptimizationError(
        'UNSUPPORTED_INPUT_FORMAT',
        'Only JPG, PNG, and WebP images are supported.',
        { mimeType: input.mimeType, name: input.name },
      );
    }

    const dataBytes = input.data instanceof Uint8Array ? input.data : new Uint8Array(input.data);
    validateImageContent(dataBytes, inputFormat);
    const decodeLimit = maxDimension ?? MAX_DIMENSION;
    const decodeLimits: DecodeLimits = {
      maxDimension: decodeLimit,
      maxPixels: MAX_DECODE_PIXELS,
    };
    const header = parseImageHeader(dataBytes);
    if (header) {
      return {
        width: header.width,
        height: header.height,
        size: dataBytes.byteLength,
        format: inputFormat,
        mimeType: input.mimeType,
      };
    }

    let decoded: DecodedImage | null = null;
    try {
      throwIfCancelled(cancellationToken);
      decoded = await adapter.decode(input.data, input.mimeType, decodeLimits);
      throwIfCancelled(cancellationToken);
      assertDecodedWithinLimits(decoded, decodeLimit);
      return {
        width: decoded.width,
        height: decoded.height,
        size: dataBytes.byteLength,
        format: inputFormat,
        mimeType: input.mimeType,
      };
    } finally {
      decoded?.dispose();
    }
  };
}

function validateImageContent(data: Uint8Array, declaredFormat: ImageFormat): void {
  const detected = detectFormatFromBytes(data);
  if (!detected) {
    throw new OptimizationError(
      'UNSUPPORTED_INPUT_FORMAT',
      'This file is not a supported JPG, PNG or WebP image.',
    );
  }
  if (detected !== declaredFormat) {
    throw new OptimizationError(
      'UNSUPPORTED_INPUT_FORMAT',
      'The file type does not match its content.',
      { declaredFormat, detected },
    );
  }
}

function assertDecodedWithinLimits(
  decoded: DecodedImage,
  maxDimension: number,
): void {
  if (
    decoded.width > maxDimension ||
    decoded.height > maxDimension ||
    decoded.width * decoded.height > MAX_DECODE_PIXELS
  ) {
    throw new OptimizationError(
      'DEVICE_LIMIT_EXCEEDED',
      'This image is too large to process safely.',
      {
        width: decoded.width,
        height: decoded.height,
        maxDimension,
      },
    );
  }
}

function throwIfCancelled(token: CancellationToken | undefined): void {
  if (token?.aborted) {
    throw new OptimizationError('ABORTED', 'Operation cancelled.');
  }
}

function validateInput(input: OptimizationInput): void {
  if (!input || !input.data) {
    throw new OptimizationError('INVALID_INPUT', 'Image data is missing.');
  }
  const isBuffer = input.data instanceof ArrayBuffer || input.data instanceof Uint8Array;
  if (!isBuffer) {
    throw new OptimizationError(
      'INVALID_INPUT',
      'Image data must be an ArrayBuffer or Uint8Array.',
    );
  }
}

function normalizeTargetSize(targetSize: number | null | undefined): number | null {
  if (targetSize === null || targetSize === undefined) return null;
  if (!Number.isFinite(targetSize) || targetSize < 1) {
    throw new OptimizationError('INVALID_INPUT', 'Target size must be at least 1 byte.');
  }
  return Math.round(targetSize);
}

async function optimizeToTarget(
  adapter: ImageEngineAdapter,
  decoded: DecodedImage,
  base: PlannedDimensions,
  format: ImageFormat,
  targetSize: number,
  onProgress: ProgressListener | undefined,
  attempts: AttemptCounter,
  token: CancellationToken | undefined,
): Promise<EncodedResult> {
  if (format === 'png') {
    return fitByScale(adapter, decoded, base, format, targetSize, onProgress, attempts, token);
  }

  const stage1 = await qualitySearchAtScale(
    adapter,
    decoded,
    base,
    1,
    format,
    targetSize,
    onProgress,
    attempts,
    token,
  );
  if (stage1) return stage1;

  return fitByScale(adapter, decoded, base, format, targetSize, onProgress, attempts, token);
}

async function qualitySearchAtScale(
  adapter: ImageEngineAdapter,
  decoded: DecodedImage,
  base: PlannedDimensions,
  fitScale: number,
  format: ImageFormat,
  targetSize: number,
  onProgress: ProgressListener | undefined,
  attempts: AttemptCounter,
  token: CancellationToken | undefined,
): Promise<EncodedResult | null> {
  const dims = dimensionsForFitScale(base, fitScale);
  const surface = adapter.createSurface(dims.width, dims.height);
  surface.drawImage(decoded, dims.width, dims.height);
  onProgress?.('searching-quality', `Finding the best quality at ${dims.width}x${dims.height}`);

  const range = { min: QUALITY_MIN, max: QUALITY_MAX, iterations: QUALITY_ITERATIONS };
  const probe = async (quality: number) =>
    (await encodeSurface(surface, format, quality, attempts, token)).size;
  const found = await binarySearchMaxFeasible(probe, range, targetSize);
  if (!found) return null;

  const refined = await refineFeasibleValue(probe, found, range, targetSize);
  const blob = await encodeSurface(surface, format, refined.value, attempts, token);
  return {
    blob,
    width: dims.width,
    height: dims.height,
    size: blob.size,
    quality: refined.value,
    scale: base.scale * fitScale,
  };
}

async function fitByScale(
  adapter: ImageEngineAdapter,
  decoded: DecodedImage,
  base: PlannedDimensions,
  format: ImageFormat,
  targetSize: number,
  onProgress: ProgressListener | undefined,
  attempts: AttemptCounter,
  token: CancellationToken | undefined,
): Promise<EncodedResult> {
  const floor = scaleFloorFor(base);
  onProgress?.('resizing', 'Reducing resolution to fit...');

  const probe = async (fitScale: number) => {
    const dims = dimensionsForFitScale(base, fitScale);
    const surface = adapter.createSurface(dims.width, dims.height);
    surface.drawImage(decoded, dims.width, dims.height);
    return (await encodeSurface(surface, format, PROBE_QUALITY, attempts, token)).size;
  };

  const found = await binarySearchMaxFeasible(
    probe,
    { min: floor, max: 1, iterations: SCALE_ITERATIONS },
    targetSize,
  );
  if (!found) {
    const dims = dimensionsForFitScale(base, floor);
    const surface = adapter.createSurface(dims.width, dims.height);
    surface.drawImage(decoded, dims.width, dims.height);
    const blob = await encodeSurface(surface, format, QUALITY_MIN, attempts, token);
    throw new OptimizationError(
      'TARGET_UNREACHABLE',
      `This image cannot be reduced below about ${formatBytes(blob.size)} without becoming unrecognizable. Try a larger target size.`,
      {
        targetSize,
        smallestAchievableSize: blob.size,
        width: dims.width,
        height: dims.height,
      },
    );
  }

  if (format === 'png') {
    return encodeAtResolution(
      adapter,
      decoded,
      base,
      found.value,
      format,
      1,
      onProgress,
      attempts,
      token,
    );
  }

  const scales = uniqueScales([
    found.value,
    Math.min(1, found.value * (1 + REFINE_SCALE_STEP)),
    Math.max(floor, found.value * (1 - REFINE_SCALE_STEP)),
  ]);
  const candidates: EncodedResult[] = [];
  for (const fitScale of scales) {
    const candidate = await qualitySearchAtScale(
      adapter,
      decoded,
      base,
      fitScale,
      format,
      targetSize,
      onProgress,
      attempts,
      token,
    );
    if (candidate) candidates.push(candidate);
  }
  if (candidates.length === 0) {
    return encodeAtResolution(
      adapter,
      decoded,
      base,
      found.value,
      format,
      PROBE_QUALITY,
      onProgress,
      attempts,
      token,
    );
  }
  return pickLargestResolution(candidates);
}

async function encodeAtResolution(
  adapter: ImageEngineAdapter,
  decoded: DecodedImage,
  base: PlannedDimensions,
  fitScale: number,
  format: ImageFormat,
  quality: number,
  onProgress: ProgressListener | undefined,
  attempts: AttemptCounter,
  token: CancellationToken | undefined,
): Promise<EncodedResult> {
  const dims = dimensionsForFitScale(base, fitScale);
  const surface = adapter.createSurface(dims.width, dims.height);
  surface.drawImage(decoded, dims.width, dims.height);
  onProgress?.('encoding');
  const blob = await encodeSurface(surface, format, quality, attempts, token);
  return {
    blob,
    width: dims.width,
    height: dims.height,
    size: blob.size,
    quality: format === 'png' ? null : quality,
    scale: base.scale * fitScale,
  };
}

async function encodeSurface(
  surface: CanvasSurface,
  format: ImageFormat,
  quality: number,
  attempts: AttemptCounter,
  token: CancellationToken | undefined,
): Promise<Blob> {
  throwIfCancelled(token);
  attempts.count += 1;
  return surface.encode(format, quality);
}

function uniqueScales(scales: number[]): number[] {
  const sorted = [...scales].sort((a, b) => b - a);
  const unique: number[] = [];
  for (const scale of sorted) {
    if (unique.length === 0 || Math.abs(unique[unique.length - 1] - scale) > 0.0001) {
      unique.push(scale);
    }
  }
  return unique;
}

function pickLargestResolution(candidates: EncodedResult[]): EncodedResult {
  return [...candidates].sort((a, b) => {
    if (b.scale !== a.scale) return b.scale - a.scale;
    return (b.quality ?? 0) - (a.quality ?? 0);
  })[0];
}

function buildResult(
  originalFormat: ImageFormat,
  targetFormat: ImageFormat,
  targetSize: number | null,
  decoded: DecodedImage,
  encoded: EncodedResult,
  originalSize: number,
  encodeAttempts: number,
  startedAt: number,
  options: OptimizationOptions,
): OptimizationResult {
  return {
    outputBlob: encoded.blob,
    outputSize: encoded.size,
    width: encoded.width,
    height: encoded.height,
    format: targetFormat,
    quality: encoded.quality,
    compressionRatio: originalSize > 0 ? originalSize / encoded.size : 1,
    originalSize,
    originalWidth: decoded.width,
    originalHeight: decoded.height,
    originalFormat,
    targetSize,
    targetReached: true,
    scale: encoded.scale,
    durationMs: Math.round(performance.now() - startedAt),
    encodeAttempts,
    metadataPreserved: options.preserveMetadata === true,
  };
}
