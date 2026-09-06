# AGENTS.md

Project: Cleeke - browser-first image size optimizer.

Read this file before every development task. It defines the long-term rules
for this project.

## Hard Rules

1. TypeScript strict mode is mandatory. Never loosen `strict` to make code compile.
2. No `any`. If a type is genuinely unavailable, use `unknown` plus a narrow,
   commented cast instead.
3. UI and Image Engine stay decoupled. UI components never import engine
   implementation; they use the `EngineClient` worker contract through hooks or
   controllers.
4. Image decode, resize, encode, and optimization search must run in a Web
   Worker. Never decode large images on the main thread.
5. User images are never uploaded to any server. All processing is local.
6. Every core algorithm (search, dimension planning, format detection, error
   model) must have unit tests.
7. After any change to `engine/`, run the engine-related tests before moving on.
8. After any change to SEO pages or metadata, verify title, description,
   canonical, OpenGraph, H1, sitemap, and robots.
9. Do not create low-value programmatic SEO pages. Every page must map to a
   real user task.
10. Do not add large unnecessary dependencies. Prefer browser-native APIs
    (OffscreenCanvas, createImageBitmap).
11. Never delete existing tests to make a failing suite pass.
12. Never disable TypeScript strict to fix errors.
13. Never use broad `eslint-disable` to bypass problems. Disable per line with
    justification only.
14. No temporary code in the production path: no mock placeholders, fake data,
    or debug-only hacks. Test harnesses must be isolated and noindexed.
15. Before finishing any task, run: typecheck, lint, tests, production build.

## Project Architecture

```text
engine/       DOM-free image engine, pure search logic, worker protocol
app/          Next.js App Router pages (SSG/SSR, SEO metadata)
components/   React UI; depends only on the EngineClient contract
hooks/        UI controllers and state machines
lib/          analytics, SEO data, tool configs, utils
scripts/      dev/QA tooling (checks, e2e, performance harness)
```

Data flow: `UI -> Hook/Controller -> WorkerEngineClient -> Web Worker -> Image
Engine -> Result`. Business components never touch the engine directly.

## Image Engine Contract

```ts
optimizeImage(input, options?, onProgress?) => Promise<OptimizationResult>
```

Input: `{ data: ArrayBuffer | Uint8Array; mimeType: string; name?: string }`.

Options: `targetSize`, `targetFormat`, `maxWidth`, `maxHeight`,
`preserveMetadata`, `fallbackQuality`, `cancellationToken`, `maxOutputDimension`.

Result: `outputBlob`, `outputSize`, `width`, `height`, `format`, `quality`,
`compressionRatio`, `originalSize`, `originalWidth`, `originalHeight`,
`originalFormat`, `targetSize`, `targetReached`, `scale`, `durationMs`,
`encodeAttempts`, `metadataPreserved`.

Algorithm rules:
- Binary-search quality at the original resolution first.
- If the target is unreachable, binary-search resolution, then re-run the
  quality search at the chosen resolution.
- Keep the best feasible probe even when encoder sizes are not strictly
  monotonic; never loop without a bounded iteration count.
- If even the minimum resolution cannot fit, throw `TARGET_UNREACHABLE` with
  the smallest achievable size.
- The engine never depends on DOM APIs; raster APIs live behind
  `ImageEngineAdapter`.

## Worker Contract

- `WorkerRequest`: `{ requestId, operation, payload }`.
- `WorkerResponse`: `{ requestId, status, progress, result, error }`.
- Operations: `inspect`, `optimize`, `resize`, `convert`, `cancel`.
- Progress is stage-based and throttled to a small set of values between 0 and 100.
- Cancellation: the worker checks the token between encode attempts, stops
  subsequent work, and releases resources.
- `WorkerEngineClient`: typed methods, progress callback, `cancelAll`,
  `dispose`, and crash recovery by creating a fresh worker.
- ArrayBuffers are transferred into the worker without copying; the worker
  nulls large buffers after use and the engine disposes every ImageBitmap.

## SEO Rules

- Every page needs: title, description, canonical, OpenGraph, robots, a single
  H1, the tool in the main content area, How it works, FAQ, and related tools.
- Every page must correspond to a real user task. Keyword-swap duplicate pages
  are forbidden.
- After any SEO change, run `scripts/check-pages.mjs` and verify sitemap and
  robots output.

## Analytics Events

- Abstraction: `track(eventName, properties)` in `lib/analytics.ts`; providers
  are swappable (GA4, Plausible, Cloudflare, or a development no-op).
- Events: `page_view`, `upload_started`, `image_loaded`,
  `optimization_started`, `optimization_completed`, `optimization_failed`,
  `optimization_cancelled`, `download_clicked`, `target_size_selected`,
  `format_selected`, `batch_started`, `batch_completed`.
- Never log filenames, image bytes, blob URLs, or personal data.

## Performance Rules

- Processing runs in the Worker; the main thread must stay responsive.
- Memory: dispose ImageBitmaps, revoke Object URLs, transfer ArrayBuffers,
  null large buffers after use, cap input at 50 MB, and cap output dimensions
  adaptively on low-memory devices.
- No WASM codec downloads in v1.
- Performance matrix: 2/5/10/20 MB JPG and 12/24/48 MP photos; assert no crash,
  no freeze, and `outputSize <= targetSize`.
