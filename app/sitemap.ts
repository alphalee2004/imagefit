import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { TOOL_PAGES } from '@/lib/toolPages';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/image-tools`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...Object.values(TOOL_PAGES).map((page) => ({
      url: `${SITE_URL}${page.path}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    },
  ];
}
