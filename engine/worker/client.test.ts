import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OptimizationError } from '../errors';
import type { OptimizationResult } from '../types';
import { WorkerEngineClient } from './client';
import type { WorkerRequest, WorkerResponse } from './protocol';

const instances: FakeWorker[] = [];

class FakeWorker {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  messages: WorkerRequest[] = [];
  terminated = false;

  constructor() {
    instances.push(this);
  }

  postMessage(message: WorkerRequest): void {
    this.messages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(response: WorkerResponse): void {
    this.onmessage?.({ data: response } as MessageEvent<WorkerResponse>);
  }

  crash(message = 'worker crashed'): void {
    this.onerror?.({ message } as ErrorEvent);
  }
}

const fakeResult: OptimizationResult = {
  outputBlob: new Blob([new Uint8Array(10)]),
  outputSize: 10,
  width: 100,
  height: 80,
  format: 'jpeg',
  quality: 0.8,
  compressionRatio: 2,
  originalSize: 20,
  originalWidth: 200,
  originalHeight: 160,
  originalFormat: 'jpeg',
  targetSize: 10,
  targetReached: true,
  scale: 0.5,
  durationMs: 5,
  encodeAttempts: 3,
  metadataPreserved: false,
};

function input(): { data: Uint8Array; mimeType: string } {
  return { data: new Uint8Array(16), mimeType: 'image/jpeg' };
}

describe('WorkerEngineClient', () => {
  beforeEach(() => {
    instances.length = 0;
    vi.stubGlobal('Worker', FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts a typed optimize request and resolves the result', async () => {
    const client = new WorkerEngineClient();
    const promise = client.optimize(input(), { targetSize: 1024 });
    const worker = instances[0];
    const request = worker.messages[0];

    expect(request.operation).toBe('optimize');
    expect(request.payload.input?.data).toBeInstanceOf(ArrayBuffer);

    worker.emit({ requestId: request.requestId, status: 'success', result: fakeResult });
    await expect(promise).resolves.toEqual(fakeResult);
    client.dispose();
  });

  it('forwards progress callbacks', async () => {
    const client = new WorkerEngineClient();
    const seen: Array<{ stage: string; progress: number }> = [];
    const promise = client.optimize(input(), { targetSize: 1024 }, (stage, progress) => {
      seen.push({ stage, progress });
    });
    const worker = instances[0];
    const request = worker.messages[0];

    worker.emit({ requestId: request.requestId, status: 'progress', stage: 'decoding', progress: 10 });
    worker.emit({ requestId: request.requestId, status: 'success', result: fakeResult });
    await promise;

    expect(seen).toEqual([{ stage: 'decoding', progress: 10 }]);
    client.dispose();
  });

  it('rejects with a typed error on error responses', async () => {
    const client = new WorkerEngineClient();
    const promise = client.optimize(input(), { targetSize: 1024 });
    const worker = instances[0];
    const request = worker.messages[0];

    worker.emit({
      requestId: request.requestId,
      status: 'error',
      error: { code: 'UNSUPPORTED_INPUT_FORMAT', message: 'Bad format.' },
    });

    await expect(promise).rejects.toMatchObject({ code: 'UNSUPPORTED_INPUT_FORMAT' });
    client.dispose();
  });

  it('cancels all pending requests and tells the worker to stop', async () => {
    const client = new WorkerEngineClient();
    const promise = client.optimize(input(), { targetSize: 1024 });
    const worker = instances[0];
    const request = worker.messages[0];

    client.cancelAll();

    await expect(promise).rejects.toMatchObject({ code: 'ABORTED' });
    const cancelMessage = worker.messages.find((message) => message.operation === 'cancel');
    expect(cancelMessage?.payload.targetRequestId).toBe(request.requestId);
    client.dispose();
  });

  it('recovers after a worker crash by creating a fresh worker', async () => {
    const client = new WorkerEngineClient();
    const first = client.optimize(input(), { targetSize: 1024 });
    const worker = instances[0];

    worker.crash();
    await expect(first).rejects.toMatchObject({ code: 'WORKER_UNAVAILABLE' });
    expect(worker.terminated).toBe(true);

    const second = client.optimize(input(), { targetSize: 1024 });
    expect(instances).toHaveLength(2);
    const request = instances[1].messages[0];
    instances[1].emit({ requestId: request.requestId, status: 'success', result: fakeResult });
    await expect(second).resolves.toEqual(fakeResult);
    client.dispose();
  });

  it('rejects new work after dispose', async () => {
    const client = new WorkerEngineClient();
    client.dispose();

    await expect(client.optimize(input(), { targetSize: 1024 })).rejects.toMatchObject({
      code: 'WORKER_UNAVAILABLE',
    });
  });

  it('maps resize and convert operations', async () => {
    const client = new WorkerEngineClient();
    const resize = client.resize(input(), { maxWidth: 800 });
    const convert = client.convert(input(), { targetFormat: 'webp' });
    resize.catch(() => {});
    convert.catch(() => {});

    expect(instances[0].messages[0].operation).toBe('resize');
    expect(instances[0].messages[0].payload.options?.maxWidth).toBe(800);
    expect(instances[0].messages[1].operation).toBe('convert');
    expect(instances[0].messages[1].payload.options?.targetFormat).toBe('webp');
    client.dispose();
    await Promise.allSettled([resize, convert]);
  });

  it('restores serialized errors from the worker', async () => {
    const client = new WorkerEngineClient();
    const promise = client.optimize(input(), { targetSize: 1024 });
    const worker = instances[0];
    const request = worker.messages[0];

    worker.emit({
      requestId: request.requestId,
      status: 'error',
      error: {
        code: 'DECODE_FAILED',
        message: 'Could not decode.',
        details: { reason: 'corrupt' },
      },
    });

    const error = await promise.catch((value: unknown) => value);
    expect(error).toBeInstanceOf(OptimizationError);
    expect((error as OptimizationError).code).toBe('DECODE_FAILED');
    expect((error as OptimizationError).details).toEqual({ reason: 'corrupt' });
    client.dispose();
  });
});
