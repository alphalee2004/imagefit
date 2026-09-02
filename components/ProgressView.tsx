'use client';

import type { EngineStage } from '@/engine/types';

const STAGE_LABELS: Record<EngineStage, string> = {
  decoding: 'Reading your image…',
  planning: 'Planning…',
  'searching-quality': 'Finding the best quality…',
  resizing: 'Resizing…',
  encoding: 'Encoding…',
};

export default function ProgressView({
  progress,
  stage,
  onCancel,
}: {
  progress: number;
  stage: EngineStage | null;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">Optimizing…</p>
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">{stage ? STAGE_LABELS[stage] : 'Optimizing…'}</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-red-600 hover:text-red-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
