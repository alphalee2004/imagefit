import { describe, expect, it } from 'vitest';
import {
  binarySearchMaxFeasible,
  computeDecodeDimensions,
  computeBaseDimensions,
  MAX_DIMENSION,
  MIN_OUTPUT_SIDE,
  refineFeasibleValue,
  scaleFloorFor,
} from '../optimizer';

describe('binarySearchMaxFeasible', () => {
  it('finds the largest feasible value in a monotonic space', async () => {
    const probe = async (value: number) => 100_000 + value * 1_000_000;
    const found = await binarySearchMaxFeasible(
      probe,
      { min: 0.05, max: 1, iterations: 12 },
      500_000,
    );

    expect(found).not.toBeNull();
    expect(found!.value).toBeGreaterThan(0.38);
    expect(found!.value).toBeLessThan(0.42);
  });

  it('returns null when even the minimum is too large', async () => {
    const found = await binarySearchMaxFeasible(
      async () => 10_000,
      { min: 0.05, max: 1, iterations: 8 },
      100,
    );

    expect(found).toBeNull();
  });
});

describe('refineFeasibleValue', () => {
  it('climbs past a non-monotonic encoder bump to a later feasible region', async () => {
    const probe = async (value: number) =>
      200_000 +
      value * 100_000 +
      (value >= 0.3 && value <= 0.6 ? 2_000_000 : 0);
    const range = { min: 0.05, max: 1, iterations: 10 };
    const found = await binarySearchMaxFeasible(probe, range, 900_000);

    expect(found).not.toBeNull();
    expect(found!.value).toBeLessThan(0.3);

    const refined = await refineFeasibleValue(probe, found!, range, 900_000);
    expect(refined.value).toBeGreaterThan(0.6);
    expect(refined.size).toBeLessThanOrEqual(900_000);
  });
});

describe('computeBaseDimensions', () => {
  it('downscales to maxWidth while preserving aspect ratio', () => {
    const dims = computeBaseDimensions(4000, 3000, 2000);
    expect(dims).toEqual({ width: 2000, height: 1500, scale: 0.5 });
  });

  it('never upscales beyond the source size', () => {
    const dims = computeBaseDimensions(4000, 3000, 5000, 5000);
    expect(dims.width).toBe(4000);
    expect(dims.height).toBe(3000);
  });

  it('caps oversized sources to MAX_DIMENSION', () => {
    const dims = computeBaseDimensions(12_000, 6000);
    expect(dims.width).toBe(MAX_DIMENSION);
    expect(dims.height).toBe(4096);
  });

  it('honors a lower working resolution for low-memory devices', () => {
    const dims = computeBaseDimensions(8000, 6000, undefined, undefined, 4096);
    expect(dims.width).toBe(4096);
    expect(dims.height).toBe(3072);
  });

  it('keeps a minimum output side for tiny sources', () => {
    const dims = computeBaseDimensions(8, 6);
    expect(dims.width).toBe(MIN_OUTPUT_SIDE);
    expect(dims.height).toBe(MIN_OUTPUT_SIDE);
  });
});

describe('scaleFloorFor', () => {
  it('respects the global floor for large images', () => {
    expect(scaleFloorFor({ width: 2000, height: 1500, scale: 1 })).toBe(0.02);
  });

  it('stops at the minimum output side for small images', () => {
    expect(scaleFloorFor({ width: 40, height: 30, scale: 1 })).toBe(0.4);
  });
});

describe('computeDecodeDimensions', () => {
  it('caps decode dimensions before allocation', () => {
    const dims = computeDecodeDimensions(8000, 6000, 4096, 32_000_000);
    expect(dims).toEqual({ width: 4096, height: 3072 });
  });

  it('caps total pixels independently of max dimension', () => {
    const dims = computeDecodeDimensions(12_000, 12_000, 8192, 32_000_000);
    expect(dims.width).toBeLessThanOrEqual(8192);
    expect(dims.height).toBeLessThanOrEqual(8192);
    expect(dims.width * dims.height).toBeLessThanOrEqual(32_000_000);
  });
});
