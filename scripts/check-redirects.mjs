const CANONICAL_ORIGIN = process.env.CANONICAL_ORIGIN ?? 'https://www.cleeke.com';
const APEX_ORIGIN = process.env.APEX_ORIGIN ?? 'https://cleeke.com';
const EXPECTED_CANONICAL_ORIGIN =
  process.env.EXPECTED_CANONICAL_ORIGIN ?? CANONICAL_ORIGIN;
const CHECK_VARIANTS = process.env.CHECK_VARIANTS !== 'false';

async function request(url) {
  const response = await fetch(url, {
    redirect: 'manual',
    headers: { 'user-agent': 'Cleeke redirect audit' },
  });
  return {
    url,
    status: response.status,
    location: response.headers.get('location'),
    contentType: response.headers.get('content-type'),
    response,
  };
}

function canonicalForPath(path) {
  return path === '/' ? EXPECTED_CANONICAL_ORIGIN : `${EXPECTED_CANONICAL_ORIGIN}${path}`;
}

function normalizedUrl(value, base) {
  const url = new URL(value, base);
  const pathname = url.pathname.replace(/\/$/, '');
  return `${url.origin}${pathname}${url.search}`;
}

function canonicalFromHtml(html) {
  return html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["']/i)?.[1]
    ?? null;
}

const sitemapResponse = await fetch(`${CANONICAL_ORIGIN}/sitemap.xml`);
if (!sitemapResponse.ok) {
  throw new Error(`Sitemap returned ${sitemapResponse.status}.`);
}
const sitemap = await sitemapResponse.text();
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const internalUrls = new Set(sitemapUrls);
const sitemapResults = [];
const htmlResults = [];

for (const sitemapUrl of sitemapUrls) {
  const result = await request(sitemapUrl);
  sitemapResults.push({
    url: sitemapUrl,
    status: result.status,
    location: result.location,
  });
  if (result.status !== 200) continue;

  const html = await result.response.text();
  const canonical = canonicalFromHtml(html);
  htmlResults.push({ url: sitemapUrl, canonical });

  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    const linked = new URL(match[1], sitemapUrl);
    linked.hash = '';
    if (linked.origin === new URL(CANONICAL_ORIGIN).origin) {
      internalUrls.add(linked.href);
    }
  }
}

const internalResults = [];
for (const url of internalUrls) {
  if (sitemapUrls.includes(url)) continue;
  const result = await request(url);
  internalResults.push({
    url,
    status: result.status,
    location: result.location,
  });
}

const canonicalErrors = htmlResults.filter(({ url, canonical }) => {
  const path = new URL(url).pathname;
  return canonical !== canonicalForPath(path);
});
const sitemapRedirects = sitemapResults.filter(({ status }) => status >= 300 && status < 400);
const internalRedirects = internalResults.filter(({ status }) => status >= 300 && status < 400);
const sitemapErrors = sitemapResults.filter(({ status }) => status !== 200);
const internalErrors = internalResults.filter(
  ({ status }) => status !== 200,
);

const expectedVariants = [];
if (CHECK_VARIANTS) {
  for (const sitemapUrl of sitemapUrls) {
    const url = new URL(sitemapUrl);
    const apexUrl = new URL(`${url.pathname}${url.search}`, APEX_ORIGIN);
    const trailingSlashUrl = new URL(sitemapUrl);
    trailingSlashUrl.pathname = `${url.pathname}/`;

    for (const variant of [apexUrl.href, trailingSlashUrl.href]) {
      if (variant === sitemapUrl || (url.pathname === '/' && variant === trailingSlashUrl.href)) {
        continue;
      }
      const result = await request(variant);
      expectedVariants.push({
        source: variant,
        status: result.status,
        location: result.location,
        target: sitemapUrl,
      });
    }
  }
}

const variantErrors = expectedVariants.filter(
  (variant) =>
    variant.status < 300 ||
    variant.status >= 400 ||
    normalizedUrl(variant.location ?? variant.source, variant.source) !==
      normalizedUrl(variant.target),
);

const output = {
  canonicalOrigin: CANONICAL_ORIGIN,
  expectedCanonicalOrigin: EXPECTED_CANONICAL_ORIGIN,
  variantsChecked: CHECK_VARIANTS,
  sitemapCount: sitemapUrls.length,
  internalCount: internalUrls.size,
  sitemapErrors,
  sitemapRedirects,
  internalErrors,
  internalRedirects,
  canonicalErrors,
  variantErrors,
  expectedVariants,
  ok:
    sitemapErrors.length === 0 &&
    sitemapRedirects.length === 0 &&
    internalErrors.length === 0 &&
    internalRedirects.length === 0 &&
    canonicalErrors.length === 0 &&
    variantErrors.length === 0,
};

console.log(JSON.stringify(output, null, 2));
if (!output.ok) process.exit(1);
