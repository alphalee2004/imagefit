'use client';

import { useCallback, useMemo, useState } from 'react';
import { Loader2, Sparkles, StopCircle } from 'lucide-react';
import { useBatchImageOptimizer } from '@/hooks/useBatchImageOptimizer';
import {
  TARGET_PRESETS,
  type TargetPresetKey,
} from '@/lib/toolConfig';
import BatchQueue from './BatchQueue';
import BatchSettingsPanel from './BatchSettingsPanel';
import BatchSummary from './BatchSummary';
import BatchUploadZone from './BatchUploadZone';

export default function BatchImageOptimizer() {
  const batch = useBatchImageOptimizer();
  const [targetPreset, setTargetPreset] = useState<TargetPresetKey | null>('200kb');
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<'KB' | 'MB'>('KB');
  const [panelError, setPanelError] = useState<string | null>(null);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);

  const targetBytes = useMemo(() => {
    if (targetPreset === null) return null;
    if (targetPreset === 'custom') {
      const value = Number(customValue);
      if (!Number.isFinite(value) || value <= 0) return undefined;
      return Math.round(value * (customUnit === 'KB' ? 1024 : 1024 * 1024));
    }
    return TARGET_PRESETS.find((preset) => preset.key === targetPreset)?.bytes ?? null;
  }, [customUnit, customValue, targetPreset]);

  const hasQueuedItems = batch.summary.queued > 0;
  const hasCompletedItems = batch.summary.completed > 0;
  const targetError =
    targetPreset === 'custom' && targetBytes === undefined
      ? 'Enter a valid custom target size.'
      : panelError;
  const canStart =
    batch.items.length > 0 &&
    hasQueuedItems &&
    typeof targetBytes === 'number' &&
    targetBytes > 0;

  const handleFiles = useCallback(
    (files: FileList) => {
      const selection = batch.addFiles(files);
      setRejectedFiles(selection.rejected.map((item) => `${item.name}: ${item.reason}`));
      if (selection.accepted > 0) setPanelError(null);
    },
    [batch],
  );

  const handleStart = useCallback(() => {
    if (typeof targetBytes !== 'number' || targetBytes <= 0) {
      setPanelError('Choose a valid target size before starting the batch.');
      return;
    }
    if (!hasQueuedItems) {
      setPanelError('There are no waiting images in the queue.');
      return;
    }
    setPanelError(null);
    void batch.start(targetBytes);
  }, [batch, hasQueuedItems, targetBytes]);

  const handleDownloadAll = useCallback(async () => {
    setIsZipping(true);
    setPanelError(null);
    try {
      await batch.downloadAll();
    } catch {
      setPanelError('Could not create the ZIP file. Try downloading images individually.');
    } finally {
      setIsZipping(false);
    }
  }, [batch]);

  const actionLabel = batch.isRunning
    ? batch.runStatus === 'cancelling'
      ? 'Stopping…'
      : 'Stop batch'
    : hasQueuedItems
      ? 'Start batch'
      : hasCompletedItems
        ? 'Download ZIP'
        : 'Add images to start';

  const actionDisabled = batch.isRunning
    ? batch.runStatus === 'cancelling'
    : hasQueuedItems
      ? !canStart
      : !hasCompletedItems || isZipping;

  const handlePrimaryAction = useCallback(() => {
    if (batch.isRunning) {
      batch.cancel();
      return;
    }
    if (hasQueuedItems) {
      handleStart();
      return;
    }
    if (hasCompletedItems) {
      void handleDownloadAll();
    }
  }, [batch, handleDownloadAll, handleStart, hasCompletedItems, hasQueuedItems]);

  return (
    <div className="grid gap-4 pb-24 sm:gap-5 sm:pb-0 lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-3">
        <BatchUploadZone onFiles={handleFiles} disabled={batch.isRunning} />

        {rejectedFiles.length > 0 && (
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Some files were not added:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {rejectedFiles.slice(0, 4).map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
            {rejectedFiles.length > 4 && (
              <p className="mt-1">And {rejectedFiles.length - 4} more.</p>
            )}
          </div>
        )}

        {batch.items.length > 0 && (
          <BatchQueue
            items={batch.items}
            disabled={batch.isRunning}
            onRetry={batch.retry}
            onRemove={batch.remove}
            onDownload={batch.downloadItem}
          />
        )}
      </div>

      <div className="space-y-3">
        <BatchSettingsPanel
          targetPreset={targetPreset}
          onTargetPresetChange={(preset) => {
            setTargetPreset(preset);
            setPanelError(null);
          }}
          customValue={customValue}
          onCustomValueChange={(value) => {
            setCustomValue(value);
            setPanelError(null);
          }}
          customUnit={customUnit}
          onCustomUnitChange={(unit) => {
            setCustomUnit(unit);
            setPanelError(null);
          }}
          disabled={batch.isRunning}
          error={targetError}
        />

        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={actionDisabled}
          className={`hidden h-11 w-full items-center justify-center gap-2 rounded-lg px-5 text-base font-medium text-white sm:inline-flex ${
            batch.isRunning
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-900 hover:bg-gray-800'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {batch.isRunning && batch.runStatus !== 'cancelling' ? (
            <StopCircle className="h-4 w-4" />
          ) : isZipping || batch.runStatus === 'cancelling' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {actionLabel}
        </button>

        {batch.items.length > 0 && (
          <BatchSummary
            summary={batch.summary}
            disabled={batch.isRunning}
            isZipping={isZipping}
            onDownloadAll={() => void handleDownloadAll()}
            onClear={() => {
              batch.clear();
              setPanelError(null);
              setRejectedFiles([]);
            }}
          />
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:hidden">
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={actionDisabled}
          className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-5 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
            batch.isRunning ? 'bg-red-600' : 'bg-gray-900'
          }`}
        >
          {batch.isRunning && batch.runStatus !== 'cancelling' ? (
            <StopCircle className="h-4 w-4" />
          ) : isZipping || batch.runStatus === 'cancelling' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
