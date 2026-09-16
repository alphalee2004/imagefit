'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  FlipHorizontal2,
  FlipVertical2,
  Loader2,
  RotateCcw,
  RotateCw,
  Undo2,
  X,
} from 'lucide-react';
import { isIdentityTransform } from '@/engine/transform';
import type { ImageTransform, NormalizedRect } from '@/engine/types';

const FULL_CROP: NormalizedRect = { x: 0, y: 0, width: 1, height: 1 };
const PREVIEW_MAX_WIDTH = 760;
const PREVIEW_MAX_HEIGHT = 520;

type DragMode = 'move' | 'new' | 'nw' | 'ne' | 'sw' | 'se';

interface Props {
  initialTransform: ImageTransform | null;
  createPreview: () => Promise<string>;
  onApply: (transform: ImageTransform | null) => void;
  onCancel: () => void;
}

export default function EditImagePanel({
  initialTransform,
  createPreview,
  onApply,
  onCancel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; crop: NormalizedRect } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState((initialTransform?.rotationDegrees ?? 0) % 360);
  const [flipH, setFlipH] = useState(initialTransform?.flipHorizontal === true);
  const [flipV, setFlipV] = useState(initialTransform?.flipVertical === true);
  const [crop, setCrop] = useState<NormalizedRect>(
    initialTransform?.crop ?? FULL_CROP,
  );

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 639px)');
    const previousOverflow = document.body.style.overflow;

    function syncBodyScroll() {
      document.body.style.overflow = mobile.matches ? 'hidden' : previousOverflow;
    }

    syncBodyScroll();
    mobile.addEventListener('change', syncBodyScroll);
    return () => {
      mobile.removeEventListener('change', syncBodyScroll);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    createPreview()
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPreviewUrl(url);
        const image = new Image();
        image.onload = () => {
          if (!cancelled) setPreviewSize({ width: image.naturalWidth, height: image.naturalHeight });
        };
        image.onerror = () => {
          if (!cancelled) setError('Could not create the edit preview.');
        };
        image.src = url;
        imageRef.current = image;
      })
      .catch(() => {
        if (!cancelled) setError('Could not create the edit preview.');
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [createPreview]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !previewSize) return;

    const bounds = rotatedBounds(previewSize.width, previewSize.height, rotation);
    const fit = Math.min(
      PREVIEW_MAX_WIDTH / bounds.width,
      PREVIEW_MAX_HEIGHT / bounds.height,
      1,
    );
    canvas.width = Math.max(1, Math.round(bounds.width * fit));
    canvas.height = Math.max(1, Math.round(bounds.height * fit));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(fit, fit);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      -previewSize.width / 2,
      -previewSize.height / 2,
      previewSize.width,
      previewSize.height,
    );
    ctx.restore();
    drawCropOverlay(ctx, crop, canvas.width, canvas.height);
  }, [crop, flipH, flipV, previewSize, rotation]);

  function pointerToNormalized(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const point = pointerToNormalized(event);
    const handle = hitHandle(
      point,
      crop,
      event.currentTarget.clientWidth,
      event.currentTarget.clientHeight,
    );
    const inside = point.x >= crop.x && point.x <= crop.x + crop.width && point.y >= crop.y && point.y <= crop.y + crop.height;
    const mode: DragMode = handle ?? (inside ? 'move' : 'new');
    dragRef.current = { mode, startX: point.x, startY: point.y, crop: { ...crop } };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const point = pointerToNormalized(event);
    setCrop(applyDrag(drag, point));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleApply() {
    const next: ImageTransform = {
      rotationDegrees: rotation % 360,
      flipHorizontal: flipH,
      flipVertical: flipV,
      crop: isFullCrop(crop) ? undefined : crop,
    };
    onApply(isIdentityTransform(next) ? null : next);
  }

  function handleReset() {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCrop(FULL_CROP);
  }

  return (
    <div
      role="dialog"
      aria-labelledby="edit-image-title"
      className="fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-white px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:static sm:z-auto sm:h-auto sm:overflow-visible sm:rounded-xl sm:border sm:border-gray-200 sm:bg-white sm:p-5 sm:pb-5"
    >
      <div className="flex shrink-0 items-center justify-between">
        <h2 id="edit-image-title" className="text-lg font-semibold text-gray-900">
          Edit image
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close editor"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex min-h-44 flex-1 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 sm:mt-4 sm:min-h-52 sm:flex-none">
        {!previewUrl && !error && (
          <div className="flex h-44 items-center justify-center text-base text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing preview…
          </div>
        )}
        {previewUrl && (
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="block h-auto max-h-full w-auto max-w-full touch-none cursor-crosshair"
          />
        )}
        {error && <p className="p-4 text-base text-red-700">{error}</p>}
      </div>

      <div className="mt-3 shrink-0 space-y-2">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => setRotation((value) => (value + 90) % 360)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-base font-medium text-gray-700 hover:border-gray-400"
            title="Rotate clockwise"
          >
            <RotateCw className="h-5 w-5" /> 90°
          </button>
          <button
            type="button"
            onClick={() => setRotation((value) => (value + 270) % 360)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-base font-medium text-gray-700 hover:border-gray-400"
            title="Rotate counterclockwise"
          >
            <RotateCcw className="h-5 w-5" /> -90°
          </button>
          <button
            type="button"
            onClick={() => setFlipH((value) => !value)}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-3 text-base font-medium ${
              flipH ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
            title="Flip horizontally"
          >
            <FlipHorizontal2 className="h-5 w-5" /> Flip H
          </button>
          <button
            type="button"
            onClick={() => setFlipV((value) => !value)}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-3 text-base font-medium ${
              flipV ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
            title="Flip vertically"
          >
            <FlipVertical2 className="h-5 w-5" /> Flip V
          </button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:items-center">
          <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-600">
            <span className="shrink-0">Angle</span>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation > 180 ? rotation - 360 : rotation}
              onChange={(event) => setRotation(((Number(event.target.value) % 360) + 360) % 360)}
              className="min-w-0 flex-1 sm:w-28"
            />
          </label>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-base font-medium text-gray-700 hover:border-gray-400"
          >
            <Undo2 className="h-5 w-5" /> Reset
          </button>
        </div>
      </div>

      <p className="mt-2 shrink-0 text-sm leading-5 text-gray-500">
        Drag inside the box to move it, drag a corner to resize, or drag outside to draw a new box.
      </p>

      <div className="mt-3 grid shrink-0 grid-cols-2 gap-2 sm:flex sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-base font-medium text-gray-700 hover:border-gray-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={!previewUrl || Boolean(error)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-base font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Apply edit
        </button>
      </div>
    </div>
  );
}

function rotatedBounds(width: number, height: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  return {
    width: Math.max(1, Math.ceil(width * cos + height * sin)),
    height: Math.max(1, Math.ceil(width * sin + height * cos)),
  };
}

function drawCropOverlay(
  ctx: CanvasRenderingContext2D,
  crop: NormalizedRect,
  width: number,
  height: number,
) {
  const x = crop.x * width;
  const y = crop.y * height;
  const w = crop.width * width;
  const h = crop.height * height;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, width, y);
  ctx.fillRect(0, y + h, width, height - y - h);
  ctx.fillRect(0, y, x, h);
  ctx.fillRect(x + w, y, width - x - w, h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1;
  for (const fraction of [1 / 3, 2 / 3]) {
    ctx.beginPath();
    ctx.moveTo(x + w * fraction, y);
    ctx.lineTo(x + w * fraction, y + h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + h * fraction);
    ctx.lineTo(x + w, y + h * fraction);
    ctx.stroke();
  }

  const radius = Math.max(8, Math.min(11, Math.min(width, height) * 0.032));
  drawCropHandle(ctx, clamp(x, radius, width - radius), clamp(y, radius, height - radius), radius);
  drawCropHandle(
    ctx,
    clamp(x + w, radius, width - radius),
    clamp(y, radius, height - radius),
    radius,
  );
  drawCropHandle(
    ctx,
    clamp(x, radius, width - radius),
    clamp(y + h, radius, height - radius),
    radius,
  );
  drawCropHandle(
    ctx,
    clamp(x + w, radius, width - radius),
    clamp(y + h, radius, height - radius),
    radius,
  );
  ctx.restore();
}

function drawCropHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#0f766e';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function hitHandle(
  point: { x: number; y: number },
  crop: NormalizedRect,
  width: number,
  height: number,
): DragMode | null {
  const x = point.x * width;
  const y = point.y * height;
  const candidates: Array<{ mode: DragMode; x: number; y: number }> = [
    { mode: 'nw', x: crop.x * width, y: crop.y * height },
    { mode: 'ne', x: (crop.x + crop.width) * width, y: crop.y * height },
    { mode: 'sw', x: crop.x * width, y: (crop.y + crop.height) * height },
    {
      mode: 'se',
      x: (crop.x + crop.width) * width,
      y: (crop.y + crop.height) * height,
    },
  ];
  let closest: { mode: DragMode; x: number; y: number; distance: number } = {
    ...candidates[0],
    distance: Number.POSITIVE_INFINITY,
  };
  for (const candidate of candidates) {
    const distance = Math.hypot(candidate.x - x, candidate.y - y);
    if (distance < closest.distance) closest = { ...candidate, distance };
  }

  return closest.distance <= 28 ? closest.mode : null;
}

function applyDrag(
  drag: { mode: DragMode; startX: number; startY: number; crop: NormalizedRect },
  point: { x: number; y: number },
): NormalizedRect {
  const original = drag.crop;
  const minSize = 0.05;
  if (drag.mode === 'new') {
    const x = clamp(Math.min(drag.startX, point.x), 0, 1 - minSize);
    const y = clamp(Math.min(drag.startY, point.y), 0, 1 - minSize);
    const width = clamp(Math.abs(point.x - drag.startX), minSize, 1 - x);
    const height = clamp(Math.abs(point.y - drag.startY), minSize, 1 - y);
    return { x, y, width, height };
  }
  if (drag.mode === 'move') {
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    return {
      x: clamp(original.x + dx, 0, 1 - original.width),
      y: clamp(original.y + dy, 0, 1 - original.height),
      width: original.width,
      height: original.height,
    };
  }
  const right = original.x + original.width;
  const bottom = original.y + original.height;
  const left = drag.mode.includes('w') ? clamp(point.x, 0, right - minSize) : original.x;
  const top = drag.mode.includes('n') ? clamp(point.y, 0, bottom - minSize) : original.y;
  const newRight = drag.mode.includes('e') ? clamp(point.x, left + minSize, 1) : right;
  const newBottom = drag.mode.includes('s') ? clamp(point.y, top + minSize, 1) : bottom;
  return {
    x: left,
    y: top,
    width: clamp(newRight - left, minSize, 1 - left),
    height: clamp(newBottom - top, minSize, 1 - top),
  };
}

function isFullCrop(crop: NormalizedRect): boolean {
  return crop.x <= 0.001 && crop.y <= 0.001 && crop.width >= 0.999 && crop.height >= 0.999;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
