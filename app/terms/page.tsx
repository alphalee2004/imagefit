import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Terms of Use',
  description:
    'Terms of use for Cleeke, the private browser-based image compression and conversion tool.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-normal">Terms of Use</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: September 6, 2026</p>
      <div className="mt-8 space-y-6 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">1. Use of the service</h2>
          <p className="mt-2 text-sm leading-6">
            Cleeke provides a free browser-based image processing service. You may use it for
            lawful purposes only.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">2. Your content</h2>
          <p className="mt-2 text-sm leading-6">
            You retain all rights to your images. Cleeke does not claim ownership and does not
            upload or store your images.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">3. No warranty</h2>
          <p className="mt-2 text-sm leading-6">
            The service is provided as-is. Cleeke does not guarantee that every image can be
            compressed to a requested target size without quality loss.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">4. Changes</h2>
          <p className="mt-2 text-sm leading-6">
            We may update these terms from time to time. Continued use after changes means you
            accept the updated terms.
          </p>
        </section>
      </div>
    </main>
  );
}
