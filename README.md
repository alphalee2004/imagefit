# ImageFit

Compress, resize, and convert images to the size you need.

## Architecture

- `engine/` - framework- and DOM-free image engine. It runs inside a Web Worker
  and communicates through typed protocol messages, so a future batch flow or
  API can reuse the same core.
- `app/` - Next.js App Router pages. Each tool route is a thin page around the
  shared optimizer UI.
- `components/` - React UI. It depends on the `EngineClient` contract, never on
  the worker implementation directly.
- `lib/` - UI helpers, tool page configuration, SEO data, and the analytics
  event layer.

## Image Engine

The public entry point is `optimizeImage(input, options)` implemented by
`engine/imageEngine.ts`. Browser raster APIs are hidden behind
`engine/adapters.ts`, and the worker protocol lives in `engine/worker/protocol.ts`.

Encoding decision and rationale: see `docs/encoder-decision.md`. v1 uses native
OffscreenCanvas encoding; no WASM codecs are downloaded.

## Engine tests

Unit tests run in Node with a fake adapter:

```bash
npm test
```

Real encoder tests run in Chrome against the hidden `/engine-test` page:

```bash
npm run build
npm run start
node scripts/e2e.mjs
```

The browser suite asserts `outputSize <= targetSize` across 100 KB, 200 KB, and
500 KB targets, small and large images, PNG/JPEG/WebP, an extreme 1 KB target,
and an image that is already smaller than the target.

## Development

```bash
npm install
npm run dev
```

Each development phase runs `node scripts/check.mjs` (tests, TypeScript, ESLint,
production build) before moving on.
