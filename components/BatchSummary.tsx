'use client';

import { Archive, Trash2 } from 'lucide-react';
import type { BatchSummary as BatchSummaryData } from '@/lib/batchQueue';
import { formatBytes } from '@/lib/utils';

export default function BatchSummary({
  summary,
  disabled,
  isZipping,
  onDownloadAll,
  onClear,
}: {
  summary: BatchSummaryData;
  disabled: boolean;
  isZipping: boolean;
  onDownloadAll: () => void;
  onClear: () => void;
}) {
  return (
    <section aria-labelledby="batch-summary-heading" className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <h2 id="batch-summary-heading" className="text-lg font-semibold text-gray-900">
        Batch summary
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <SummaryValue label="Complete" value={String(summary.completed)} />
        <SummaryValue label="Failed" value={String(summary.failed)} />
        <SummaryValue label="Original" value={formatBytes(summary.originalBytes)} />
        <SummaryValue label="Output" value={formatBytes(summary.outputBytes)} />
      </dl>
      <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
        {summary.savedBytes > 0
          ? `${formatBytes(summary.savedBytes)} saved across completed images (${summary.savingsPercent}%).`
          : 'Savings will appear as images finish.'}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onDownloadAll}
          disabled={summary.completed === 0 || disabled || isZipping}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-base font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isZipping ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
          {isZipping ? 'Creating ZIP…' : 'Download ZIP'}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled || isZipping}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-base font-medium text-gray-700 hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Clear batch
        </button>
      </div>
    </section>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
