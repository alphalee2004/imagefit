import { OptimizationError } from '../errors';
import type {
  EngineStage,
  ImageFormat,
  ImageMetadata,
  OptimizationInput,
  OptimizationOptions,
  OptimizationResult,
} from '../types';
import type { WorkerOperation, WorkerRequest, WorkerResponse } from './protocol';

export type ProgressListener = (stage: EngineStage, progress: number) => void;

export interface EngineClient {
  inspect(input: OptimizationInput, onProgress?: ProgressListener): Promise<ImageMetadata>;
  optimize(
    input: OptimizationInput,
    options?: OptimizationOptions,
    onProgress?: ProgressListener,
  ): Promise<OptimizationResult>;
  resize(
    input: OptimizationInput,
    options: { maxWidth?: number; maxHeight?: number; targetFormat?: ImageFormat },
    onProgress?: ProgressListener,
  ): Promise<OptimizationResult>;
  convert(
    input: OptimizationInput,
    options: { targetFormat: ImageFormat; fallbackQuality?: number },
    onProgress?: ProgressListener,
  ): Promise<OptimizationResult>;
  cancel(requestId: number): void;
  cancelAll(): void;
  dispose(): void;
}

interface PendingTask {
  resolve: (result: ImageMetadata | OptimizationResult) => void;
  reject: (error: Error) => void;
  onProgress?: ProgressListener;
}

export class WorkerEngineClient implements EngineClient {
  private worker: Worker | null = null;
  private nextRequestId = 1;
  private readonly pending = new Map<number, PendingTask>();
  private disposed = false;

  inspect(input: OptimizationInput, onProgress?: ProgressListener): Promise<ImageMetadata> {
    return this.post('inspect', input, undefined, onProgress) as Promise<ImageMetadata>;
  }

  optimize(
    input: OptimizationInput,
    options?: OptimizationOptions,
    onProgress?: ProgressListener,
  ): Promise<OptimizationResult> {
    return this.post('optimize', input, options, onProgress) as Promise<OptimizationResult>;
  }

  resize(
    input: OptimizationInput,
    options: { maxWidth?: number; maxHeight?: number; targetFormat?: ImageFormat },
    onProgress?: ProgressListener,
  ): Promise<OptimizationResult> {
    return this.post('resize', input, { targetSize: null, ...options }, onProgress) as Promise<
      OptimizationResult
    >;
  }

  convert(
    input: OptimizationInput,
    options: { targetFormat: ImageFormat; fallbackQuality?: number },
    onProgress?: ProgressListener,
  ): Promise<OptimizationResult> {
    return this.post('convert', input, { targetSize: null, ...options }, onProgress) as Promise<
      OptimizationResult
    >;
  }

  cancel(requestId: number): void {
    const task = this.pending.get(requestId);
    if (!task) return;
    this.pending.delete(requestId);
    task.reject(new OptimizationError('ABORTED', 'Operation cancelled.'));
    this.worker?.postMessage({
      requestId: this.nextRequestId,
      operation: 'cancel',
      payload: { targetRequestId: requestId },
    });
    this.nextRequestId += 1;
  }

  cancelAll(): void {
    for (const requestId of [...this.pending.keys()]) {
      this.cancel(requestId);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.cancelAll();
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }

  private post(
    operation: WorkerOperation,
    input: OptimizationInput,
    options: OptimizationOptions | undefined,
    onProgress: ProgressListener | undefined,
  ): Promise<ImageMetadata | OptimizationResult> {
    if (this.disposed) {
      return Promise.reject(
        new OptimizationError('WORKER_UNAVAILABLE', 'The image engine is no longer available.'),
      );
    }

    const requestId = this.nextRequestId;
    this.nextRequestId += 1;

    return new Promise<ImageMetadata | OptimizationResult>((resolve, reject) => {
      const worker = this.ensureWorker();
      this.pending.set(requestId, { resolve, reject, onProgress });

      const bytes = new Uint8Array(input.data);
      const data = bytes.buffer;

      const request: WorkerRequest = {
        requestId,
        operation,
        payload: {
          input: { data, mimeType: input.mimeType, name: input.name },
          options,
        },
      };
      worker.postMessage(request, [data]);
    });
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;

    const created = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    created.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handleResponse(event.data);
    };
    created.onerror = (event) => {
      this.handleCrash(event.message || 'Image processing worker crashed.');
    };
    this.worker = created;
    return created;
  }

  private handleResponse(response: WorkerResponse): void {
    const task = this.pending.get(response.requestId);
    if (!task) return;

    if (response.status === 'progress') {
      task.onProgress?.(response.stage, response.progress);
      return;
    }

    this.pending.delete(response.requestId);
    if (response.status === 'success') {
      task.resolve(response.result);
    } else {
      task.reject(OptimizationError.fromJSON(response.error));
    }
  }

  private handleCrash(message: string): void {
    const error = new OptimizationError('WORKER_UNAVAILABLE', message);
    for (const task of this.pending.values()) task.reject(error);
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
  }
}
