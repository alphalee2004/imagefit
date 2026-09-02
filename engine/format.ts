import type { ImageFormat } from './types';

const MIME_BY_FORMAT: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const EXTENSION_BY_FORMAT: Record<ImageFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

export function detectInputFormat(
  mimeType: string,
  name?: string,
): ImageFormat | null {
  const mime = mimeType.toLowerCase();
  const fileName = name ?? '';

  if (
    mime === MIME_BY_FORMAT.jpeg ||
    mime === 'image/jpg' ||
    /\.jpe?g$/i.test(fileName)
  ) {
    return 'jpeg';
  }
  if (mime === MIME_BY_FORMAT.png || /\.png$/i.test(fileName)) {
    return 'png';
  }
  if (mime === MIME_BY_FORMAT.webp || /\.webp$/i.test(fileName)) {
    return 'webp';
  }
  return null;
}

export function mimeForFormat(format: ImageFormat): string {
  return MIME_BY_FORMAT[format];
}

export function extensionForFormat(format: ImageFormat): string {
  return EXTENSION_BY_FORMAT[format];
}

export function isSupportedInputFormat(
  mimeType: string,
  name?: string,
): boolean {
  return detectInputFormat(mimeType, name) !== null;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
