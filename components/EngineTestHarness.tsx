'use client';

import { useEffect, useState } from 'react';
import { createBrowserAdapter, isBrowserEngineSupported } from '@/engine/adapters/browser';
import { createImageEngine } from '@/engine/imageEngine';
import { OptimizationError } from '@/engine/errors';
import type { ImageFormat, OptimizationInput, OptimizationOptions } from '@/engine/types';

interface CaseResult {
  name: string;
  passed: boolean;
  expectedError?: boolean;
  outputSize: number | null;
  targetSize: number | null;
  width: number | null;
  height: number | null;
  format: string | null;
  quality: number | null;
  durationMs: number | null;
  encodeAttempts: number | null;
  error?: string;
}

interface TestSummary {
  passed: boolean;
  supported: boolean;
  total: number;
  passedCount: number;
  failed: CaseResult[];
  averageEncodeAttempts: number | null;
  averageDurationMs: number | null;
  totalDurationMs: number;
  cases: CaseResult[];
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function makeTestImage(
  width: number,
  height: number,
  type: string,
  quality = 0.95,
): Promise<OptimizationInput> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available.');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1d4ed8');
  gradient.addColorStop(0.5, '#0d9488');
  gradient.addColorStop(1, '#7c3aed');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const random = mulberry32(width * 31 + height);
  for (let i = 0; i < Math.min(400, width); i += 1) {
    ctx.fillStyle = `rgba(${Math.floor(random() * 255)}, ${Math.floor(random() * 255)}, ${Math.floor(
      random() * 255,
    )}, ${0.25 + random() * 0.6})`;
    ctx.fillRect(
      Math.floor(random() * width),
      Math.floor(random() * height),
      Math.max(2, Math.floor(random() * 40)),
      Math.max(2, Math.floor(random() * 40)),
    );
  }

  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const blob = await canvas.convertToBlob(
    type === 'image/png' ? { type } : { type, quality },
  );
  return {
    data: await blob.arrayBuffer(),
    mimeType: type,
    name: `test-${width}x${height}.${extension}`,
  };
}

interface TestCase {
  name: string;
  options: OptimizationOptions;
  expectsUnreachable?: boolean;
  build: () => Promise<OptimizationInput>;
}

const TEST_CASES: TestCase[] = [
  {
    name: 'JPEG 1600x1200 to 100 KB',
    options: { targetSize: 100 * 1024, targetFormat: 'jpeg' },
    build: () => makeTestImage(1600, 1200, 'image/jpeg'),
  },
  {
    name: 'JPEG 1600x1200 to 200 KB',
    options: { targetSize: 200 * 1024, targetFormat: 'jpeg' },
    build: () => makeTestImage(1600, 1200, 'image/jpeg'),
  },
  {
    name: 'PNG 1600x1200 to 500 KB',
    options: { targetSize: 500 * 1024, targetFormat: 'png' },
    build: () => makeTestImage(1600, 1200, 'image/png'),
  },
  {
    name: 'Small JPEG 120x90 to 50 KB',
    options: { targetSize: 50 * 1024, targetFormat: 'jpeg' },
    build: () => makeTestImage(120, 90, 'image/jpeg', 0.92),
  },
  {
    name: 'Large WebP 2000x1500 to 300 KB',
    options: { targetSize: 300 * 1024, targetFormat: 'webp' },
    build: () => makeTestImage(2000, 1500, 'image/webp'),
  },
  {
    name: 'PNG to WebP 1400x1000 to 200 KB',
    options: { targetSize: 200 * 1024, targetFormat: 'webp' },
    build: () => makeTestImage(1400, 1000, 'image/png'),
  },
  {
    name: 'WebP 1400x1000 to 100 KB',
    options: { targetSize: 100 * 1024, targetFormat: 'webp' },
    build: () => makeTestImage(1400, 1000, 'image/webp'),
  },
  {
    name: 'JPEG 1200x800 to 100 KB',
    options: { targetSize: 100 * 1024, targetFormat: 'jpeg' },
    build: () => makeTestImage(1200, 800, 'image/jpeg'),
  },
  {
    name: 'Extreme 1 KB target',
    options: { targetSize: 1024, targetFormat: 'jpeg' },
    expectsUnreachable: true,
    build: () => makeTestImage(1600, 1200, 'image/jpeg'),
  },
  {
    name: 'Already smaller than 500 KB target',
    options: { targetSize: 500 * 1024, targetFormat: 'jpeg' },
    build: () => makeTestImage(120, 90, 'image/jpeg', 0.9),
  },
];

export default function EngineTestHarness() {
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supported = isBrowserEngineSupported();
      const cases: CaseResult[] = [];
      const startedAt = performance.now();

      if (supported) {
        const optimize = createImageEngine(createBrowserAdapter());
        for (const testCase of TEST_CASES) {
          const caseStartedAt = performance.now();
          try {
            const input = await testCase.build();
            const result = await optimize(input, testCase.options);
            const sizeOk = result.outputSize <= testCase.options.targetSize!;
            const passed = !testCase.expectsUnreachable && sizeOk && result.outputSize > 0;
            cases.push({
              name: testCase.name,
              passed,
              expectedError: testCase.expectsUnreachable,
              outputSize: result.outputSize,
              targetSize: testCase.options.targetSize ?? null,
              width: result.width,
              height: result.height,
              format: result.format as ImageFormat,
              quality: result.quality,
              durationMs: result.durationMs,
              encodeAttempts: result.encodeAttempts,
              error: sizeOk ? undefined : `output ${result.outputSize} exceeded target ${testCase.options.targetSize}`,
            });
          } catch (error) {
            const isUnreachable =
              error instanceof OptimizationError && error.code === 'TARGET_UNREACHABLE';
            cases.push({
              name: testCase.name,
              passed: testCase.expectsUnreachable === true && isUnreachable,
              expectedError: testCase.expectsUnreachable,
              outputSize: null,
              targetSize: testCase.options.targetSize ?? null,
              width: null,
              height: null,
              format: null,
              quality: null,
              durationMs: Math.round(performance.now() - caseStartedAt),
              encodeAttempts: null,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      const totalDurationMs = Math.round(performance.now() - startedAt);
      const passedCount = cases.filter((item) => item.passed).length;
      const attempts = cases.filter((item) => item.encodeAttempts !== null);
      const durations = cases.filter((item) => item.durationMs !== null);
      const nextSummary: TestSummary = {
        passed: supported && passedCount === TEST_CASES.length,
        supported,
        total: TEST_CASES.length,
        passedCount,
        failed: cases.filter((item) => !item.passed),
        averageEncodeAttempts: attempts.length
          ? attempts.reduce((sum, item) => sum + (item.encodeAttempts ?? 0), 0) / attempts.length
          : null,
        averageDurationMs: durations.length
          ? durations.reduce((sum, item) => sum + (item.durationMs ?? 0), 0) / durations.length
          : null,
        totalDurationMs,
        cases,
      };
      if (!cancelled) {
        setSummary(nextSummary);
        setRunning(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-xl font-semibold">Image Engine browser test</h1>
      {running && <p data-testid="engine-test-running">Running with real browser encoders...</p>}
      {summary && (
        <div data-testid="engine-test-done" className="mt-4 space-y-4">
          <p className={summary.passed ? 'text-green-700' : 'text-red-700'}>
            {summary.passed ? 'All tests passed' : `${summary.failed.length} test(s) failed`} -{' '}
            {summary.passedCount}/{summary.total}, avg {summary.averageEncodeAttempts?.toFixed(1)} encodes,
            avg {summary.averageDurationMs?.toFixed(0)} ms, total {summary.totalDurationMs} ms
          </p>
          <pre data-testid="engine-test-summary" className="hidden">
            {JSON.stringify(summary)}
          </pre>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Case</th>
                <th>Result</th>
                <th>Output</th>
                <th>Target</th>
                <th>Dimensions</th>
                <th>Quality</th>
                <th>Encodes</th>
                <th>ms</th>
              </tr>
            </thead>
            <tbody>
              {summary.cases.map((item) => (
                <tr key={item.name} className="border-b">
                  <td className="py-2">{item.name}</td>
                  <td className={item.passed ? 'text-green-700' : 'text-red-700'}>
                    {item.passed ? 'PASS' : 'FAIL'}
                  </td>
                  <td>{item.outputSize ?? '-'}</td>
                  <td>{item.targetSize ?? '-'}</td>
                  <td>
                    {item.width && item.height ? `${item.width}x${item.height}` : '-'}
                  </td>
                  <td>{item.quality?.toFixed(3) ?? '-'}</td>
                  <td>{item.encodeAttempts ?? '-'}</td>
                  <td>{item.durationMs ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {summary.failed.length > 0 && (
            <ul className="text-sm text-red-700">
              {summary.failed.map((item) => (
                <li key={item.name}>
                  {item.name}: {item.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
