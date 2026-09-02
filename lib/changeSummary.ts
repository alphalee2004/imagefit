import type { OptimizationResult } from '@/engine/types';
import { formatBytes } from './utils';

export interface SummarySource {
  name: string;
  size: number;
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp';
}

export function buildChangeSummary(
  original: SummarySource,
  result: OptimizationResult,
  edited: boolean,
): string[] {
  const lines: string[] = [];
  const target = result.targetSize ?? null;
  const resolutionChanged =
    result.width !== original.width || result.height !== original.height;
  const alreadyClose =
    target !== null && original.size <= target && result.quality !== null;

  if (edited) {
    lines.push('Your rotation, flip or crop was applied before optimization.');
  }

  if (target !== null) {
    const limit = formatBytes(target);
    if (resolutionChanged) {
      lines.push(
        `To stay under ${limit}, the resolution was reduced from ${original.width}×${original.height} to ${result.width}×${result.height}.`,
      );
    } else {
      lines.push(`The resolution stayed at ${result.width}×${result.height}.`);
    }
    if (result.quality !== null) {
      lines.push(
        alreadyClose
          ? 'Your image was already close to the limit, so only light compression was needed.'
          : `${qualityLabel(result.quality)} ${formatLabel(result.format)} encoding was used to stay under the limit.`,
      );
    } else {
      lines.push('PNG was encoded losslessly.');
    }
  } else {
    lines.push(
      result.quality !== null
        ? `The image was encoded with ${qualityLabel(result.quality)} ${formatLabel(result.format)} quality.`
        : 'The image was converted losslessly.',
    );
  }

  if (resolutionChanged && !edited) {
    lines.push('Cropping out unneeded areas could keep a larger, sharper result.');
  }

  return lines;
}

function qualityLabel(quality: number): string {
  if (quality >= 0.9) return 'near-original';
  if (quality >= 0.75) return 'high';
  if (quality >= 0.6) return 'balanced';
  return 'stronger';
}

function formatLabel(format: OptimizationResult['format']): string {
  if (format === 'jpeg') return 'JPG';
  return format === 'webp' ? 'WebP' : 'PNG';
}
