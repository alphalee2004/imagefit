'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ImageTransform, OptimizationOptions } from '@/engine/types';
import { useImageOptimizer } from '@/hooks/useImageOptimizer';
import { track } from '@/lib/analytics';
import {
  formatExtension,
  getTaskPreset,
  TARGET_PRESETS,
  type FormatChoice,
  type TargetPresetKey,
  type TaskKey,
  type ToolUiConfig,
} from '@/lib/toolConfig';
import { canRenderImagePreview, downloadBlob, sanitizeFilename } from '@/lib/utils';
import BeforeAfterPreview from './BeforeAfterPreview';
import ImageQueue from './ImageQueue';
import OptimizationPanel from './OptimizationPanel';
import ProgressView from './ProgressView';
import ResultCard from './ResultCard';
import UploadZone from './UploadZone';
import EditImagePanel from './EditImagePanel';

export default function ImageOptimizer({ config }: { config: ToolUiConfig }) {
  const optimizer = useImageOptimizer();
  const [targetPreset, setTargetPreset] = useState<TargetPresetKey | null>(() => {
    if (config.defaultTargetBytes == null) return null;
    return (
      TARGET_PRESETS.find((preset) => preset.bytes === config.defaultTargetBytes)?.key ?? null
    );
  });
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<'KB' | 'MB'>('KB');
  const [formatChoice, setFormatChoice] = useState<FormatChoice>(config.defaultFormat ?? 'original');
  const [maxWidth, setMaxWidth] = useState('');
  const [maxHeight, setMaxHeight] = useState('');
  const [panelError, setPanelError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [transform, setTransform] = useState<ImageTransform | null>(null);
  const [taskKey, setTaskKey] = useState<TaskKey>('general');

  const handleTargetPresetChange = useCallback((preset: TargetPresetKey | null) => {
    setTaskKey('general');
    setTargetPreset(preset);
    let targetSize: string | number | null = null;
    if (preset === 'custom') {
      targetSize = 'custom';
    } else if (preset !== null) {
      targetSize = TARGET_PRESETS.find((item) => item.key === preset)?.bytes ?? null;
    }
    track('target_size_selected', { targetSize });
  }, []);

  const handleFormatChange = useCallback((format: FormatChoice) => {
    setTaskKey('general');
    setFormatChoice(format);
    track('format_selected', { format });
  }, []);

  const handleMaxWidthChange = useCallback((value: string) => {
    setTaskKey('general');
    setMaxWidth(value);
  }, []);

  const handleMaxHeightChange = useCallback((value: string) => {
    setTaskKey('general');
    setMaxHeight(value);
  }, []);

  const handleCustomValueChange = useCallback((value: string) => {
    setTaskKey('general');
    setCustomValue(value);
  }, []);

  const handleCustomUnitChange = useCallback((unit: 'KB' | 'MB') => {
    setTaskKey('general');
    setCustomUnit(unit);
  }, []);

  const selectTask = useCallback((key: TaskKey) => {
    const task = getTaskPreset(key);
    setTaskKey(key);
    if (key === 'general') return;
    setTargetPreset(task.targetPreset);
    setFormatChoice(task.format);
    setMaxWidth(task.maxWidth ? String(task.maxWidth) : '');
    setMaxHeight(task.maxHeight ? String(task.maxHeight) : '');
    const preset = TARGET_PRESETS.find((item) => item.key === task.targetPreset);
    track('target_size_selected', { targetSize: preset?.bytes ?? task.targetPreset });
  }, []);

  const showTargetSize = config.showTargetSize ?? true;
  const showFormat = config.showFormat ?? false;
  const showResize = config.showResize ?? false;
  const resizeRequired = config.resizeRequired ?? false;

  const targetBytes = useMemo(() => {
    if (targetPreset === null) return null;
    if (targetPreset === 'custom') {
      const value = Number(customValue);
      if (!Number.isFinite(value) || value <= 0) return undefined;
      return Math.round(value * (customUnit === 'KB' ? 1024 : 1024 * 1024));
    }
    return TARGET_PRESETS.find((preset) => preset.key === targetPreset)?.bytes ?? null;
  }, [customUnit, customValue, targetPreset]);

  const handleOptimize = useCallback(() => {
    setPanelError(null);
    if (!optimizer.image) return;
    if (showResize && resizeRequired && !maxWidth.trim() && !maxHeight.trim()) {
      setPanelError('Enter a max width or height first.');
      return;
    }
    if (targetPreset === 'custom' && targetBytes === undefined) {
      setPanelError('Enter a valid target size.');
      return;
    }
    const parsedWidth = maxWidth ? Number(maxWidth) : undefined;
    const parsedHeight = maxHeight ? Number(maxHeight) : undefined;
    if (
      (parsedWidth !== undefined && (!Number.isFinite(parsedWidth) || parsedWidth < 1)) ||
      (parsedHeight !== undefined && (!Number.isFinite(parsedHeight) || parsedHeight < 1))
    ) {
      setPanelError('Max dimensions must be positive numbers.');
      return;
    }

    const options: OptimizationOptions = {
      targetSize: targetBytes ?? null,
      targetFormat: formatChoice === 'original' ? undefined : formatChoice,
      maxWidth: parsedWidth ? Math.floor(parsedWidth) : undefined,
      maxHeight: parsedHeight ? Math.floor(parsedHeight) : undefined,
      transform: transform ?? undefined,
    };
    void optimizer.optimize(options);
  }, [
    formatChoice,
    maxHeight,
    maxWidth,
    optimizer,
    resizeRequired,
    showResize,
    targetBytes,
    targetPreset,
    transform,
  ]);

  const handleFile = useCallback(
    (file: File) => {
      setTaskKey('general');
      setTransform(null);
      setShowEditor(false);
      void optimizer.selectFile(file);
    },
    [optimizer],
  );

  const handleRemove = useCallback(() => {
    setTransform(null);
    setShowEditor(false);
    optimizer.reset();
  }, [optimizer]);

  const handleApplyEdit = useCallback((next: ImageTransform | null) => {
    setTransform(next);
    setShowEditor(false);
  }, []);

  const handleFileRef = useRef(handleFile);
  useEffect(() => {
    handleFileRef.current = handleFile;
  }, [handleFile]);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (optimizer.status === 'processing' || showEditor) return;
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            void handleFileRef.current(file);
          }
          break;
        }
      }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [optimizer.status, showEditor]);

  const handleDownload = useCallback(() => {
    if (!optimizer.result || !optimizer.image) return;
    track('download_clicked', {
      fileFormat: optimizer.result.format,
      outputSize: optimizer.result.outputSize,
      width: optimizer.result.width,
      height: optimizer.result.height,
    });
    const base = sanitizeFilename(optimizer.image.name.replace(/\.[^.]+$/, ''));
    downloadBlob(
      optimizer.result.outputBlob,
      `${base}-optimized.${formatExtension(optimizer.result.format)}`,
    );
  }, [optimizer.image, optimizer.result]);

  const errorToShow = panelError ?? optimizer.error;
  const image = optimizer.image;
  const result = optimizer.result;
  const originalPreviewUrl = optimizer.originalPreviewUrl;

  useEffect(() => {
    if (
      optimizer.status === 'done' &&
      image &&
      !canRenderImagePreview(image.width, image.height) &&
      !originalPreviewUrl
    ) {
      optimizer.ensureOriginalPreview();
    }
  }, [image, optimizer, originalPreviewUrl]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-4">
        {!image ? (
          <UploadZone onFile={handleFile} />
        ) : (
          <ImageQueue
            image={image}
            onRemove={handleRemove}
            onEdit={() => setShowEditor(true)}
            edited={transform !== null}
            previewUrl={originalPreviewUrl}
          />
        )}
        {errorToShow && !image && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorToShow}
          </p>
        )}
        {optimizer.status === 'processing' && (
          <ProgressView
            progress={optimizer.progress}
            stage={optimizer.stage}
            onCancel={optimizer.cancel}
          />
        )}
        {showEditor && image && (
          <EditImagePanel
            initialTransform={transform}
            createPreview={optimizer.createPreview}
            onApply={handleApplyEdit}
            onCancel={() => setShowEditor(false)}
          />
        )}
        {optimizer.status === 'done' && image && result && optimizer.resultUrl && (
          <BeforeAfterPreview
            originalUrl={image.url}
            originalPreviewUrl={originalPreviewUrl}
            resultUrl={optimizer.resultUrl}
            originalWidth={image.width}
            originalHeight={image.height}
            resultWidth={result.width}
            resultHeight={result.height}
          />
        )}
      </div>

      <OptimizationPanel
        showTargetSize={showTargetSize}
        taskKey={taskKey}
        onTaskKeyChange={selectTask}
        showFormat={showFormat}
        showResize={showResize}
        resizeRequired={resizeRequired}
        targetPreset={targetPreset}
        onTargetPresetChange={handleTargetPresetChange}
        customValue={customValue}
        onCustomValueChange={handleCustomValueChange}
        customUnit={customUnit}
        onCustomUnitChange={handleCustomUnitChange}
        formatChoice={formatChoice}
        onFormatChange={handleFormatChange}
        maxWidth={maxWidth}
        onMaxWidthChange={handleMaxWidthChange}
        maxHeight={maxHeight}
        onMaxHeightChange={handleMaxHeightChange}
        disabled={optimizer.status === 'processing' || showEditor}
        error={image && errorToShow ? errorToShow : null}
        onOptimize={handleOptimize}
      />

      {optimizer.status === 'done' && image && result && (
        <div className="lg:col-span-2">
          <ResultCard
            original={image}
            result={result}
            onDownload={handleDownload}
            onReset={optimizer.reset}
          />
        </div>
      )}
    </div>
  );
}
