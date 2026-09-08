import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.E2E_URL ?? 'http://localhost:3000';
const CANONICAL_ORIGIN = process.env.CANONICAL_ORIGIN ?? 'https://www.cleeke.com';
const SHOT_DIR = process.env.SHOT_DIR ?? '/tmp/imagefit-shots';
mkdirSync(SHOT_DIR, { recursive: true });

const ROUTES = [
  '/',
  '/image-tools',
  '/compress-image',
  '/compress-image-to-100kb',
  '/compress-image-to-200kb',
  '/resize-image',
  '/resize-image-to-100kb',
  '/image-converter',
  '/privacy',
  '/terms',
];

const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
const results = [];

function sitemapLocForRoute(route) {
  return route === '/' ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${route}`;
}

function textWords(text) {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'your',
    'you',
    'are',
    'this',
    'that',
    'from',
    'can',
    'cleeke',
    'image',
    'images',
  ]);
  const matches = text.toLowerCase().match(/[a-z0-9]+/g);
  return (matches ?? []).filter((word) => word.length > 2 && !stopWords.has(word));
}

function similarityScore(left, right) {
  const leftWords = new Set(textWords(left));
  const rightWords = new Set(textWords(right));
  if (leftWords.size === 0 || rightWords.size === 0) return 0;
  let shared = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) shared += 1;
  }
  return (2 * shared) / (leftWords.size + rightWords.size);
}

try {
  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
    const title = await page.title();
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
      .catch(() => null);
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href')
      .catch(() => null);
    const robots = await page
      .locator('meta[name="robots"]')
      .getAttribute('content')
      .catch(() => null);
    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute('content')
      .catch(() => null);
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content')
      .catch(() => null);
    const twitterCard = await page
      .locator('meta[name="twitter:card"]')
      .getAttribute('content')
      .catch(() => null);
    const jsonLdCount = await page.locator('script[type="application/ld+json"]').count();
    const h1Count = await page.locator('h1').count();
    const h1 = (await page.locator('h1').first().textContent())?.trim();
    const internalLinks = await page.locator('a[href^="/"]').count();
    const bodyText = await page.evaluate(() => {
      const nodes = [
        ...document.querySelectorAll('main h1, main h2, main h3, main p, main li'),
      ];
      return nodes
        .filter((node) => !node.closest('[data-tool-panel]'))
        .map((node) => node.textContent ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    });

    const canonicalHostOk = Boolean(canonical) && canonical.startsWith(CANONICAL_ORIGIN);
    const noindex = Boolean(robots && robots.toLowerCase().includes('noindex'));
    const isLegalPage = route === '/privacy' || route === '/terms';
    const pageOk =
      h1Count === 1 &&
      Boolean(description) &&
      canonicalHostOk &&
      Boolean(ogUrl) &&
      Boolean(ogImage) &&
      Boolean(twitterCard) &&
      (isLegalPage || jsonLdCount > 0) &&
      internalLinks >= 3 &&
      !noindex &&
      (isLegalPage || bodyText.length >= 600);

    await page.screenshot({
      path: `${SHOT_DIR}${route === '/' ? '/home' : route}.png`,
      fullPage: false,
    });
    await page.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
    const bodyWidth = await mobile.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await mobile.evaluate(() => window.innerWidth);
    await mobile.screenshot({
      path: `${SHOT_DIR}${route === '/' ? '/home' : route}-mobile.png`,
      fullPage: false,
    });
    await mobile.close();

    results.push({
      route,
      title,
      canonical,
      ogUrl,
      description,
      robots,
      jsonLdCount,
      h1,
      h1Count,
      bodyText,
      bodyTextLength: bodyText.length,
      internalLinks,
      noindex,
      canonicalHostOk,
      bodyWidth,
      viewportWidth,
      ok: pageOk && bodyWidth <= viewportWidth,
    });
  }

  const page = await browser.newPage();
  const robots = await (await page.goto(`${BASE_URL}/robots.txt`)).text();
  const sitemap = await (await page.goto(`${BASE_URL}/sitemap.xml`)).text();
  await page.close();

  const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const expectedLocs = ROUTES.map((route) => sitemapLocForRoute(route)).sort();
  const sitemapHostOk = locs.every((loc) => loc.startsWith(CANONICAL_ORIGIN));
  const sitemapRoutesOk = JSON.stringify([...locs].sort()) === JSON.stringify(expectedLocs);
  const robotsSitemapLine = robots.match(/Sitemap:\s*(\S+)/i)?.[1] ?? null;
  const robotsSitemapOk = robotsSitemapLine === `${CANONICAL_ORIGIN}/sitemap.xml`;

  const seenTitles = new Map();
  const duplicateTitles = [];
  for (const result of results) {
    const existing = seenTitles.get(result.title);
    if (existing) {
      duplicateTitles.push(`${existing} and ${result.route}`);
    } else {
      seenTitles.set(result.title, result.route);
    }
  }

  const similarPages = [];
  for (let left = 0; left < results.length; left += 1) {
    for (let right = left + 1; right < results.length; right += 1) {
      const score = similarityScore(results[left].bodyText, results[right].bodyText);
      if (score > 0.8) {
        similarPages.push(
          `${results[left].route} and ${results[right].route} (${score.toFixed(2)})`,
        );
      }
    }
  }

  const allOk =
    results.every((result) => result.ok) &&
    sitemapHostOk &&
    sitemapRoutesOk &&
    robotsSitemapOk &&
    duplicateTitles.length === 0 &&
    similarPages.length === 0;

  console.log(
    JSON.stringify(
      {
        canonicalOrigin: CANONICAL_ORIGIN,
        results,
        robots,
        sitemap,
        robotsSitemapOk,
        sitemapHostOk,
        sitemapRoutesOk,
        duplicateTitles,
        similarPages,
        ok: allOk,
      },
      null,
      2,
    ),
  );
  if (!allOk) process.exit(1);
} finally {
  await browser.close();
}
