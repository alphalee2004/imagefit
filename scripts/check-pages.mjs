import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.E2E_URL ?? 'http://localhost:3000';
const SHOT_DIR = '/tmp/imagefit-shots';
mkdirSync(SHOT_DIR, { recursive: true });

const ROUTES = [
  '/',
  '/compress-image',
  '/compress-image-to-100kb',
  '/compress-image-to-200kb',
  '/resize-image',
  '/resize-image-to-100kb',
  '/image-converter',
];

const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
const results = [];

try {
  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
    const title = await page.title();
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href')
      .catch(() => null);
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute('content')
      .catch(() => null);
    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute('content')
      .catch(() => null);
    const description = await page
      .locator('meta[name="description"]')
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
    const breadcrumbCount = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) =>
        scripts.filter((script) => script.textContent?.includes('BreadcrumbList')).length,
      );
    const h1Count = await page.locator('h1').count();
    const h1 = (await page.locator('h1').first().textContent())?.trim();
    const internalLinks = await page
      .locator('a[href^="/"]')
      .count();
    await page.screenshot({ path: `${SHOT_DIR}${route === '/' ? '/home' : route}.png`, fullPage: false });
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

    const ok =
      h1Count === 1 &&
      Boolean(canonical) &&
      Boolean(ogTitle) &&
      Boolean(description) &&
      Boolean(ogImage) &&
      Boolean(twitterCard) &&
      jsonLdCount > 0 &&
      internalLinks >= 3 &&
      bodyWidth <= viewportWidth;
    results.push({
      route,
      title,
      canonical,
      ogTitle,
      ogUrl,
      description,
      ogImage,
      twitterCard,
      jsonLdCount,
      breadcrumbCount,
      internalLinks,
      h1,
      h1Count,
      bodyWidth,
      viewportWidth,
      ok,
    });
  }

  const page = await browser.newPage();
  const robots = await (await page.goto(`${BASE_URL}/robots.txt`)).text();
  const sitemap = await (await page.goto(`${BASE_URL}/sitemap.xml`)).text();
  await page.close();

  console.log(JSON.stringify({ results, robots, sitemap }, null, 2));
  if (results.some((item) => !item.ok)) process.exit(1);
} finally {
  await browser.close();
}
