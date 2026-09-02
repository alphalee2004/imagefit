import { execSync } from 'node:child_process';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT_DIR = '/tmp/imagefit-perf';
mkdirSync(OUT_DIR, { recursive: true });

const SPECS = [
  { name: 'perf-2mb', width: 4032, height: 3024, quality: 45 },
  { name: 'perf-5mb', width: 4032, height: 3024, quality: 80 },
  { name: 'perf-10mb', width: 6000, height: 4000, quality: 70 },
  { name: 'perf-20mb', width: 8000, height: 6000, quality: 65 },
  { name: 'perf-12mp', width: 4032, height: 3024, quality: 88 },
  { name: 'perf-24mp', width: 6000, height: 4000, quality: 88 },
  { name: 'perf-48mp', width: 8000, height: 6000, quality: 88 },
];

for (const spec of SPECS) {
  const pngPath = `${OUT_DIR}/${spec.name}.png`;
  const jpgPath = `${OUT_DIR}/${spec.name}.jpg`;
  console.log(`generating ${spec.name} (${spec.width}x${spec.height})`);
  writeFileSync(pngPath, makePng(spec.width, spec.height));
  execSync(
    `sips -s format jpeg -s formatOptions ${spec.quality} "${pngPath}" --out "${jpgPath}"`,
    { stdio: 'ignore' },
  );
  const pngMb = (statSync(pngPath).size / 1048576).toFixed(1);
  const jpgMb = (statSync(jpgPath).size / 1048576).toFixed(1);
  console.log(`  png ${pngMb} MB, jpg ${jpgMb} MB`);
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
