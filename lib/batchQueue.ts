import { detectInputFormat } from '../engine/format';
import type {
  EngineStage,
  ImageFormat,
  OptimizationResult,
} from '../engine/types';
import { formatExtension } from './toolConfig';
import { sanitizeFilename } from './utils';

export const MAX_BATCH_FILES = 20;
export const MAX_BATCH_FILE_BYTES = 50 * 1024 * 1024;

export type BatchItemStatus = 'queued' | 'processing' | 'done' | 'failed';
export type BatchRunStatus = 'idle' | 'running' | 'cancelling';

export interface BatchItem {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  format: ImageFormat;
  status: BatchItemStatus;
  progress: number;
  stage: EngineStage | null;
  result: OptimizationResult | null;
  error: string | null;
}

export interface BatchState {
  items: BatchItem[];
  runStatus: BatchRunStatus;
}

export interface BatchRejection {
  name: string;
  reason: string;
}

export interface BatchSummary {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  originalBytes: number;
  outputBytes: number;
  savedBytes: number;
  savingsPercent: number;
  progress: number;
}

export type BatchAction =
  | { type: 'add'; items: BatchItem[] }
  | { type: 'start' }
  | { type: 'item-processing'; id: string }
  | { type: 'item-progress'; id: string; stage: EngineStage; progress: number }
  | { type: 'item-done'; id: string; result: OptimizationResult }
  | { type: 'item-failed'; id: string; error: string }
  | { type: 'item-cancelled'; id: string }
  | { type: 'stop' }
  | { type: 'finish' }
  | { type: 'retry'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

export const INITIAL_BATCH_STATE: BatchState = {
  items: [],
  runStatus: 'idle',
};

export function batchQueueReducer(state: BatchState, action: BatchAction): BatchState {
  switch (action.type) {
    case 'add':
      if (state.runStatus !== 'idle' || action.items.length === 0) return state;
      return {
        ...state,
        items: [
          ...state.items,
          ...action.items.slice(0, Math.max(0, MAX_BATCH_FILES - state.items.length)),
        ],
      };
    case 'start':
      if (state.runStatus !== 'idle' || !state.items.some(isQueued)) return state;
      return { ...state, runStatus: 'running' };
    case 'item-processing':
      return updateItem(state, action.id, (item) => ({
        ...item,
        status: 'processing',
        progress: 0,
        stage: null,
        error: null,
      }));
    case 'item-progress':
      return updateItem(state, action.id, (item) => ({
        ...item,
        status: 'processing',
        stage: action.stage,
        progress: clamp(action.progress, 0, 100),
      }));
    case 'item-done':
      return updateItem(state, action.id, (item) => ({
        ...item,
        status: 'done',
        progress: 100,
        stage: 'encoding',
        result: action.result,
        error: null,
      }));
    case 'item-failed':
      return updateItem(state, action.id, (item) => ({
        ...item,
        status: 'failed',
        progress: 0,
        stage: null,
        result: null,
        error: action.error,
      }));
    case 'item-cancelled':
      return updateItem(state, action.id, (item) =>
        item.status === 'processing'
          ? {
              ...item,
              status: 'queued',
              progress: 0,
              stage: null,
              error: null,
            }
          : item,
      );
    case 'stop':
      if (state.runStatus !== 'running') return state;
      return { ...state, runStatus: 'cancelling' };
    case 'finish':
      return state.runStatus === 'idle' ? state : { ...state, runStatus: 'idle' };
    case 'retry':
      if (state.runStatus !== 'idle') return state;
      return updateItem(state, action.id, (item) =>
        item.status === 'failed'
          ? {
              ...item,
              status: 'queued',
              progress: 0,
              stage: null,
              result: null,
              error: null,
            }
          : item,
      );
    case 'remove':
      if (state.runStatus !== 'idle') return state;
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case 'clear':
      if (state.runStatus !== 'idle') return state;
      return INITIAL_BATCH_STATE;
  }
}

export function prepareBatchItems(
  files: Iterable<File>,
  existingCount: number,
  createId: () => string,
): { items: BatchItem[]; rejected: BatchRejection[] } {
  const items: BatchItem[] = [];
  const rejected: BatchRejection[] = [];

  for (const file of files) {
    if (existingCount + items.length >= MAX_BATCH_FILES) {
      rejected.push({
        name: file.name,
        reason: `Only ${MAX_BATCH_FILES} images can be processed in one batch.`,
      });
      continue;
    }
    if (file.size <= 0) {
      rejected.push({ name: file.name, reason: 'The file is empty.' });
      continue;
    }
    if (file.size > MAX_BATCH_FILE_BYTES) {
      rejected.push({ name: file.name, reason: 'The file is larger than 50 MB.' });
      continue;
    }

    const format = detectInputFormat(file.type, file.name);
    if (!format) {
      rejected.push({
        name: file.name,
        reason: 'Only JPG, PNG and WebP files are supported.',
      });
      continue;
    }

    items.push({
      id: createId(),
      file,
      name: file.name,
      size: file.size,
      mimeType: inputMimeType(file, format),
      format,
      status: 'queued',
      progress: 0,
      stage: null,
      result: null,
      error: null,
    });
  }

  return { items, rejected };
}

export function summarizeBatch(items: BatchItem[]): BatchSummary {
  const completed = items.filter((item) => item.status === 'done');
  const processing = items.filter((item) => item.status === 'processing');
  const failed = items.filter((item) => item.status === 'failed');
  const originalBytes = items.reduce((total, item) => total + item.size, 0);
  const completedOriginalBytes = completed.reduce((total, item) => total + item.size, 0);
  const outputBytes = completed.reduce(
    (total, item) => total + (item.result?.outputSize ?? 0),
    0,
  );
  const savedBytes = Math.max(0, completedOriginalBytes - outputBytes);
  const completedUnits =
    completed.length +
    failed.length +
    processing.reduce((total, item) => total + item.progress / 100, 0);

  return {
    total: items.length,
    queued: items.filter(isQueued).length,
    processing: processing.length,
    completed: completed.length,
    failed: failed.length,
    originalBytes,
    outputBytes,
    savedBytes,
    savingsPercent:
      completedOriginalBytes > 0
        ? Math.round((savedBytes / completedOriginalBytes) * 100)
        : 0,
    progress:
      items.length > 0 ? clamp(Math.round((completedUnits / items.length) * 100), 0, 100) : 0,
  };
}

export function buildBatchOutputName(
  item: Pick<BatchItem, 'name'>,
  result: Pick<OptimizationResult, 'format'>,
): string {
  const base = sanitizeFilename(item.name.replace(/\.[^.]+$/, ''));
  return `${base}-optimized.${formatExtension(result.format)}`;
}

export function makeUniqueFilename(filename: string, usedNames: Set<string>): string {
  const normalized = filename.toLowerCase();
  if (!usedNames.has(normalized)) {
    usedNames.add(normalized);
    return filename;
  }

  const extensionIndex = filename.lastIndexOf('.');
  const base = extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename;
  const extension = extensionIndex > 0 ? filename.slice(extensionIndex) : '';
  let index = 2;
  let candidate = `${base}-${index}${extension}`;
  while (usedNames.has(candidate.toLowerCase())) {
    index += 1;
    candidate = `${base}-${index}${extension}`;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function updateItem(
  state: BatchState,
  id: string,
  update: (item: BatchItem) => BatchItem,
): BatchState {
  return {
    ...state,
    items: state.items.map((item) => (item.id === id ? update(item) : item)),
  };
}

function inputMimeType(file: File, format: ImageFormat): string {
  if (file.type) return file.type;
  return format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
}

function isQueued(item: BatchItem): boolean {
  return item.status === 'queued';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
