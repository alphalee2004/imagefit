import type {
  CanvasSurface,
  DecodedImage,
  DecodeLimits,
  ImageEngineAdapter,
} from '../adapters';
import { OptimizationError } from '../errors';
import { parseImageHeader } from '../imageHeader';
import {
  computeDecodeDimensions,
  MAX_DECODE_PIXELS,
  MAX_DIMENSION,
} from '../optimizer';
import {
  computeRotatedBounds,
  cropToPixels,
  isIdentityTransform,
  normalizeTransform,
  rotationRadians,
} from '../transform';
import type { ImageFormat, ImageTransform } from '../types';

const DEFAULT_LIMITS: DecodeLimits = {
  maxDimension: MAX_DIMENSION,
  maxPixels: MAX_DECODE_PIXELS,
};

class BrowserDecodedImage implements DecodedImage {
  readonly width: number;
  readonly height: number;
  readonly source: CanvasImageSource;

  constructor(bitmap: ImageBitmap) {
    this.source = bitmap;
    this.width = bitmap.width;
    this.height = bitmap.height;
  }

  dispose(): void {
    if (this.source instanceof ImageBitmap) {
      this.source.close();
    }
  }
}

class BrowserCanvasDecodedImage implements DecodedImage {
  readonly width: number;
  readonly height: number;
  readonly source: CanvasImageSource;

  constructor(canvas: OffscreenCanvas) {
    this.source = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  dispose(): void {
    // OffscreenCanvas has no explicit close; it is released by GC.
  }
}

class BrowserCanvasSurface implements CanvasSurface {
  readonly width: number;
  readonly height: number;
  private readonly canvas: OffscreenCanvas;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas = new OffscreenCanvas(width, height);
  }

  drawImage(image: DecodedImage, width: number, height: number): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new OptimizationError('ENCODE_FAILED', 'Canvas 2D is not available.');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(toSource(image), 0, 0, width, height);
  }

  async encode(format: ImageFormat, quality: number): Promise<Blob> {
    if (format === 'jpeg') {
      const flat = new OffscreenCanvas(this.width, this.height);
      const ctx = flat.getContext('2d');
      if (!ctx) {
        throw new OptimizationError('ENCODE_FAILED', 'Canvas 2D is not available.');
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, flat.width, flat.height);
      ctx.drawImage(this.canvas, 0, 0);
      return flat.convertToBlob({ type: 'image/jpeg', quality });
    }

    const mime = format === 'png' ? 'image/png' : 'image/webp';
    return this.canvas.convertToBlob(
      format === 'png' ? { type: mime } : { type: mime, quality },
    );
  }
}

export function isBrowserEngineSupported(): boolean {
  return (
    typeof OffscreenCanvas === 'function' &&
    typeof createImageBitmap === 'function' &&
    'convertToBlob' in OffscreenCanvas.prototype
  );
}

export function createBrowserAdapter(): ImageEngineAdapter {
  return {
    async decode(
      data: ArrayBuffer | Uint8Array,
      mimeType: string,
      limits: DecodeLimits = DEFAULT_LIMITS,
    ): Promise<DecodedImage> {
      try {
        const bytes = data instanceof Uint8Array ? new Uint8Array(data) : new Uint8Array(data);
        const options: ImageBitmapOptions = {
          imageOrientation: 'from-image',
        };
        const header = parseImageHeader(bytes);
        if (header) {
          const dims = computeDecodeDimensions(
            header.width,
            header.height,
            limits.maxDimension,
            limits.maxPixels,
          );
          if (dims.width < header.width || dims.height < header.height) {
            options.resizeWidth = dims.width;
            options.resizeHeight = dims.height;
            options.resizeQuality = 'high';
          }
        }
        const bitmap = await createImageBitmap(
          new Blob([bytes], { type: mimeType }),
          options,
        );
        return new BrowserDecodedImage(bitmap);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new OptimizationError(
          'DECODE_FAILED',
          'The browser could not decode this image.',
          { reason },
        );
      }
    },

    createSurface(width: number, height: number): CanvasSurface {
      return new BrowserCanvasSurface(width, height);
    },

    async applyTransform(
      image: DecodedImage,
      transform: ImageTransform,
      limits: DecodeLimits = DEFAULT_LIMITS,
    ): Promise<DecodedImage> {
      const normalized = normalizeTransform(transform);
      if (isIdentityTransform(normalized)) {
        return image;
      }

      const source = toSource(image);
      const sourceWidth = image.width;
      const sourceHeight = image.height;
      const degrees = normalized.rotationDegrees ?? 0;
      const bounds = computeRotatedBounds(sourceWidth, sourceHeight, degrees);
      const scale = Math.min(
        1,
        limits.maxDimension / Math.max(1, bounds.width),
        limits.maxDimension / Math.max(1, bounds.height),
        Math.sqrt(limits.maxPixels / Math.max(1, bounds.width * bounds.height)),
      );
      const targetWidth = Math.max(1, Math.round(bounds.width * scale));
      const targetHeight = Math.max(1, Math.round(bounds.height * scale));

      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new OptimizationError('ENCODE_FAILED', 'Canvas 2D is not available.');
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.scale(scale, scale);
      ctx.rotate(rotationRadians(degrees));
      ctx.scale(normalized.flipHorizontal ? -1 : 1, normalized.flipVertical ? -1 : 1);
      ctx.drawImage(source, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);

      const crop = cropToPixels(normalized.crop ?? { x: 0, y: 0, width: 1, height: 1 }, targetWidth, targetHeight);
      if (crop.x === 0 && crop.y === 0 && crop.width === targetWidth && crop.height === targetHeight) {
        return new BrowserCanvasDecodedImage(canvas);
      }

      const cropCanvas = new OffscreenCanvas(crop.width, crop.height);
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) {
        throw new OptimizationError('ENCODE_FAILED', 'Canvas 2D is not available.');
      }
      cropCtx.imageSmoothingEnabled = true;
      cropCtx.imageSmoothingQuality = 'high';
      cropCtx.drawImage(canvas, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      return new BrowserCanvasDecodedImage(cropCanvas);
    },
  };
}

function toSource(image: DecodedImage): CanvasImageSource {
  if (image instanceof BrowserDecodedImage || image instanceof BrowserCanvasDecodedImage) {
    return image.source;
  }
  throw new OptimizationError('ENCODE_FAILED', 'Unsupported decoded image source.');
}
