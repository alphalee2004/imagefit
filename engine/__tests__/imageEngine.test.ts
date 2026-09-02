import { describe, expect, it } from 'vitest';
import type {
  CanvasSurface,
  DecodedImage,
  ImageEngineAdapter,
} from '../adapters';
import { OptimizationError } from '../errors';
import { createImageEngine } from '../imageEngine';
import type { ImageFormat, ImageTransform, OptimizationInput } from '../types';

type FakeEncoder = (
  format: ImageFormat,
  width: number,
  height: number,
  quality: number,
) => number;

class FakeDecodedImage implements DecodedImage {
  disposed = false;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {}

  dispose(): void {
    this.disposed = true;
  }
}

class FakeSurface implements CanvasSurface {
  lastQuality: number | null = null;

  constructor(
    readonly width: number,
    readonly height: number,
    private readonly encoder: FakeEncoder,
  ) {}

  drawImage(): void {}

  async encode(format: ImageFormat, quality: number): Promise<Blob> {
    this.lastQuality = quality;
    const size = Math.max(1, Math.round(this.encoder(format, this.width, this.height, quality)));
    return new Blob([new Uint8Array(size)]);
  }
}

function createFakeAdapter(
  width: number,
  height: number,
  encoder: FakeEncoder,
): {
  adapter: ImageEngineAdapter;
  decodedImages: FakeDecodedImage[];
  appliedTransforms: ImageTransform[];
} {
  const decodedImages: FakeDecodedImage[] = [];
  const appliedTransforms: ImageTransform[] = [];
  return {
    decodedImages,
    adapter: {
      async decode(): Promise<DecodedImage> {
        const image = new FakeDecodedImage(width, height);
        decodedImages.push(image);
        return image;
      },
      createSurface(surfaceWidth: number, surfaceHeight: number): CanvasSurface {
        return new FakeSurface(surfaceWidth, surfaceHeight, encoder);
      },
      async applyTransform(image: DecodedImage, transform: ImageTransform): Promise<DecodedImage> {
        appliedTransforms.push(transform);
        return new FakeDecodedImage(image.width, image.height);
      },
    },
    appliedTransforms,
  };
}

const lossyEncoder: FakeEncoder = (_format, width, height, quality) =>
  width * height * (0.4 + quality * 1.1);

const pngEncoder: FakeEncoder = (_format, width, height) => width * height * 0.9;

const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff, 0xe0],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/webp': [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
};

function input(width: number, height: number, mimeType = 'image/jpeg'): OptimizationInput {
  const data = new Uint8Array(2_000_000);
  data.set(MAGIC_BYTES[mimeType] ?? MAGIC_BYTES['image/jpeg'], 0);
  return { data, mimeType };
}

describe('createImageEngine', () => {
  it('keeps original resolution and binary-searches quality when the target fits', async () => {
    const { adapter } = createFakeAdapter(2000, 1500, lossyEncoder);
    const optimize = createImageEngine(adapter);

    const result = await optimize(input(2000, 1500), { targetSize: 2_000_000 });

    expect(result.targetReached).toBe(true);
    expect(result.width).toBe(2000);
    expect(result.height).toBe(1500);
    expect(result.outputSize).toBeLessThanOrEqual(2_000_000);
    expect(result.quality).toBeGreaterThan(0.23);
    expect(result.quality).toBeLessThan(0.26);
    expect(result.encodeAttempts).toBeGreaterThan(0);
  });

  it('reduces resolution and re-runs quality search when the target is tight', async () => {
    const { adapter } = createFakeAdapter(2000, 1500, lossyEncoder);
    const optimize = createImageEngine(adapter);

    const result = await optimize(input(2000, 1500), { targetSize: 400_000 });

    expect(result.targetReached).toBe(true);
    expect(result.width).toBeLessThan(2000);
    expect(result.height).toBeLessThan(1500);
    expect(result.outputSize).toBeLessThanOrEqual(400_000);
  });

  it('returns a clear error when even the minimum resolution cannot fit', async () => {
    const { adapter } = createFakeAdapter(5000, 5000, lossyEncoder);
    const optimize = createImageEngine(adapter);

    const promise = optimize(input(5000, 5000), { targetSize: 1000 });

    await expect(promise).rejects.toMatchObject({
      code: 'TARGET_UNREACHABLE',
      details: { targetSize: 1000 },
    });
  });

  it('uses the fallback quality when no target size is set', async () => {
    const { adapter } = createFakeAdapter(2000, 1500, lossyEncoder);
    const optimize = createImageEngine(adapter);

    const result = await optimize(input(2000, 1500), {
      targetFormat: 'jpeg',
    });

    expect(result.quality).toBe(0.92);
    expect(result.targetSize).toBeNull();
    expect(result.targetReached).toBe(true);
  });

  it('respects maxWidth without upscaling', async () => {
    const { adapter } = createFakeAdapter(2000, 1500, lossyEncoder);
    const optimize = createImageEngine(adapter);

    const result = await optimize(input(2000, 1500), {
      maxWidth: 1000,
      targetFormat: 'jpeg',
    });

    expect(result.width).toBe(1000);
    expect(result.height).toBe(750);
    expect(result.quality).toBe(0.92);
  });

  it('targets PNG by resolution search and reports null quality', async () => {
    const { adapter } = createFakeAdapter(2000, 1500, pngEncoder);
    const optimize = createImageEngine(adapter);

    const result = await optimize(input(2000, 1500, 'image/png'), {
      targetSize: 800_000,
      targetFormat: 'png',
    });

    expect(result.format).toBe('png');
    expect(result.quality).toBeNull();
    expect(result.width).toBeLessThan(2000);
    expect(result.outputSize).toBeLessThanOrEqual(800_000);
  });

  it('rejects unsupported input formats', async () => {
    const { adapter } = createFakeAdapter(100, 100, lossyEncoder);
    const optimize = createImageEngine(adapter);

    const promise = optimize({ data: new Uint8Array(10), mimeType: 'image/avif' });

    await expect(promise).rejects.toBeInstanceOf(OptimizationError);
    await expect(promise).rejects.toMatchObject({ code: 'UNSUPPORTED_INPUT_FORMAT' });
  });

  it('rejects files whose content does not match the declared type', async () => {
    const { adapter } = createFakeAdapter(100, 100, lossyEncoder);
    const optimize = createImageEngine(adapter);
    const data = new Uint8Array(1000);
    data.set(MAGIC_BYTES['image/jpeg'], 0);

    const promise = optimize({ data, mimeType: 'image/png', name: 'fake.png' });

    await expect(promise).rejects.toMatchObject({ code: 'UNSUPPORTED_INPUT_FORMAT' });
  });

  it('rejects SVG disguised as JPEG', async () => {
    const { adapter } = createFakeAdapter(100, 100, lossyEncoder);
    const optimize = createImageEngine(adapter);
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    const promise = optimize({ data: svg, mimeType: 'image/jpeg', name: 'image.jpg' });

    await expect(promise).rejects.toMatchObject({ code: 'UNSUPPORTED_INPUT_FORMAT' });
  });

  it('rejects invalid input data', async () => {
    const { adapter } = createFakeAdapter(100, 100, lossyEncoder);
    const optimize = createImageEngine(adapter);

    const promise = optimize({
      data: 'not-bytes' as unknown as Uint8Array,
      mimeType: 'image/jpeg',
    });

    await expect(promise).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('disposes the decoded image after processing', async () => {
    const { adapter, decodedImages } = createFakeAdapter(800, 600, lossyEncoder);
    const optimize = createImageEngine(adapter);

    await optimize(input(800, 600), { targetSize: 100_000 });

    expect(decodedImages).toHaveLength(1);
    expect(decodedImages[0].disposed).toBe(true);
  });

  it('aborts between encodes when cancellation is requested', async () => {
    const token = { aborted: false };
    const cancellingEncoder: FakeEncoder = (_format, width, height, quality) => {
      token.aborted = true;
      return width * height * (0.4 + quality * 1.1);
    };
    const { adapter, decodedImages } = createFakeAdapter(1600, 1200, cancellingEncoder);
    const optimize = createImageEngine(adapter);

    const promise = optimize(input(1600, 1200), {
      targetSize: 100_000,
      cancellationToken: token,
    });

    await expect(promise).rejects.toMatchObject({ code: 'ABORTED' });
    expect(decodedImages[0].disposed).toBe(true);
  });

  it('applies a non-identity transform before optimization', async () => {
    const { adapter, appliedTransforms } = createFakeAdapter(2000, 1500, lossyEncoder);
    const optimize = createImageEngine(adapter);

    const result = await optimize(input(2000, 1500), {
      targetSize: 2_000_000,
      transform: {
        rotationDegrees: 90,
        crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
      },
    });

    expect(appliedTransforms).toHaveLength(1);
    expect(appliedTransforms[0].rotationDegrees).toBe(90);
    expect(appliedTransforms[0].crop).toEqual({
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.8,
    });
    expect(result.width).toBe(2000);
  });

  it('skips the transform pass for identity transforms', async () => {
    const { adapter, appliedTransforms } = createFakeAdapter(2000, 1500, lossyEncoder);
    const optimize = createImageEngine(adapter);

    await optimize(input(2000, 1500), { targetSize: 2_000_000 });

    expect(appliedTransforms).toHaveLength(0);
  });
});
