export const MAX_DIMENSION = 8192;
export const MAX_INPUT_BYTES = 50 * 1024 * 1024;
export const MAX_DECODE_PIXELS = 32_000_000;
export const MIN_OUTPUT_SIDE = 16;
export const SCALE_FLOOR = 0.02;
export const QUALITY_MIN = 0.05;
export const QUALITY_MAX = 1;
export const PROBE_QUALITY = 0.85;
export const NO_TARGET_QUALITY = 0.92;
export const QUALITY_ITERATIONS = 9;
export const SCALE_ITERATIONS = 10;
export const QUALITY_REFINE_PROBES = 3;
export const REFINE_SCALE_STEP = 0.08;

export interface SearchRange {
  min: number;
  max: number;
  iterations: number;
}

/** Returns encoded size in bytes for a candidate quality/scale value. */
export type SizeProbe = (value: number) => Promise<number>;

export interface FeasibleValue {
  value: number;
  size: number;
}

export interface PlannedDimensions {
  width: number;
  height: number;
  scale: number;
}

/**
 * Binary search for the largest feasible value. `best` tracks every feasible
 * probe, so a non-monotonic encoder bump can never make the search report an
 * infeasible candidate or loop forever.
 */
export async function binarySearchMaxFeasible(
  probe: SizeProbe,
  range: SearchRange,
  targetBytes: number,
): Promise<FeasibleValue | null> {
  let lo = range.min;
  let hi = range.max;
  let best: FeasibleValue | null = null;

  for (let i = 0; i < range.iterations; i += 1) {
    const mid = (lo + hi) / 2;
    const size = await probe(mid);
    if (size <= targetBytes) {
      best = { value: mid, size };
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return best;
}

/**
 * Probes a spread of values above the binary-search result. This catches
 * encoder behavior where a local quality bump fails but higher qualities fit
 * again, without assuming strict monotonicity.
 */
export async function refineFeasibleValue(
  probe: SizeProbe,
  start: FeasibleValue,
  range: SearchRange,
  targetBytes: number,
  probes = QUALITY_REFINE_PROBES,
): Promise<FeasibleValue> {
  const span = range.max - start.value;
  let best = start;

  for (let i = 1; i <= probes; i += 1) {
    const candidate = Math.min(range.max, start.value + span * (i / (probes + 1)));
    if (candidate <= best.value) continue;
    const size = await probe(candidate);
    if (size <= targetBytes) {
      best = { value: candidate, size };
    }
  }

  return best;
}

export function computeBaseDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth?: number,
  maxHeight?: number,
  maxDimension = MAX_DIMENSION,
): PlannedDimensions {
  let scale = 1;
  const widthLimit = maxWidth && maxWidth > 0 ? maxWidth : sourceWidth;
  const heightLimit = maxHeight && maxHeight > 0 ? maxHeight : sourceHeight;

  scale = Math.min(scale, widthLimit / sourceWidth, heightLimit / sourceHeight);
  scale = Math.min(scale, maxDimension / sourceWidth, maxDimension / sourceHeight);
  scale = Math.max(scale, MIN_OUTPUT_SIDE / Math.max(sourceWidth, sourceHeight));

  return {
    width: Math.max(MIN_OUTPUT_SIDE, Math.round(sourceWidth * scale)),
    height: Math.max(MIN_OUTPUT_SIDE, Math.round(sourceHeight * scale)),
    scale,
  };
}

export function dimensionsForFitScale(
  base: PlannedDimensions,
  fitScale: number,
): { width: number; height: number } {
  return {
    width: Math.max(1, Math.round(base.width * fitScale)),
    height: Math.max(1, Math.round(base.height * fitScale)),
  };
}

export function computeDecodeDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxDimension: number,
  maxPixels: number,
): { width: number; height: number } {
  const safeWidth = Math.max(1, sourceWidth);
  const safeHeight = Math.max(1, sourceHeight);
  let scale = Math.min(1, maxDimension / safeWidth, maxDimension / safeHeight);
  const pixelLimit = Math.sqrt(maxPixels / (safeWidth * safeHeight));
  if (Number.isFinite(pixelLimit)) {
    scale = Math.min(scale, pixelLimit);
  }
  let width = Math.max(1, Math.round(safeWidth * scale));
  let height = Math.max(1, Math.round(safeHeight * scale));
  let guard = 0;
  while (width * height > maxPixels && guard < 4096 && (width > 1 || height > 1)) {
    if (width >= height) width -= 1;
    else height -= 1;
    guard += 1;
  }
  return { width, height };
}

export function scaleFloorFor(base: PlannedDimensions): number {
  return Math.max(
    SCALE_FLOOR,
    MIN_OUTPUT_SIDE / Math.max(base.width, base.height),
  );
}
