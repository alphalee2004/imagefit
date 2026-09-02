'use client';

import { FileImage } from 'lucide-react';
import { canRenderImagePreview } from '@/lib/utils';

export default function BeforeAfterPreview({
  originalUrl,
  originalPreviewUrl,
  resultUrl,
  originalWidth,
  originalHeight,
  resultWidth,
  resultHeight,
}: {
  originalUrl: string;
  originalPreviewUrl?: string | null;
  resultUrl: string;
  originalWidth: number;
  originalHeight: number;
  resultWidth: number;
  resultHeight: number;
}) {
  const source = originalPreviewUrl || originalUrl;
  const canShowOriginal =
    Boolean(originalPreviewUrl) || canRenderImagePreview(originalWidth, originalHeight);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <figure className="rounded-xl border border-gray-200 bg-white p-3">
        <figcaption className="mb-2 text-xs font-medium text-gray-500">
          Original · {originalWidth} × {originalHeight}
        </figcaption>
        {canShowOriginal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={source} alt="Original image" className="max-h-64 w-full rounded-lg object-contain" />
        ) : (
          <span className="flex h-56 w-full items-center justify-center rounded-lg bg-gray-100 text-gray-400">
            <FileImage className="h-8 w-8" />
          </span>
        )}
      </figure>
      <figure className="rounded-xl border border-gray-200 bg-white p-3">
        <figcaption className="mb-2 text-xs font-medium text-gray-500">
          Optimized · {resultWidth} × {resultHeight}
        </figcaption>
        {canRenderImagePreview(resultWidth, resultHeight) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resultUrl} alt="Optimized image" className="max-h-64 w-full rounded-lg object-contain" />
        ) : (
          <span className="flex h-56 w-full items-center justify-center rounded-lg bg-gray-100 text-gray-400">
            <FileImage className="h-8 w-8" />
          </span>
        )}
      </figure>
    </div>
  );
}
