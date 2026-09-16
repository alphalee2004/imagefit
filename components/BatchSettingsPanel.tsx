'use client';

import TargetSizeSelector from './TargetSizeSelector';
import type { TargetPresetKey } from '@/lib/toolConfig';

export default function BatchSettingsPanel({
  targetPreset,
  onTargetPresetChange,
  customValue,
  onCustomValueChange,
  customUnit,
  onCustomUnitChange,
  disabled,
  error,
}: {
  targetPreset: TargetPresetKey | null;
  onTargetPresetChange: (preset: TargetPresetKey | null) => void;
  customValue: string;
  onCustomValueChange: (value: string) => void;
  customUnit: 'KB' | 'MB';
  onCustomUnitChange: (unit: 'KB' | 'MB') => void;
  disabled: boolean;
  error: string | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-gray-900">Batch settings</h2>
      <p className="mt-1 text-sm text-gray-500">
        One target size is applied to every image in the queue.
      </p>
      <div className="mt-3">
        <TargetSizeSelector
          value={targetPreset}
          onChange={onTargetPresetChange}
          customValue={customValue}
          onCustomValueChange={onCustomValueChange}
          customUnit={customUnit}
          onCustomUnitChange={onCustomUnitChange}
          showNoLimit={false}
          disabled={disabled}
        />
      </div>
      {disabled && (
        <p className="mt-3 text-sm text-gray-500">Settings are locked while the batch is running.</p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-base text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
