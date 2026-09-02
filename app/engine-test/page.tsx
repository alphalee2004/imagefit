import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EngineTestHarness from '@/components/EngineTestHarness';
import PerformanceHarness from '@/components/PerformanceHarness';

export const metadata: Metadata = {
  title: 'Engine Test',
  robots: { index: false, follow: false },
};

export default function EngineTestPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_TEST_PAGES !== 'true') {
    notFound();
  }
  return (
    <main className="min-h-screen bg-white">
      <EngineTestHarness />
      <div className="mx-auto max-w-5xl p-6">
        <PerformanceHarness />
      </div>
    </main>
  );
}
