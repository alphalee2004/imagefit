import { describe, expect, it } from 'vitest';
import { OptimizationError } from '../errors';

describe('OptimizationError', () => {
  it('carries a stable code and details', () => {
    const error = new OptimizationError(
      'UNSUPPORTED_INPUT_FORMAT',
      'Use JPG, PNG, or WebP.',
      { format: 'avif' },
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('OptimizationError');
    expect(error.code).toBe('UNSUPPORTED_INPUT_FORMAT');
    expect(error.details).toEqual({ format: 'avif' });
  });

  it('serializes and restores across worker boundaries', () => {
    const original = new OptimizationError('DECODE_FAILED', 'Could not decode.');
    const restored = OptimizationError.fromJSON(original.toJSON());

    expect(restored).toBeInstanceOf(OptimizationError);
    expect(restored.code).toBe('DECODE_FAILED');
    expect(restored.message).toBe('Could not decode.');
  });
});
