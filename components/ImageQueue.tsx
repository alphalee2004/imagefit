'use client';

import { Crop, FileImage, X } from 'lucide-react';
import type { SelectedImage } from '@/hooks/useImageOptimizer';
import { formatLabel } from '@/lib/toolConfig';
import { canRenderImagePreview, formatBytes } from '@/lib/utils';

export default function ImageQueue({
  image,
  onRemove,
  onEdit,
  edited,
  previewUrl,
}: {
  image: SelectedImage;
  onRemove: () => void;
  onEdit?: () => void;
  edited?: boolean;
  previewUrl?: string | null;
}) {
  const showPreview = Boolean(previewUrl) || canRenderImagePreview(image.width, image.height);
  const source = previewUrl || image.url;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
      {showPreview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={source} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
          <FileImage className="h-6 w-6" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{image.name}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {formatBytes(image.size)} · {image.width} × {image.height} ·{' '}
          {formatLabel(image.format)}
        </p>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit image"
          title="Rotate, flip or crop"
          className={`rounded-lg p-2 ${
            edited
              ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <Crop className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
