'use client';

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileImage,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { BatchItem } from '@/lib/batchQueue';
import { formatBytes, savingsPercent } from '@/lib/utils';

const STATUS_LABELS: Record<BatchItem['status'], string> = {
  queued: 'Waiting',
  processing: 'Processing',
  done: 'Complete',
  failed: 'Failed',
};

export default function BatchQueue({
  items,
  disabled,
  onRetry,
  onRemove,
  onDownload,
}: {
  items: BatchItem[];
  disabled: boolean;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onDownload: (item: BatchItem) => void;
}) {
  return (
    <section aria-labelledby="batch-queue-heading" className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 id="batch-queue-heading" className="text-lg font-semibold text-gray-900">
          Queue
        </h2>
        <span className="text-sm text-gray-500">{items.length} images</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.map((item) => {
          const saved = item.result
            ? savingsPercent(item.size, item.result.outputSize)
            : null;
          return (
            <li key={item.id} data-batch-item className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  {item.status === 'processing' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-teal-700" />
                  ) : item.status === 'done' ? (
                    <CheckCircle2 className="h-5 w-5 text-teal-700" />
                  ) : item.status === 'failed' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <FileImage className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-gray-900">{item.name}</p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {formatBytes(item.size)}
                        {item.result && (
                          <>
                            {' '}
                            → {formatBytes(item.result.outputSize)}
                            {' · '}
                            {saved}% smaller
                          </>
                        )}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-sm font-medium ${
                        item.status === 'done'
                          ? 'bg-teal-50 text-teal-700'
                          : item.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>

                  {item.status === 'processing' && (
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-teal-600 transition-all duration-200"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.stage ? STAGE_LABELS[item.stage] : 'Starting…'}
                      </p>
                    </div>
                  )}

                  {item.error && (
                    <p className="mt-2 text-sm text-red-700">{item.error}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center">
                  {item.status === 'failed' && !disabled && (
                    <button
                      type="button"
                      onClick={() => onRetry(item.id)}
                      aria-label={`Retry ${item.name}`}
                      title="Retry"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  )}
                  {item.status === 'done' && (
                    <button
                      type="button"
                      onClick={() => onDownload(item)}
                      aria-label={`Download ${item.name}`}
                      title="Download"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-teal-700 hover:bg-teal-50"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      aria-label={`Remove ${item.name}`}
                      title="Remove"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const STAGE_LABELS: Record<NonNullable<BatchItem['stage']>, string> = {
  decoding: 'Reading image…',
  planning: 'Planning…',
  'searching-quality': 'Finding the best quality…',
  resizing: 'Resizing…',
  encoding: 'Encoding…',
};
