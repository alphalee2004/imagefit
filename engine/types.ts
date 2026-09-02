export type ImageFormat = 'jpeg' | 'png' | 'webp';

export interface CancellationToken {
  aborted: boolean;
}

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageTransform {
  rotationDegrees?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  crop?: NormalizedRect;
}

export type EngineStage =
  | 'decoding'
  | 'planning'
  | 'searching-quality'
  | 'resizing'
  | 'encoding';

/**
 * Engine input is deliberately framework- and DOM-free. The UI layer converts
 * a File to this shape before handing it to the worker client.
 */
export interface OptimizationInput {
  data: ArrayBuffer | Uint8Array;
  mimeType: string;
  name?: string;
}

export interface OptimizationOptions {
  /** Target output size in bytes. `null`/undefined means "no size constraint". */
  targetSize?: number | null;
  /** Desired output format. Defaults to the input format. */
  targetFormat?: ImageFormat;
  /** Maximum output width in pixels. Never upscales. */
  maxWidth?: number;
  /** Maximum output height in pixels. Never upscales. */
  maxHeight?: number;
  /**
   * Phase 1 does not preserve metadata. The flag exists so the public API does
   * not change when EXIF/ICC support is added later.
   */
  preserveMetadata?: boolean;
  /** Quality used when no target size is given. Defaults to 0.92. */
  fallbackQuality?: number;
  /** Set by the worker layer to support cancellation between encode attempts. */
  cancellationToken?: CancellationToken;
  /** Internal: caps the working resolution on low-memory devices. */
  maxOutputDimension?: number;
  /** Optional geometry edit applied before compression/conversion. */
  transform?: ImageTransform;
}

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: ImageFormat;
  mimeType: string;
}

export interface OptimizationResult {
  outputBlob: Blob;
  outputSize: number;
  width: number;
  height: number;
  format: ImageFormat;
  /** null for lossless formats such as PNG. */
  quality: number | null;
  /** originalSize / outputSize; > 1 means the file got smaller. */
  compressionRatio: number;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalFormat: ImageFormat;
  targetSize: number | null;
  targetReached: boolean;
  /** Output dimensions relative to the decoded input dimensions. */
  scale: number;
  durationMs: number;
  /** Number of encoder calls made while searching. */
  encodeAttempts: number;
  metadataPreserved: boolean;
}
