import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleeke.com';
export const SITE_NAME = 'Cleeke';
export const OG_IMAGE_URL = canonicalUrl('/opengraph-image');

export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path === '/' ? '' : path}`;
}

export function pageMetadata(data: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = canonicalUrl(data.path);
  return {
    title: data.title,
    description: data.description,
    alternates: { canonical: url },
    openGraph: {
      title: data.title,
      description: data.description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [OG_IMAGE_URL],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
      images: [OG_IMAGE_URL],
    },
    robots: { index: true, follow: true },
  };
}

export function breadcrumbSchema(name: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: canonicalUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name,
        item: canonicalUrl(path),
      },
    ],
  };
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: canonicalUrl('/'),
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: [
      'Target file size compression',
      'Image resizing',
      'JPG, PNG and WebP conversion',
      '100% browser-based processing',
    ],
  };
}

export function faqPageSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
