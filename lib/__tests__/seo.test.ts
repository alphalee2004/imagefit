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
    expect(SITE_URL).toBe('https://cleeke.com');
    expect(SITE_NAME).toBe('ImageFit');
    expect(canonicalUrl('/')).toBe('https://cleeke.com');
    expect(canonicalUrl('/compress-image')).toBe('https://cleeke.com/compress-image');
  });

  it('points OpenGraph and Twitter at the generated image', () => {
    expect(OG_IMAGE_URL).toBe('https://cleeke.com/opengraph-image');
  });

  it('builds a two-level breadcrumb', () => {
    const schema = breadcrumbSchema('Compress Image', '/compress-image');
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://cleeke.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Compress Image',
        item: 'https://cleeke.com/compress-image',
      },
    ]);
  });
});
