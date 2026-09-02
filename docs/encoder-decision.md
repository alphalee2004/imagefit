# Encoder decision for v1

## Options evaluated

| Encoder | Compatibility | Stability | Performance | Notes |
| --- | --- | --- | --- | --- |
| Canvas API (main thread) | Universal | Very stable | Blocks UI on large images | Only reasonable as a fallback path |
| OffscreenCanvas + `convertToBlob` | Chrome 69+, Firefox 105+, Safari 16.4+ | Very stable | Runs off the main thread in a Worker; native JPEG/WebP/PNG encode | Chosen for v1 |
| WebCodecs | Growing, but encode-side support and quality control still uneven across browsers | Newer API surface | Fast, low-level | Not stable enough for a consumer-first tool in v1 |
| WASM codecs (mozjpeg, libwebp, oxipng) | Excellent where supported | Good, but adds multi-MB downloads and codec maintenance | High quality ratios | Better ratios do exist, especially for PNG, but they hurt first-load cost |

## Decision

v1 uses the browser-native `OffscreenCanvas.convertToBlob` encoder through the
`engine/adapters/browser.ts` adapter. This keeps the first load small, avoids
WASM binaries and licensing/versioning work, and runs entirely inside the Web
Worker. A WASM codec layer is the natural upgrade path when compression ratio
becomes the differentiator (for example, optimized PNG or AVIF).

The engine treats encoder output as a black box: it binary-searches quality,
keeps the best feasible probe even when sizes are not strictly monotonic, and
only falls back to resolution reduction when the lowest useful quality still
exceeds the target.
