import { statSync } from 'node:fs';
import { chromium } from 'playwright-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.E2E_URL ?? 'http://localhost:3000';
const ASSETS = '/tmp/imagefit-qa';
const PERF = '/tmp/imagefit-perf';

const results = [];

async function uploadAndOptimize({
  name,
  file,
  preset = '200 KB',
  customKb = null,
  expectError = false,
  timeout = 180_000,
  mobile = false,
  cancelAfterMs = null,
  assertNoGrow = false,
}) {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type="file"]', file);
  await page.waitForSelector('text=Optimize Image', { timeout: 10_000 });

  if (customKb !== null) {
    await page.getByRole('button', { name: 'Custom', exact: true }).click();
    await page.getByLabel('Custom target size').fill(String(customKb));
  } else if (preset !== '200 KB') {
    await page.getByRole('button', { name: preset, exact: true }).click();
  }

  const startedAt = Date.now();
  await page.getByRole('button', { name: 'Optimize Image' }).click();

  if (cancelAfterMs !== null) {
    await page.waitForTimeout(cancelAfterMs);
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForSelector('text=Optimizing', { state: 'detached', timeout: 15_000 }).catch(() => {});
    results.push({
      name,
      passed: (await page.getByRole('button', { name: 'Optimize Image' }).isVisible()) && pageErrors.length === 0,
      detail: 'cancelled and UI returned to ready',
      pageErrors,
      durationMs: Date.now() - startedAt,
    });
    await page.close();
    await browser.close();
    return;
  }

  if (expectError) {
    try {
      await page.waitForSelector('text=cannot be reduced below', { timeout });
      results.push({
        name,
        passed: pageErrors.length === 0,
        detail: 'expected unreachable error shown',
        pageErrors,
        durationMs: Date.now() - startedAt,
      });
    } catch {
      results.push({
        name,
        passed: false,
        detail: 'expected unreachable error did not appear',
        pageErrors,
        durationMs: Date.now() - startedAt,
      });
    }
    await page.close();
    await browser.close();
    return;
  }

  const downloadPromise = page.waitForEvent('download', { timeout });
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await downloadPromise;
  const targetPath = `/tmp/imagefit-qa/${name.replace(/\s+/g, '-')}.out`;
  await download.saveAs(targetPath);
  const outputBytes = statSync(targetPath).size;
  const inputBytes = statSync(file).size;
  const bodyText = await page.locator('body').innerText();
  const optimizedSection = bodyText.slice(
    bodyText.indexOf('Optimized\n') + 'Optimized\n'.length,
    bodyText.indexOf('smaller'),
  );
  const sizeMatch = optimizedSection.match(/([\d.]+) (KB|MB)/);
  const dimsMatch = optimizedSection.match(/(\d+) × (\d+)/);
  const targetBytes = customKb !== null ? customKb * 1024 : preset === '100 KB' ? 100 * 1024 : 200 * 1024;
  const durationMs = Date.now() - startedAt;
  results.push({
    name,
    passed:
      outputBytes <= targetBytes &&
      (!assertNoGrow || outputBytes <= inputBytes) &&
      sizeMatch !== null &&
      pageErrors.length === 0 &&
      download.suggestedFilename().length > 0,
    outputBytes,
    inputBytes,
    targetBytes,
    displayed: sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2]}` : null,
    dimensions: dimsMatch ? `${dimsMatch[1]}×${dimsMatch[2]}` : null,
    filename: download.suggestedFilename(),
    durationMs,
    pageErrors,
  });
  await page.close();
  await browser.close();
}

await uploadAndOptimize({ name: 'JPG to 100KB', file: `${ASSETS}/qa-medium.jpg`, preset: '100 KB' });
await uploadAndOptimize({ name: 'JPG to 200KB', file: `${ASSETS}/qa-medium.jpg` });
await uploadAndOptimize({ name: 'PNG to 100KB', file: `${ASSETS}/qa-medium.png`, preset: '100 KB', timeout: 240_000 });
await uploadAndOptimize({ name: 'WebP to 100KB', file: `${ASSETS}/qa-medium.webp`, preset: '100 KB' });
await uploadAndOptimize({ name: 'Already under 100KB', file: `${ASSETS}/qa-small.jpg`, preset: '100 KB', assertNoGrow: true });
await uploadAndOptimize({ name: 'Huge 48MP to 200KB', file: `${PERF}/perf-48mp.jpg`, timeout: 240_000 });
await uploadAndOptimize({ name: 'Impossible 1KB target', file: `${PERF}/perf-48mp.jpg`, preset: null, customKb: 1, expectError: true, timeout: 60_000 });
await uploadAndOptimize({ name: 'Cancel large job', file: `${PERF}/perf-48mp.jpg`, cancelAfterMs: 300 });
await uploadAndOptimize({ name: 'Mobile JPG to 100KB', file: `${ASSETS}/qa-medium.jpg`, preset: '100 KB', mobile: true });

const passed = results.every((row) => row.passed);
console.log(JSON.stringify({ passed, results }, null, 2));
if (!passed) process.exit(1);
