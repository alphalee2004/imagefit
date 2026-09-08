import { describe, expect, it } from 'vitest';
import {
  breadcrumbSchema,
  canonicalUrl,
  OG_IMAGE_URL,
  SITE_NAME,
  SITE_URL,
} from '../seo';

describe('SEO configuration', () => {
  it('uses the production domain', () => {
    expect(SITE_URL).toBe('https://www.cleeke.com');
    expect(SITE_NAME).toBe('Cleeke');
    expect(canonicalUrl('/')).toBe('https://www.cleeke.com');
    expect(canonicalUrl('/compress-image')).toBe('https://www.cleeke.com/compress-image');
  });

  it('points OpenGraph and Twitter at the generated image', () => {
    expect(OG_IMAGE_URL).toBe('https://www.cleeke.com/opengraph-image');
  });

  it('builds a breadcrumb that matches the visible Image Tools hierarchy', () => {
    const schema = breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Image Tools', path: '/image-tools' },
      { name: 'Compress Image', path: '/compress-image' },
    ]);
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.cleeke.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Image Tools',
        item: 'https://www.cleeke.com/image-tools',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Compress Image',
        item: 'https://www.cleeke.com/compress-image',
      },
    ]);
  });
});
