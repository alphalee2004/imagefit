import { describe, expect, it } from 'vitest';
import {
  computeRotatedBounds,
  cropToPixels,
  isIdentityTransform,
  normalizeTransform,
} from '../transform';

describe('transform helpers', () => {
  it('normalizes degrees and defaults', () => {
    expect(normalizeTransform({ rotationDegrees: -90 })).toMatchObject({
      rotationDegrees: 270,
      flipHorizontal: false,
      flipVertical: false,
    });
    expect(normalizeTransform(undefined)).toEqual({});
  });

  it('detects identity transforms', () => {
    expect(isIdentityTransform(undefined)).toBe(true);
    expect(isIdentityTransform({ rotationDegrees: 360 })).toBe(true);
    expect(isIdentityTransform({ flipHorizontal: true })).toBe(false);
    expect(isIdentityTransform({ crop: { x: 0, y: 0, width: 0.5, height: 1 } })).toBe(false);
  });

  it('computes rotated bounding boxes', () => {
    expect(computeRotatedBounds(100, 50, 90)).toEqual({ width: 50, height: 100 });
    const square = computeRotatedBounds(100, 100, 45);
    expect(square.width).toBe(142);
    expect(square.height).toBe(142);
  });

  it('converts normalized crops to clamped pixels', () => {
    expect(cropToPixels({ x: 0.1, y: 0.2, width: 0.5, height: 0.4 }, 1000, 500)).toEqual({
      x: 100,
      y: 100,
      width: 500,
      height: 200,
    });
    expect(cropToPixels({ x: 2, y: -1, width: 2, height: 2 }, 100, 100)).toEqual({
      x: 99,
      y: 0,
      width: 1,
      height: 100,
    });
  });
});
