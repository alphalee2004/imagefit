import { describe, expect, it } from 'vitest';
import type { OptimizationResult } from '@/engine/types';
import { buildChangeSummary } from '../changeSummary';

function result(overrides: Partial<OptimizationResult>): OptimizationResult {
  return {
    outputBlob: new Blob(),
    outputSize: 90_000,
    width: 1600,
    height: 1200,
    format: 'jpeg',
    quality: 0.8,
    compressionRatio: 2,
    originalSize: 180_000,
    originalWidth: 1600,
    originalHeight: 1200,
    originalFormat: 'jpeg',
    targetSize: 100 * 1024,
    targetReached: true,
    scale: 1,
    durationMs: 10,
    encodeAttempts: 12,
    metadataPreserved: false,
    ...overrides,
  };
}

const original = {
  name: 'photo.jpg',
  size: 180_000,
  width: 1600,
  height: 1200,
  format: 'jpeg' as const,
};

describe('buildChangeSummary', () => {
  it('explains quality search when resolution is unchanged', () => {
    const lines = buildChangeSummary(original, result({}), false);
    expect(lines.join(' ')).toContain('resolution stayed at 1600×1200');
    expect(lines.join(' ')).toContain('high JPG encoding');
  });

  it('explains resolution reduction and suggests cropping', () => {
    const lines = buildChangeSummary(
      original,
      result({ width: 800, height: 600, quality: 0.65 }),
      false,
    );
    expect(lines.join(' ')).toContain('reduced from 1600×1200 to 800×600');
    expect(lines.join(' ')).toContain('Cropping out unneeded areas');
  });

  it('mentions edits and avoids a repeated crop hint after cropping', () => {
    const lines = buildChangeSummary(
      original,
      result({ width: 800, height: 600 }),
      true,
    );
    expect(lines.join(' ')).toContain('rotation, flip or crop was applied');
    expect(lines.join(' ')).not.toContain('Cropping out unneeded areas');
  });

  it('treats PNG as lossless', () => {
    const lines = buildChangeSummary(
      original,
      result({ format: 'png', quality: null }),
      false,
    );
    expect(lines.join(' ')).toContain('PNG was encoded losslessly');
  });

  it('recognizes images that were already close to the limit', () => {
    const lines = buildChangeSummary(
      original,
      result({ targetSize: 200 * 1024, originalSize: 180_000, outputSize: 100_000 }),
      false,
    );
    expect(lines.join(' ')).toContain('already close to the limit');
  });
});
