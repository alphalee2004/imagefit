import type { SerializedOptimizationError } from '../errors';
import type {
  EngineStage,
  ImageMetadata,
  OptimizationOptions,
  OptimizationResult,
} from '../types';

export type WorkerOperation =
  | 'inspect'
  | 'optimize'
  | 'resize'
  | 'convert'
  | 'cancel';

export interface WorkerInput {
  data: ArrayBuffer;
  mimeType: string;
  name?: string;
}

export interface WorkerRequest {
  requestId: number;
  operation: WorkerOperation;
  payload: {
    input?: WorkerInput;
    options?: OptimizationOptions;
    targetRequestId?: number;
  };
}

export type WorkerResponse =
  | {
      requestId: number;
      status: 'progress';
      stage: EngineStage;
      progress: number;
      detail?: string;
    }
  | {
      requestId: number;
      status: 'success';
      result: ImageMetadata | OptimizationResult;
    }
  | {
      requestId: number;
      status: 'error';
      error: SerializedOptimizationError;
    };
