import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Cleeke - Compress Images to the Size You Need',
    template: '%s | Cleeke',
  },
  description:
    'Compress, resize and convert JPG, PNG and WebP images to the size you need. Fast and private: files are processed in your browser and never uploaded.',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'Cleeke - Compress Images to the Size You Need',
    description:
      'Compress, resize and convert images to the size you need. 100% private, in your browser.',
    url: SITE_URL,
    images: [OG_IMAGE_URL],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cleeke - Compress Images to the Size You Need',
    description:
      'Compress, resize and convert images to the size you need. 100% private, in your browser.',
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
