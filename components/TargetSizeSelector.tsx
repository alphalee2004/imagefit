'use client';

import { TARGET_PRESETS, type TargetPresetKey } from '@/lib/toolConfig';

interface Props {
  value: TargetPresetKey | null;
  onChange: (preset: TargetPresetKey | null) => void;
  customValue: string;
  onCustomValueChange: (value: string) => void;
  customUnit: 'KB' | 'MB';
  onCustomUnitChange: (unit: 'KB' | 'MB') => void;
}

export default function TargetSizeSelector({
  value,
  onChange,
  customValue,
  onCustomValueChange,
  customUnit,
  onCustomUnitChange,
}: Props) {
  return (
    <div>
      <label className="text-base font-medium text-gray-900">Target size</label>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`min-h-11 rounded-lg border px-3 py-2 text-base ${
            value === null
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          No limit
        </button>
        {TARGET_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onChange(preset.key)}
            className={`min-h-11 rounded-lg border px-3 py-2 text-base ${
              value === preset.key
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange('custom')}
          className={`min-h-11 rounded-lg border px-3 py-2 text-base ${
            value === 'custom'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          Custom
        </button>
      </div>
      {value === 'custom' && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="1"
            step="any"
            value={customValue}
            onChange={(event) => onCustomValueChange(event.target.value)}
            placeholder="e.g. 300"
            className="h-11 w-28 rounded-lg border border-gray-300 px-3 text-base focus:border-teal-600 focus:outline-none"
            aria-label="Custom target size"
          />
          <select
            value={customUnit}
            onChange={(event) => onCustomUnitChange(event.target.value as 'KB' | 'MB')}
            className="h-11 rounded-lg border border-gray-300 bg-white px-2 text-base"
            aria-label="Custom target unit"
          >
            <option value="KB">KB</option>
            <option value="MB">MB</option>
          </select>
        </div>
      )}
    </div>
  );
}
