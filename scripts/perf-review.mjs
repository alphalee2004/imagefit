import { readdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.E2E_URL ?? 'http://localhost:3000';
const PERF_DIR = '/tmp/imagefit-perf';

const files = readdirSync(PERF_DIR)
  .filter((name) => name.endsWith('.jpg'))
  .sort();

const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
const rows = [];

try {
  for (const file of files) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${BASE_URL}/engine-test`, { waitUntil: 'networkidle' });
    await page.setInputFiles('#perf-input', `${PERF_DIR}/${file}`);
    await page.waitForSelector('[data-testid="perf-done"]', { timeout: 240_000 });
    const raw = await page.locator('[data-testid="perf-summary"]').textContent();
    const summary = raw ? JSON.parse(raw) : null;
    rows.push({ ...summary, pageErrors });
    await page.close();
  }
} finally {
  await browser.close();
}

const passed = rows.every(
  (row) =>
    !row.error &&
    row.pageErrors.length === 0 &&
    row.outputSize !== null &&
    row.outputSize <= 200 * 1024,
);

console.log(JSON.stringify({ passed, rows }, null, 2));
if (!passed) process.exit(1);
