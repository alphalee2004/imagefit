import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { chromium } from 'playwright-core';

const OUT_DIR = '/tmp/imagefit-qa';
mkdirSync(OUT_DIR, { recursive: true });

console.log('generating PNG sources');
writeFileSync(`${OUT_DIR}/qa-small.png`, makePng(640, 480));
writeFileSync(`${OUT_DIR}/qa-medium.png`, makePng(1600, 1200));

console.log('converting JPGs');
for (const [name, quality] of [
  ['qa-small', 45],
  ['qa-medium', 82],
]) {
  execSync(
    `sips -s format jpeg -s formatOptions ${quality} "${OUT_DIR}/${name}.png" --out "${OUT_DIR}/${name}.jpg"`,
    { stdio: 'ignore' },
  );
}

if (!existsSync(`${OUT_DIR}/qa-medium.webp`)) {
  console.log('generating WebP in Chrome');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
    await page.evaluate(async () => {
      const canvas = new OffscreenCanvas(1600, 1200);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      const image = ctx.createImageData(1600, 1200);
      for (let y = 0; y < 1200; y += 1) {
        for (let x = 0; x < 1600; x += 1) {
          const i = (y * 1600 + x) * 4;
          image.data[i] = (x * 7 + y * 3) % 256;
          image.data[i + 1] = (x * 5 + y * 11) % 256;
          image.data[i + 2] = ((x >> 3) + (y >> 3)) % 256;
          image.data[i + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
      const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'qa-medium.webp';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
    const download = await downloadPromise;
    await download.saveAs(`${OUT_DIR}/qa-medium.webp`);
  } finally {
    await browser.close();
  }
}

for (const name of ['qa-small.jpg', 'qa-medium.jpg', 'qa-medium.webp', 'qa-medium.png']) {
  const path = `${OUT_DIR}/${name}`;
  if (existsSync(path)) {
    console.log(`${name}: ${(statSync(path).size / 1024).toFixed(1)} KB`);
  }
}

function makePng(width, height) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 4);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const i = row + 1 + x * 4;
      raw[i] = (x * 7 + y * 3) % 256;
      raw[i + 1] = (x * 5 + y * 11) % 256;
      raw[i + 2] = ((x >> 3) + (y >> 3)) % 256;
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
