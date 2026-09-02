import type { ImageFormat } from './types';

export interface ImageHeaderInfo {
  format: ImageFormat;
  width: number;
  height: number;
}

export function detectFormatFromBytes(data: Uint8Array): ImageFormat | null {
  if (
    data.length >= 3 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[2] === 0xff
  ) {
    return 'jpeg';
  }
  if (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    data.length >= 12 &&
    data[0] === 0x52 &&
    data[1] === 0x49 &&
    data[2] === 0x46 &&
    data[3] === 0x46 &&
    data[8] === 0x57 &&
    data[9] === 0x45 &&
    data[10] === 0x42 &&
    data[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}

export function parseImageHeader(data: Uint8Array): ImageHeaderInfo | null {
  const format = detectFormatFromBytes(data);
  if (!format) return null;
  if (format === 'png') return parsePngHeader(data);
  if (format === 'webp') return parseWebpHeader(data);
  return parseJpegHeader(data);
}

function parsePngHeader(data: Uint8Array): ImageHeaderInfo | null {
  if (data.length < 24) return null;
  const width = readUint32BE(data, 16);
  const height = readUint32BE(data, 20);
  return width > 0 && height > 0 ? { format: 'png', width, height } : null;
}

function parseJpegHeader(data: Uint8Array): ImageHeaderInfo | null {
  let offset = 2;
  while (offset < data.length - 9) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = data[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 4 > data.length) break;
    const length = (data[offset + 2] << 8) | data[offset + 3];
    if (length < 2 || offset + 2 + length > data.length) break;
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isSof) {
      const height = (data[offset + 5] << 8) | data[offset + 6];
      const width = (data[offset + 7] << 8) | data[offset + 8];
      if (width > 0 && height > 0) return { format: 'jpeg', width, height };
    }
    offset += 2 + length;
  }
  return null;
}

function parseWebpHeader(data: Uint8Array): ImageHeaderInfo | null {
  const kind = String.fromCharCode(data[12], data[13], data[14], data[15]);
  if (kind === 'VP8X') {
    if (data.length < 30) return null;
    const width = 1 + readUint24LE(data, 24);
    const height = 1 + readUint24LE(data, 27);
    return width > 0 && height > 0 ? { format: 'webp', width, height } : null;
  }
  if (kind === 'VP8L') {
    if (data.length < 25) return null;
    const bits =
      data[21] | (data[22] << 8) | (data[23] << 16) | (data[24] << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return width > 0 && height > 0 ? { format: 'webp', width, height } : null;
  }
  if (kind === 'VP8 ') {
    if (data.length < 30) return null;
    const width = data[26] | (data[27] << 8);
    const height = data[28] | (data[29] << 8);
    return width > 0 && height > 0 ? { format: 'webp', width, height } : null;
  }
  return null;
}

function readUint32BE(data: Uint8Array, offset: number): number {
  return (
    ((data[offset] << 24) |
      (data[offset + 1] << 16) |
      (data[offset + 2] << 8) |
      data[offset + 3]) >>>
    0
  );
}

function readUint24LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16);
}
