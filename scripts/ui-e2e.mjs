import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { chromium } from 'playwright-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.E2E_URL ?? 'http://localhost:3000';
const TEST_IMAGE = '/tmp/imagefit-ui-test.png';

writeFileSync(TEST_IMAGE, makeTestPng(1200, 800));

const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

  await page.setInputFiles('input[type="file"]', TEST_IMAGE);
  await page.waitForSelector('text=imagefit-ui-test.png');
  await page.getByRole('button', { name: 'Optimize Image' }).click();
  await page.waitForSelector('button:has-text("Download")', { timeout: 120_000 });

  const bodyText = await page.locator('body').innerText();
  const optimizedSection = bodyText.slice(
    bodyText.indexOf('Optimized\n') + 'Optimized\n'.length,
    bodyText.indexOf('smaller'),
  );
  const match = optimizedSection.match(/(\d+(?:\.\d+)?) KB/);
  const outputKb = match ? Number(match[1]) : null;
  const downloadVisible = await page.getByRole('button', { name: 'Download' }).isVisible();
  const passed = outputKb !== null && outputKb <= 200 && downloadVisible && errors.length === 0;

  console.log(JSON.stringify({ outputKb, downloadVisible, errors, passed }, null, 2));
  if (!passed) process.exit(1);
} finally {
  await browser.close();
}

function makeTestPng(width, height) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 4);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const i = row + 1 + x * 4;
      raw[i] = (x * 7) % 256;
      raw[i + 1] = (y * 5) % 256;
      raw[i + 2] = (x + y) % 256;
      raw[i + 3] = 255;
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', (() => {
      const data = Buffer.alloc(13);
      data.writeUInt32BE(width, 0);
      data.writeUInt32BE(height, 4);
      data[8] = 8;
      data[9] = 6;
      return data;
    })()),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])) >>> 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
