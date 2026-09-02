import type { ImageTransform, NormalizedRect } from './types';

export const FULL_CROP: NormalizedRect = { x: 0, y: 0, width: 1, height: 1 };

export function normalizeTransform(transform?: ImageTransform): ImageTransform {
  if (!transform) return {};
  const rotationDegrees = normalizeDegrees(transform.rotationDegrees ?? 0);
  const flipHorizontal = transform.flipHorizontal === true;
  const flipVertical = transform.flipVertical === true;
  const crop = normalizeCrop(transform.crop);
  return { rotationDegrees, flipHorizontal, flipVertical, crop };
}

export function isIdentityTransform(transform?: ImageTransform): boolean {
  if (!transform) return true;
  return (
    normalizeDegrees(transform.rotationDegrees ?? 0) === 0 &&
    transform.flipHorizontal !== true &&
    transform.flipVertical !== true &&
    !hasActiveCrop(transform.crop)
  );
}

export function rotationRadians(degrees: number): number {
  return (normalizeDegrees(degrees) * Math.PI) / 180;
}

export function computeRotatedBounds(
  width: number,
  height: number,
  degrees: number,
): { width: number; height: number } {
  const radians = rotationRadians(degrees);
  const rawCos = Math.abs(Math.cos(radians));
  const rawSin = Math.abs(Math.sin(radians));
  const cos = rawCos < 1e-9 ? 0 : rawCos;
  const sin = rawSin < 1e-9 ? 0 : rawSin;
  const boundedWidth = Math.max(1, Math.ceil(width * cos + height * sin));
  const boundedHeight = Math.max(1, Math.ceil(width * sin + height * cos));
  return { width: boundedWidth, height: boundedHeight };
}

export function cropToPixels(
  rect: NormalizedRect,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number; width: number; height: number } {
  const normalized = normalizeCrop(rect);
  const x = clamp(Math.round(normalized.x * canvasWidth), 0, canvasWidth - 1);
  const y = clamp(Math.round(normalized.y * canvasHeight), 0, canvasHeight - 1);
  const width = clamp(
    Math.round(normalized.width * canvasWidth),
    1,
    canvasWidth - x,
  );
  const height = clamp(
    Math.round(normalized.height * canvasHeight),
    1,
    canvasHeight - y,
  );
  return { x, y, width, height };
}

function normalizeCrop(crop: NormalizedRect | undefined): NormalizedRect {
  if (!crop) return FULL_CROP;
  const x = clamp(Number.isFinite(crop.x) ? crop.x : 0, 0, 0.99);
  const y = clamp(Number.isFinite(crop.y) ? crop.y : 0, 0, 0.99);
  const width = clamp(
    Number.isFinite(crop.width) ? crop.width : 1,
    0.01,
    Math.min(1, 1 - x),
  );
  const height = clamp(
    Number.isFinite(crop.height) ? crop.height : 1,
    0.01,
    Math.min(1, 1 - y),
  );
  return { x, y, width, height };
}

function hasActiveCrop(crop: NormalizedRect | undefined): boolean {
  if (!crop) return false;
  return (
    crop.x > 0.001 ||
    crop.y > 0.001 ||
    crop.width < 0.999 ||
    crop.height < 0.999
  );
}

function normalizeDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0;
  return ((degrees % 360) + 360) % 360;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
