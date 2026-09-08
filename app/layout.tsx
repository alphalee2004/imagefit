import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Cleeke Image Tools - Compress, Resize & Convert',
    template: '%s | Cleeke',
  },
  description:
    'Cleeke is a free browser-based image tools platform. Compress, resize and convert JPG, PNG and WebP images without uploading them.',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'Cleeke Image Tools - Compress, Resize & Convert',
    description:
      'Compress, resize and convert JPG, PNG and WebP images in your browser. Private and free.',
    url: SITE_URL,
    images: [OG_IMAGE_URL],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cleeke Image Tools - Compress, Resize & Convert',
    description:
      'Compress, resize and convert JPG, PNG and WebP images in your browser. Private and free.',
    images: [OG_IMAGE_URL],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f8fa] text-gray-900 antialiased">
        <Header />
        {children}
        <Footer />
        <PageViewTracker />
      </body>
    </html>
  );
}
