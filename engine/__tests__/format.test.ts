import { describe, expect, it } from 'vitest';
import {
  detectInputFormat,
  extensionForFormat,
  isSupportedInputFormat,
  mimeForFormat,
} from '../format';

describe('detectInputFormat', () => {
  it('detects JPEG by mime, including image/jpg', () => {
    expect(detectInputFormat('image/jpeg')).toBe('jpeg');
    expect(detectInputFormat('IMAGE/JPG')).toBe('jpeg');
  });

  it('falls back to the file extension when mime is empty', () => {
    expect(detectInputFormat('', 'photo.png')).toBe('png');
    expect(detectInputFormat('', 'photo.webp')).toBe('webp');
    expect(detectInputFormat('', 'photo.jpg')).toBe('jpeg');
  });

  it('rejects unsupported formats', () => {
    expect(detectInputFormat('image/avif')).toBeNull();
    expect(detectInputFormat('', 'photo.heic')).toBeNull();
    expect(isSupportedInputFormat('image/avif')).toBe(false);
  });
});

describe('format helpers', () => {
  it('maps formats to stable mime types', () => {
    expect(mimeForFormat('jpeg')).toBe('image/jpeg');
    expect(mimeForFormat('png')).toBe('image/png');
    expect(mimeForFormat('webp')).toBe('image/webp');
  });

  it('maps formats to file extensions', () => {
    expect(extensionForFormat('jpeg')).toBe('jpg');
    expect(extensionForFormat('png')).toBe('png');
    expect(extensionForFormat('webp')).toBe('webp');
  });
});
