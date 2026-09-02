'use client';

import { TASK_PRESETS, getTaskPreset, type TaskKey } from '@/lib/toolConfig';

export default function TaskPresetSelector({
  value,
  onChange,
}: {
  value: TaskKey;
  onChange: (key: TaskKey) => void;
}) {
  const active = getTaskPreset(value);
  return (
    <div>
      <label className="text-sm font-medium text-gray-900">What is this image for?</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {TASK_PRESETS.map((task) => (
          <button
            key={task.key}
            type="button"
            onClick={() => onChange(task.key)}
            title={task.description}
            className={`rounded-lg border px-3 py-2 text-sm ${
              value === task.key
                ? 'border-teal-700 bg-teal-700 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {task.label}
          </button>
        ))}
      </div>
      {value !== 'general' && (
        <p className="mt-2 text-xs text-gray-500">{active.description}</p>
      )}
    </div>
  );
}
