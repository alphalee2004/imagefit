import { chromium } from 'playwright-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.E2E_URL ?? 'http://localhost:3000';

const browser = await chromium.launch({
  executablePath: CHROME_PATH,
  headless: true,
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('console', (message) => {
    if (message.type() === 'error') console.log('[console.error]', message.text());
  });

  await page.goto(`${BASE_URL}/engine-test`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="engine-test-done"]', { timeout: 240_000 });
  const raw = await page.locator('[data-testid="engine-test-summary"]').textContent();
  if (!raw) throw new Error('Engine test summary is empty.');

  const summary = JSON.parse(raw);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.passed) process.exit(1);
} finally {
  await browser.close();
}
