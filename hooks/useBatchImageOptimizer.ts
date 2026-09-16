'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { OptimizationError } from '@/engine/errors';
import type { OptimizationResult } from '@/engine/types';
import { WorkerEngineClient } from '@/engine/worker/client';
import { track } from '@/lib/analytics';
import {
  batchQueueReducer,
  buildBatchOutputName,
  INITIAL_BATCH_STATE,
  prepareBatchItems,
  summarizeBatch,
  type BatchItem,
  type BatchRejection,
} from '@/lib/batchQueue';
import { createBatchZip } from '@/lib/batchZip';
import { downloadBlob } from '@/lib/utils';

export interface BatchSelectionResult {
  accepted: number;
  rejected: BatchRejection[];
}

export function useBatchImageOptimizer() {
  const [state, dispatch] = useReducer(batchQueueReducer, INITIAL_BATCH_STATE);
  const stateRef = useRef(state);
  const clientRef = useRef<WorkerEngineClient | null>(null);
  const runningRef = useRef(false);
  const runIdRef = useRef(0);
  const nextItemIdRef = useRef(1);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getClient = useCallback(() => {
    if (!clientRef.current) clientRef.current = new WorkerEngineClient();
    return clientRef.current;
  }, []);

  const addFiles = useCallback(
    (files: Iterable<File>): BatchSelectionResult => {
      if (runningRef.current) {
        return {
          accepted: 0,
          rejected: [
            {
              name: 'Batch in progress',
              reason: 'Wait for the current batch to stop before adding more images.',
            },
          ],
        };
      }

      const { items, rejected } = prepareBatchItems(
        files,
        stateRef.current.items.length,
        () => `batch-${Date.now()}-${nextItemIdRef.current++}`,
      );
      dispatch({ type: 'add', items });
      return { accepted: items.length, rejected };
    },
    [],
  );

  const start = useCallback(
    async (targetSize: number) => {
      if (runningRef.current || stateRef.current.runStatus !== 'idle') return;

      const queued = stateRef.current.items
        .filter((item) => item.status === 'queued')
        .map((item) => ({ ...item }));
      if (queued.length === 0) return;

      const runId = runIdRef.current + 1;
      runIdRef.current = runId;
      runningRef.current = true;
      dispatch({ type: 'start' });

      const startedAt = Date.now();
      const totalInputBytes = queued.reduce((total, item) => total + item.size, 0);
      let completed = 0;
      let failed = 0;
      let outputBytes = 0;

      track('batch_started', {
        fileCount: queued.length,
        totalInputBytes,
        targetSize,
      });

      for (const task of queued) {
        if (runIdRef.current !== runId) break;
        dispatch({ type: 'item-processing', id: task.id });

        try {
          const data = await task.file.arrayBuffer();
          if (runIdRef.current !== runId) {
            dispatch({ type: 'item-cancelled', id: task.id });
            break;
          }
          const result = await getClient().optimize(
            { data, mimeType: task.mimeType, name: task.name },
            { targetSize },
            (stage, progress) => {
              if (runIdRef.current === runId) {
                dispatch({
                  type: 'item-progress',
                  id: task.id,
                  stage,
                  progress,
                });
              }
            },
          );

          if (runIdRef.current !== runId) {
            dispatch({ type: 'item-cancelled', id: task.id });
            break;
          }

          dispatch({ type: 'item-done', id: task.id, result });
          completed += 1;
          outputBytes += result.outputSize;
        } catch (caught) {
          if (
            runIdRef.current !== runId ||
            (caught instanceof OptimizationError && caught.code === 'ABORTED')
          ) {
            dispatch({ type: 'item-cancelled', id: task.id });
            break;
          }

          failed += 1;
          dispatch({
            type: 'item-failed',
            id: task.id,
            error: errorMessage(caught),
          });
        }
      }

      runningRef.current = false;
      dispatch({ type: 'finish' });
      track('batch_completed', {
        fileCount: queued.length,
        completed,
        failed,
        totalInputBytes,
        totalOutputBytes: outputBytes,
        processingTime: Date.now() - startedAt,
        success: failed === 0 && completed === queued.length,
      });
    },
    [getClient],
  );

  const cancel = useCallback(() => {
    if (!runningRef.current || stateRef.current.runStatus !== 'running') return;
    dispatch({ type: 'stop' });
    runIdRef.current += 1;
    clientRef.current?.cancelAll();
  }, []);

  const retry = useCallback((id: string) => {
    dispatch({ type: 'retry', id });
  }, []);

  const remove = useCallback((id: string) => {
    dispatch({ type: 'remove', id });
  }, []);

  const clear = useCallback(() => {
    if (runningRef.current) return;
    dispatch({ type: 'clear' });
  }, []);

  const downloadItem = useCallback((item: BatchItem) => {
    if (!item.result) return;
    downloadBlob(item.result.outputBlob, buildBatchOutputName(item, item.result));
  }, []);

  const completedItems = state.items.filter(
    (item): item is BatchItem & { result: OptimizationResult } =>
      item.status === 'done' && item.result !== null,
  );

  const downloadAll = useCallback(async () => {
    if (completedItems.length === 0) return;
    const archive = await createBatchZip(
      completedItems.map((item) => ({
        name: buildBatchOutputName(item, item.result),
        blob: item.result.outputBlob,
      })),
    );
    downloadBlob(archive, 'cleeke-batch.zip');
  }, [completedItems]);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      clientRef.current?.dispose();
    };
  }, []);

  return {
    items: state.items,
    runStatus: state.runStatus,
    summary: summarizeBatch(state.items),
    completedItems,
    isRunning: state.runStatus !== 'idle',
    addFiles,
    start,
    cancel,
    retry,
    remove,
    clear,
    downloadItem,
    downloadAll,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof OptimizationError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Optimization failed.';
}
