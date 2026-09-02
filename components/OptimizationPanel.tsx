'use client';

import { Loader2, Sparkles } from 'lucide-react';
import {
  FORMAT_OPTIONS,
  type FormatChoice,
  type TargetPresetKey,
  type TaskKey,
} from '@/lib/toolConfig';
import TargetSizeSelector from './TargetSizeSelector';
import TaskPresetSelector from './TaskPresetSelector';

interface Props {
  showTargetSize: boolean;
  taskKey: TaskKey;
  onTaskKeyChange: (key: TaskKey) => void;
  showFormat: boolean;
  showResize: boolean;
  resizeRequired: boolean;
  targetPreset: TargetPresetKey | null;
  onTargetPresetChange: (preset: TargetPresetKey | null) => void;
  customValue: string;
  onCustomValueChange: (value: string) => void;
  customUnit: 'KB' | 'MB';
  onCustomUnitChange: (unit: 'KB' | 'MB') => void;
  formatChoice: FormatChoice;
  onFormatChange: (format: FormatChoice) => void;
  maxWidth: string;
  onMaxWidthChange: (value: string) => void;
  maxHeight: string;
  onMaxHeightChange: (value: string) => void;
  disabled: boolean;
  error: string | null;
  onOptimize: () => void;
}

export default function OptimizationPanel({
  showTargetSize,
  taskKey,
  onTaskKeyChange,
  showFormat,
  showResize,
  resizeRequired,
  targetPreset,
  onTargetPresetChange,
  customValue,
  onCustomValueChange,
  customUnit,
  onCustomUnitChange,
  formatChoice,
  onFormatChange,
  maxWidth,
  onMaxWidthChange,
  maxHeight,
  onMaxHeightChange,
  disabled,
  error,
  onOptimize,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="space-y-5">
        {showTargetSize && (
          <>
            <TaskPresetSelector value={taskKey} onChange={onTaskKeyChange} />
            <TargetSizeSelector
              value={targetPreset}
              onChange={onTargetPresetChange}
              customValue={customValue}
              onCustomValueChange={onCustomValueChange}
              customUnit={customUnit}
              onCustomUnitChange={onCustomUnitChange}
            />
          </>
        )}

        {showFormat && (
          <div>
            <label className="text-sm font-medium text-gray-900">Output format</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onFormatChange(option.key)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    formatChoice === option.key
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {showResize && (
          <div>
            <label className="text-sm font-medium text-gray-900">
              Max dimensions {resizeRequired && <span className="text-gray-400">(required)</span>}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                type="number"
                min="1"
                value={maxWidth}
                onChange={(event) => onMaxWidthChange(event.target.value)}
                placeholder="Max width"
                aria-label="Max width in pixels"
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-teal-600 focus:outline-none"
              />
              <input
                type="number"
                min="1"
                value={maxHeight}
                onChange={(event) => onMaxHeightChange(event.target.value)}
                placeholder="Max height"
                aria-label="Max height in pixels"
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Leave blank to keep the original size.</p>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onOptimize}
          disabled={disabled}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {disabled ? 'Optimizing…' : 'Optimize Image'}
        </button>
      </div>
    </div>
  );
}
