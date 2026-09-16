import { describe, expect, it } from 'vitest';
import {
  batchQueueReducer,
  buildBatchOutputName,
  INITIAL_BATCH_STATE,
  makeUniqueFilename,
  prepareBatchItems,
  summarizeBatch,
  type BatchItem,
} from '../batchQueue';
import type { OptimizationResult } from '@/engine/types';

const result: OptimizationResult = {
  outputBlob: new Blob(['optimized']),
  outputSize: 700,
  width: 800,
  height: 600,
  format: 'webp',
  quality: 0.8,
  compressionRatio: 2,
  originalSize: 1400,
  originalWidth: 1000,
  originalHeight: 750,
  originalFormat: 'jpeg',
  targetSize: 1024,
  targetReached: true,
  scale: 0.8,
  durationMs: 20,
  encodeAttempts: 4,
  metadataPreserved: false,
};

function makeFile(name: string, type = 'image/jpeg', size = 1400): File {
  return new File([new Uint8Array(size)], name, { type });
}

function makeItem(overrides: Partial<BatchItem> = {}): BatchItem {
  return {
    id: 'item-1',
    file: makeFile('photo.jpg'),
    name: 'photo.jpg',
    size: 1400,
    mimeType: 'image/jpeg',
    format: 'jpeg',
    status: 'queued',
    progress: 0,
    stage: null,
    result: null,
    error: null,
    ...overrides,
  };
}

describe('prepareBatchItems', () => {
  it('accepts supported images and rejects unsupported or oversized files', () => {
    const oversized = makeFile('large.jpg', 'image/jpeg', 50 * 1024 * 1024 + 1);
    const { items, rejected } = prepareBatchItems(
      [
        makeFile('photo.jpg'),
        makeFile('graphic.png', 'image/png'),
        makeFile('scan.webp', 'image/webp'),
        makeFile('notes.txt', 'text/plain'),
        oversized,
      ],
      0,
      (() => {
        let index = 0;
        return () => `item-${++index}`;
      })(),
    );

    expect(items.map((item) => item.format)).toEqual(['jpeg', 'png', 'webp']);
    expect(items.map((item) => item.id)).toEqual(['item-1', 'item-2', 'item-3']);
    expect(rejected).toHaveLength(2);
    expect(rejected[0].name).toBe('notes.txt');
    expect(rejected[1].name).toBe('large.jpg');
  });

  it('does not add more than the batch file limit', () => {
    const files = Array.from({ length: 22 }, (_, index) =>
      makeFile(`photo-${index}.jpg`),
    );
    const { items, rejected } = prepareBatchItems(
      files,
      0,
      (() => {
        let index = 0;
        return () => `item-${++index}`;
      })(),
    );

    expect(items).toHaveLength(20);
    expect(rejected).toHaveLength(2);
  });
});

describe('batchQueueReducer', () => {
  it('caps additions at the batch file limit', () => {
    const items = Array.from({ length: 22 }, (_, index) =>
      makeItem({ id: `item-${index}`, name: `photo-${index}.jpg` }),
    );
    const next = batchQueueReducer(INITIAL_BATCH_STATE, { type: 'add', items });

    expect(next.items).toHaveLength(20);
  });

  it('moves one item through processing to completion', () => {
    const item = makeItem();
    const added = batchQueueReducer(INITIAL_BATCH_STATE, { type: 'add', items: [item] });
    const started = batchQueueReducer(added, { type: 'start' });
    const processing = batchQueueReducer(started, {
      type: 'item-processing',
      id: item.id,
    });
    const progressed = batchQueueReducer(processing, {
      type: 'item-progress',
      id: item.id,
      stage: 'searching-quality',
      progress: 55,
    });
    const done = batchQueueReducer(progressed, {
      type: 'item-done',
      id: item.id,
      result,
    });
    const finished = batchQueueReducer(done, { type: 'finish' });

    expect(finished.runStatus).toBe('idle');
    expect(finished.items[0]).toMatchObject({
      status: 'done',
      progress: 100,
      result,
      error: null,
    });
  });

  it('keeps failed items retryable and isolates the failure', () => {
    const first = makeItem({ id: 'first' });
    const second = makeItem({ id: 'second', name: 'second.jpg' });
    const added = batchQueueReducer(INITIAL_BATCH_STATE, {
      type: 'add',
      items: [first, second],
    });
    const failed = batchQueueReducer(added, {
      type: 'item-failed',
      id: first.id,
      error: 'Decode failed.',
    });
    const retried = batchQueueReducer(failed, { type: 'retry', id: first.id });

    expect(failed.items[1].status).toBe('queued');
    expect(retried.items[0]).toMatchObject({
      status: 'queued',
      progress: 0,
      result: null,
      error: null,
    });
  });

  it('returns a cancelled in-flight item to the queue', () => {
    const item = makeItem({ status: 'processing', progress: 55 });
    const cancelling = batchQueueReducer(
      { items: [item], runStatus: 'running' },
      { type: 'stop' },
    );
    const cancelled = batchQueueReducer(cancelling, {
      type: 'item-cancelled',
      id: item.id,
    });
    const finished = batchQueueReducer(cancelled, { type: 'finish' });

    expect(finished.items[0]).toMatchObject({
      status: 'queued',
      progress: 0,
      stage: null,
    });
    expect(finished.runStatus).toBe('idle');
  });
});

describe('summarizeBatch', () => {
  it('summarizes completed and in-flight work', () => {
    const done = makeItem({
      id: 'done',
      status: 'done',
      progress: 100,
      result,
    });
    const processing = makeItem({
      id: 'processing',
      status: 'processing',
      progress: 50,
    });
    const failed = makeItem({
      id: 'failed',
      status: 'failed',
      error: 'Failed.',
    });

    expect(summarizeBatch([done, processing, failed])).toEqual({
      total: 3,
      queued: 0,
      processing: 1,
      completed: 1,
      failed: 1,
      originalBytes: 4200,
      outputBytes: 700,
      savedBytes: 700,
      savingsPercent: 50,
      progress: 83,
    });
  });
});

describe('batch output names', () => {
  it('builds a safe output name and resolves collisions', () => {
    const name = buildBatchOutputName(
      { name: 'product:photo.jpg' },
      { format: 'webp' },
    );
    expect(name).toBe('product_photo-optimized.webp');

    const used = new Set<string>();
    expect(makeUniqueFilename(name, used)).toBe(name);
    expect(makeUniqueFilename(name, used)).toBe('product_photo-optimized-2.webp');
    expect(makeUniqueFilename(name.toUpperCase(), used)).toBe(
      'PRODUCT_PHOTO-OPTIMIZED-3.WEBP',
    );
  });
});
