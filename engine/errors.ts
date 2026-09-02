export type OptimizationErrorCode =
  | 'UNSUPPORTED_INPUT_FORMAT'
  | 'INVALID_INPUT'
  | 'DECODE_FAILED'
  | 'ENCODE_FAILED'
  | 'DEVICE_LIMIT_EXCEEDED'
  | 'TARGET_UNREACHABLE'
  | 'ABORTED'
  | 'WORKER_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface SerializedOptimizationError {
  code: OptimizationErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export class OptimizationError extends Error {
  readonly code: OptimizationErrorCode;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: OptimizationErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'OptimizationError';
    this.code = code;
    this.details = details;
  }

  toJSON(): SerializedOptimizationError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  static fromJSON(serialized: SerializedOptimizationError): OptimizationError {
    return new OptimizationError(
      serialized.code,
      serialized.message,
      serialized.details,
    );
  }
}
