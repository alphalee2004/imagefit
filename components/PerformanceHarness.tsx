'use client';

import { useState } from 'react';
import { WorkerEngineClient } from '@/engine/worker/client';

interface PerfResult {
  fileName: string;
  inputSize: number;
  inputWidth: number | null;
  inputHeight: number | null;
  outputSize: number | null;
  outputWidth: number | null;
  outputHeight: number | null;
  durationMs: number | null;
  encodeAttempts: number | null;
  progressCount: number | null;
  uiTicks: number | null;
  heapBeforeMb: number | null;
  heapAfterMb: number | null;
  error: string | null;
}

function usedHeapMb(): number | null {
  const memory = (
    performance as Performance & { memory?: { usedJSHeapSize: number } }
  ).memory;
  return memory ? Math.round(memory.usedJSHeapSize / 1048576) : null;
}

export default function PerformanceHarness() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [result, setResult] = useState<PerfResult | null>(null);

  async function run(file: File) {
    setStatus('running');
    setResult(null);
    const client = new WorkerEngineClient();
    let ticks = 0;
    const interval = window.setInterval(() => {
      ticks += 1;
    }, 16);
    let progressCount = 0;
    const heapBeforeMb = usedHeapMb();
    const startedAt = performance.now();

    try {
      const optimized = await client.optimize(
        { data: await file.arrayBuffer(), mimeType: file.type || 'image/jpeg', name: file.name },
        { targetSize: 200 * 1024, targetFormat: 'jpeg' },
        () => {
          progressCount += 1;
        },
      );
      setResult({
        fileName: file.name,
        inputSize: file.size,
        inputWidth: optimized.originalWidth,
        inputHeight: optimized.originalHeight,
        outputSize: optimized.outputSize,
        outputWidth: optimized.width,
        outputHeight: optimized.height,
        durationMs: optimized.durationMs,
        encodeAttempts: optimized.encodeAttempts,
        progressCount,
        uiTicks: ticks,
        heapBeforeMb,
        heapAfterMb: usedHeapMb(),
        error: null,
      });
    } catch (caught) {
      setResult({
        fileName: file.name,
        inputSize: file.size,
        inputWidth: null,
        inputHeight: null,
        outputSize: null,
        outputWidth: null,
        outputHeight: null,
        durationMs: Math.round(performance.now() - startedAt),
        encodeAttempts: null,
        progressCount,
        uiTicks: ticks,
        heapBeforeMb,
        heapAfterMb: usedHeapMb(),
        error: caught instanceof Error ? caught.message : String(caught),
      });
    } finally {
      window.clearInterval(interval);
      client.dispose();
      setStatus('done');
    }
  }

  return (
    <section className="mt-8 border-t border-gray-200 pt-6">
      <h2 className="text-lg font-semibold">Performance harness</h2>
      <p className="mt-1 text-sm text-gray-500">
        Optimizes the chosen file to 200KB through the real worker path.
      </p>
      <input
        id="perf-input"
        type="file"
        accept=".jpg,.jpeg"
        disabled={status === 'running'}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void run(file);
          event.target.value = '';
        }}
        className="mt-3 block"
      />
      {status === 'running' && <p>Running…</p>}
      {result && (
        <div data-testid="perf-done" className="mt-3">
          <pre data-testid="perf-summary" className="hidden">
            {JSON.stringify(result)}
          </pre>
          <p>
            {result.error
              ? `Failed: ${result.error}`
              : `OK: ${(result.outputSize ?? 0) / 1024} KB in ${result.durationMs} ms`}
          </p>
        </div>
      )}
    </section>
  );
}
