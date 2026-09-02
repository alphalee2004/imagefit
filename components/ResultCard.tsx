'use client';

import { ArrowRight, Download, RefreshCw } from 'lucide-react';
import type { OptimizationResult } from '@/engine/types';
import type { SelectedImage } from '@/hooks/useImageOptimizer';
import { formatLabel } from '@/lib/toolConfig';
import { formatBytes, savingsPercent } from '@/lib/utils';

export default function ResultCard({
  original,
  result,
  onDownload,
  onReset,
}: {
  original: SelectedImage;
  result: OptimizationResult;
  onDownload: () => void;
  onReset: () => void;
}) {
  const saved = savingsPercent(original.size, result.outputSize);

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div>
            <p className="text-xs font-medium text-gray-500">Original</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{formatBytes(original.size)}</p>
            <p className="text-xs text-gray-500">
              {original.width} × {original.height} · {formatLabel(original.format)}
            </p>
          </div>
          <ArrowRight className="hidden h-4 w-4 text-gray-400 sm:block" />
          <div>
            <p className="text-xs font-medium text-gray-500">Optimized</p>
            <p className="mt-1 text-lg font-semibold text-teal-700">{formatBytes(result.outputSize)}</p>
            <p className="text-xs text-gray-500">
              {result.width} × {result.height} · {formatLabel(result.format)}
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
          {saved}% smaller
        </span>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 text-sm font-medium text-white hover:bg-teal-800"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:border-gray-400"
        >
          <RefreshCw className="h-4 w-4" />
          Optimize another
        </button>
      </div>
    </div>
  );
}
