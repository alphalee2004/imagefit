import { createBrowserAdapter } from '../adapters/browser';
import { OptimizationError } from '../errors';
import { createImageEngine, createImageInspector } from '../imageEngine';
import type {
  CancellationToken,
  EngineStage,
  ImageMetadata,
  OptimizationResult,
} from '../types';
import type { WorkerRequest, WorkerResponse } from './protocol';

const scope = self as unknown as {
  postMessage(message: WorkerResponse): void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

const adapter = createBrowserAdapter();
const optimizeImage = createImageEngine(adapter);
const inspectImage = createImageInspector(adapter);
const cancelTokens = new Map<number, CancellationToken>();
const maxOutputDimension = getAdaptiveMaxDimension();

const PROGRESS_BY_STAGE: Record<EngineStage, number> = {
  decoding: 10,
  planning: 20,
  'searching-quality': 55,
  resizing: 75,
  encoding: 90,
};

scope.onmessage = (event) => {
  const request = event.data;
  if (request.operation === 'cancel') {
    const token = cancelTokens.get(request.payload.targetRequestId ?? -1);
    if (token) token.aborted = true;
    return;
  }
  void handleRequest(request);
};

async function handleRequest(request: WorkerRequest): Promise<void> {
  const token: CancellationToken = { aborted: false };
  cancelTokens.set(request.requestId, token);
  let lastProgress = -1;
  const sendProgress = (stage: EngineStage, progress: number, detail?: string) => {
    if (progress === lastProgress) return;
    lastProgress = progress;
    scope.postMessage({ requestId: request.requestId, status: 'progress', stage, progress, detail });
  };

  try {
    const input = request.payload.input;
    if (!input) {
      throw new OptimizationError('INVALID_INPUT', 'Image input is missing.');
    }
    const options = request.payload.options ?? {};
    const onProgress = (stage: EngineStage, detail?: string) =>
      sendProgress(stage, PROGRESS_BY_STAGE[stage], detail);

    let result: ImageMetadata | OptimizationResult;
    switch (request.operation) {
      case 'inspect':
        result = await inspectImage(input, token, maxOutputDimension);
        break;
      case 'optimize':
        result = await optimizeImage(
          input,
          { ...options, cancellationToken: token, maxOutputDimension },
          onProgress,
        );
        break;
      case 'resize':
        result = await optimizeImage(
          input,
          {
            targetSize: null,
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
            targetFormat: options.targetFormat,
            cancellationToken: token,
            maxOutputDimension,
          },
          onProgress,
        );
        break;
      case 'convert':
        result = await optimizeImage(
          input,
          {
            targetSize: null,
            targetFormat: options.targetFormat,
            fallbackQuality: options.fallbackQuality,
            cancellationToken: token,
            maxOutputDimension,
          },
          onProgress,
        );
        break;
      default:
        throw new OptimizationError('INTERNAL_ERROR', 'Unknown worker operation.');
    }

    sendProgress('encoding', 100);
    scope.postMessage({ requestId: request.requestId, status: 'success', result });
  } catch (error) {
    scope.postMessage({
      requestId: request.requestId,
      status: 'error',
      error: serializeError(error),
    });
  } finally {
    cancelTokens.delete(request.requestId);
    if (request.payload.input) {
      request.payload.input.data = new ArrayBuffer(0);
    }
  }
}

function serializeError(error: unknown) {
  if (error instanceof OptimizationError) return error.toJSON();
  return {
    code: 'INTERNAL_ERROR' as const,
    message: error instanceof Error ? error.message : String(error),
  };
}

function getAdaptiveMaxDimension(): number | undefined {
  if (typeof navigator === 'undefined' || !('deviceMemory' in navigator)) {
    return undefined;
  }
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return deviceMemory !== undefined && deviceMemory <= 4 ? 4096 : undefined;
}
