import type { ImageFormat } from '@/engine/types';

export const TARGET_PRESETS = [
  { key: '50kb', label: '50 KB', bytes: 50 * 1024 },
  { key: '100kb', label: '100 KB', bytes: 100 * 1024 },
  { key: '200kb', label: '200 KB', bytes: 200 * 1024 },
  { key: '500kb', label: '500 KB', bytes: 500 * 1024 },
  { key: '1mb', label: '1 MB', bytes: 1024 * 1024 },
] as const;

export type TargetPresetKey = (typeof TARGET_PRESETS)[number]['key'] | 'custom' | null;

export const FORMAT_OPTIONS: Array<{ key: FormatChoice; label: string }> = [
  { key: 'original', label: 'Original' },
  { key: 'jpeg', label: 'JPG' },
  { key: 'png', label: 'PNG' },
  { key: 'webp', label: 'WebP' },
];

export type FormatChoice = 'original' | ImageFormat;

export interface ToolUiConfig {
  defaultTargetBytes?: number | null;
  defaultFormat?: FormatChoice;
  showFormat?: boolean;
  showResize?: boolean;
  resizeRequired?: boolean;
  showTargetSize?: boolean;
}

export type TaskKey =
  | 'general'
  | 'email'
  | 'cv-photo'
  | 'forum-avatar'
  | 'store-product'
  | 'website-image';

export interface TaskPreset {
  key: TaskKey;
  label: string;
  description: string;
  targetPreset: TargetPresetKey;
  format: FormatChoice;
  maxWidth?: number;
  maxHeight?: number;
}

export const TASK_PRESETS: TaskPreset[] = [
  {
    key: 'general',
    label: 'General',
    description: 'Use the settings below manually.',
    targetPreset: null,
    format: 'original',
  },
  {
    key: 'email',
    label: 'Email attachment',
    description: 'Up to 1 MB per image, keeps the original format.',
    targetPreset: '1mb',
    format: 'original',
  },
  {
    key: 'cv-photo',
    label: 'CV / application photo',
    description: 'Up to 500 KB, max height 1200 px, saved as JPG.',
    targetPreset: '500kb',
    format: 'jpeg',
    maxHeight: 1200,
  },
  {
    key: 'forum-avatar',
    label: 'Forum avatar',
    description: 'Up to 200 KB, max 1024 px, saved as JPG.',
    targetPreset: '200kb',
    format: 'jpeg',
    maxWidth: 1024,
    maxHeight: 1024,
  },
  {
    key: 'store-product',
    label: 'Store product photo',
    description: 'Up to 1 MB, max width 2000 px, saved as JPG.',
    targetPreset: '1mb',
    format: 'jpeg',
    maxWidth: 2000,
  },
  {
    key: 'website-image',
    label: 'Website / blog image',
    description: 'Up to 500 KB, max width 2048 px, saved as WebP.',
    targetPreset: '500kb',
    format: 'webp',
    maxWidth: 2048,
  },
];

export function getTaskPreset(key: TaskKey): TaskPreset {
  return TASK_PRESETS.find((preset) => preset.key === key) ?? TASK_PRESETS[0];
}

export function formatExtension(format: ImageFormat): string {
  if (format === 'jpeg') return 'jpg';
  return format;
}

export function formatLabel(format: ImageFormat): string {
  if (format === 'jpeg') return 'JPG';
  return format === 'webp' ? 'WebP' : 'PNG';
}
