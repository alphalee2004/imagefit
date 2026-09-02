import { describe, expect, it } from 'vitest';
import { detectFormatFromBytes, parseImageHeader } from '../imageHeader';

function bytes(values: number[]): Uint8Array {
  return Uint8Array.from(values);
}

describe('detectFormatFromBytes', () => {
  it('recognizes JPEG, PNG and WebP magic', () => {
    expect(detectFormatFromBytes(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
    expect(detectFormatFromBytes(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      'png',
    );
    expect(
      detectFormatFromBytes(bytes([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])),
    ).toBe('webp');
  });

  it('rejects SVG and unknown content', () => {
    expect(detectFormatFromBytes(new TextEncoder().encode('<svg'))).toBeNull();
    expect(detectFormatFromBytes(bytes([0, 1, 2, 3]))).toBeNull();
  });
});

describe('parseImageHeader', () => {
  it('parses PNG dimensions from IHDR', () => {
    const png = [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // signature
      0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x06, 0x40, // width 1600
      0x00, 0x00, 0x04, 0xb0, // height 1200
      8, 6, 0, 0, 0,
    ];
    expect(parseImageHeader(bytes(png))).toEqual({ format: 'png', width: 1600, height: 1200 });
  });

  it('parses JPEG dimensions from SOF0', () => {
    const jpeg = [
      0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x04, 0xb0, 0x06, 0x40, 0x03,
      0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    ];
    expect(parseImageHeader(bytes(jpeg))).toEqual({ format: 'jpeg', width: 1600, height: 1200 });
  });

  it('parses WebP VP8L dimensions', () => {
    const bits = ((1200 - 1) << 14) | (1600 - 1);
    const webp = [
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x4c, 0, 0, 0, 0, 0,
      bits & 0xff, (bits >> 8) & 0xff, (bits >> 16) & 0xff, (bits >> 24) & 0xff,
    ];
    expect(parseImageHeader(bytes(webp))).toEqual({ format: 'webp', width: 1600, height: 1200 });
  });
});
