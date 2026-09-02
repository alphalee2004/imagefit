'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { detectInputFormat } from '@/engine/format';
import { OptimizationError } from '@/engine/errors';
import type { EngineStage, ImageFormat, OptimizationOptions, OptimizationResult } from '@/engine/types';
import { WorkerEngineClient } from '@/engine/worker/client';
import { track } from '@/lib/analytics';
import { canRenderImagePreview } from '@/lib/utils';

export interface SelectedImage {
  file: File;
  name: string;
  size: number;
  mimeType: string;
  format: ImageFormat;
  width: number;
  height: number;
  url: string;
}

export type OptimizerStatus = 'idle' | 'ready' | 'processing' | 'done' | 'error';

const MAX_INPUT_BYTES = 50 * 1024 * 1024;

export function useImageOptimizer() {
  const clientRef = useRef<WorkerEngineClient | null>(null);
  const originalUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const originalPreviewUrlRef = useRef<string | null>(null);
  const previewPromiseRef = useRef<Promise<void> | null>(null);
  const [status, setStatus] = useState<OptimizerStatus>('idle');
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<EngineStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);

  const getClient = useCallback(() => {
    if (!clientRef.current) clientRef.current = new WorkerEngineClient();
    return clientRef.current;
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResultUrl(null);
  }, []);

  const clearOriginalPreview = useCallback(() => {
    if (originalPreviewUrlRef.current) {
      URL.revokeObjectURL(originalPreviewUrlRef.current);
      originalPreviewUrlRef.current = null;
    }
    previewPromiseRef.current = null;
    setOriginalPreviewUrl(null);
  }, []);

  const buildPreviewUrl = useCallback(
    async (file: File, mimeType: string, maxDimension: number): Promise<string> => {
      const data = await file.arrayBuffer();
      const preview = await getClient().optimize(
        { data, mimeType, name: file.name },
        {
          targetFormat: 'webp',
          maxWidth: maxDimension,
          maxHeight: maxDimension,
          fallbackQuality: 0.9,
        },
      );
      return URL.createObjectURL(preview.outputBlob);
    },
    [getClient],
  );

  const loadOriginalPreview = useCallback(
    (file: File, mimeType: string, width: number, height: number): Promise<void> => {
      if (canRenderImagePreview(width, height)) return Promise.resolve();
      if (previewPromiseRef.current) return previewPromiseRef.current;
      const promise = buildPreviewUrl(file, mimeType, 1600)
        .then((url) => {
          if (originalPreviewUrlRef.current) {
            URL.revokeObjectURL(originalPreviewUrlRef.current);
          }
          originalPreviewUrlRef.current = url;
          setOriginalPreviewUrl(url);
        })
        .catch(() => undefined);
      previewPromiseRef.current = promise;
      return promise;
    },
    [buildPreviewUrl],
  );

  const selectFile = useCallback(
    async (file: File) => {
      setError(null);
      clearResult();
      clearOriginalPreview();
      if (originalUrlRef.current) {
        URL.revokeObjectURL(originalUrlRef.current);
        originalUrlRef.current = null;
      }
      setImage(null);

      if (file.size > MAX_INPUT_BYTES) {
        setError('This image is larger than 50 MB. Choose a smaller file.');
        setStatus('error');
        return;
      }
      const format = detectInputFormat(file.type, file.name);
      if (!format) {
        setError('Unsupported format. Use JPG, PNG, or WebP.');
        setStatus('error');
        return;
      }
      track('upload_started', { fileFormat: format, originalSize: file.size });

      const url = URL.createObjectURL(file);
      try {
        const mimeType = file.type || (format === 'jpeg' ? 'image/jpeg' : `image/${format}`);
        const data = await file.arrayBuffer();
        const metadata = await getClient().inspect({ data, mimeType, name: file.name });
        track('image_loaded', {
          fileFormat: format,
          originalSize: file.size,
          width: metadata.width,
          height: metadata.height,
        });
        originalUrlRef.current = url;
        setImage({
          file,
          name: file.name,
          size: file.size,
          mimeType,
          format,
          width: metadata.width,
          height: metadata.height,
          url,
        });
        setStatus('ready');
        void loadOriginalPreview(file, mimeType, metadata.width, metadata.height);
      } catch (caught) {
        URL.revokeObjectURL(url);
        clearOriginalPreview();
        const message =
          caught instanceof OptimizationError
            ? caught.message
            : 'Could not read this image. It may be corrupted.';
        setError(message);
        setStatus('error');
      }
    },
    [clearResult, clearOriginalPreview, getClient, loadOriginalPreview],
  );

  const ensureOriginalPreview = useCallback(() => {
    if (!image) return;
    void loadOriginalPreview(image.file, image.mimeType, image.width, image.height);
  }, [image, loadOriginalPreview]);

  const optimize = useCallback(
    async (options: OptimizationOptions) => {
      if (!image) return;
      setError(null);
      clearResult();
      setProgress(0);
      setStage(null);
      setStatus('processing');
      track('optimization_started', {
        fileFormat: image.format,
        originalSize: image.size,
        targetSize: options.targetSize ?? null,
        width: image.width,
        height: image.height,
      });
      try {
        const data = await image.file.arrayBuffer();
        const optimized = await getClient().optimize(
          { data, mimeType: image.mimeType, name: image.name },
          options,
          (nextStage, nextProgress) => {
            setStage(nextStage);
            setProgress(nextProgress);
          },
        );
        const url = URL.createObjectURL(optimized.outputBlob);
        resultUrlRef.current = url;
        setResult(optimized);
        setResultUrl(url);
        setProgress(100);
        setStatus('done');
        track('optimization_completed', {
          fileFormat: image.format,
          originalSize: image.size,
          targetSize: options.targetSize ?? null,
          outputSize: optimized.outputSize,
          width: optimized.width,
          height: optimized.height,
          processingTime: optimized.durationMs,
          success: true,
        });
      } catch (caught) {
        if (caught instanceof OptimizationError && caught.code === 'ABORTED') {
          track('optimization_cancelled', {
            fileFormat: image.format,
            targetSize: options.targetSize ?? null,
          });
          setStatus('ready');
          return;
        }
        track('optimization_failed', {
          success: false,
          fileFormat: image.format,
          originalSize: image.size,
          targetSize: options.targetSize ?? null,
        });
        setError(caught instanceof Error ? caught.message : 'Optimization failed.');
        setStatus('error');
      }
    },
    [clearResult, getClient, image],
  );

  const cancel = useCallback(() => {
    clientRef.current?.cancelAll();
  }, []);

  const reset = useCallback(() => {
    clearResult();
    clearOriginalPreview();
    if (originalUrlRef.current) {
      URL.revokeObjectURL(originalUrlRef.current);
      originalUrlRef.current = null;
    }
    setImage(null);
    setError(null);
    setProgress(0);
    setStage(null);
    setStatus('idle');
  }, [clearResult, clearOriginalPreview]);

  const createPreview = useCallback(async (): Promise<string> => {
    if (!image) throw new Error('No image is selected.');
    const data = await image.file.arrayBuffer();
    const preview = await getClient().optimize(
      { data, mimeType: image.mimeType, name: image.name },
      {
        targetFormat: 'webp',
        maxWidth: 1400,
        maxHeight: 1400,
        fallbackQuality: 0.9,
      },
    );
    return URL.createObjectURL(preview.outputBlob);
  }, [getClient, image]);

  useEffect(() => {
    return () => {
      clientRef.current?.dispose();
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      if (originalPreviewUrlRef.current) URL.revokeObjectURL(originalPreviewUrlRef.current);
    };
  }, []);

  return {
    status,
    image,
    progress,
    stage,
    error,
    result,
    resultUrl,
    originalPreviewUrl,
    selectFile,
    optimize,
    cancel,
    reset,
    createPreview,
    ensureOriginalPreview,
  };
}
