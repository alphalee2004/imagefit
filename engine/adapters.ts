import type { ImageFormat } from './types';
import type { ImageTransform } from './types';

/**
 * Browser raster APIs (OffscreenCanvas, createImageBitmap) live behind these
 * interfaces so the core engine never touches DOM or worker globals directly.
 */
export interface DecodedImage {
  readonly width: number;
  readonly height: number;
  dispose(): void;
}

export interface CanvasSurface {
  readonly width: number;
  readonly height: number;
  drawImage(image: DecodedImage, width: number, height: number): void;
  encode(format: ImageFormat, quality: number): Promise<Blob>;
}

export interface ImageEngineAdapter {
  decode(
    data: ArrayBuffer | Uint8Array,
    mimeType: string,
    limits?: DecodeLimits,
  ): Promise<DecodedImage>;
  createSurface(width: number, height: number): CanvasSurface;
  applyTransform(
    image: DecodedImage,
    transform: ImageTransform,
    limits: DecodeLimits,
  ): Promise<DecodedImage>;
}

export interface DecodeLimits {
  maxDimension: number;
  maxPixels: number;
}
