import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  description:
    'Cleeke processes images locally in your browser. Your files are never uploaded to our servers.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-normal">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: September 6, 2026</p>
      <div className="mt-8 space-y-6 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">1. Your images stay on your device</h2>
          <p className="mt-2 text-sm leading-6">
            Cleeke performs compression, resizing, editing, and format conversion inside your
            browser. Your images are not uploaded to Cleeke servers and are not stored by us.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">2. What we may collect</h2>
          <p className="mt-2 text-sm leading-6">
            We may collect anonymous product analytics such as page views, target size choices,
            image dimensions, and processing outcomes. We never collect image content, file names,
            image bytes, or other personal data.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">3. Accounts and storage</h2>
          <p className="mt-2 text-sm leading-6">
            Cleeke does not require an account and does not provide cloud storage for your images.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">4. Third-party services</h2>
          <p className="mt-2 text-sm leading-6">
            We may use a privacy-focused analytics provider to understand general usage. Such
            providers may receive anonymized event data, but never your images.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">5. Changes</h2>
          <p className="mt-2 text-sm leading-6">
            If this policy changes, the updated version will be posted on this page.
          </p>
        </section>
      </div>
    </main>
  );
}
