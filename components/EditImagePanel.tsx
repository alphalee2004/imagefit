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
    const point = pointerToNormalized(event);
    const handle = hitHandle(point, crop);
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Edit image</h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close editor"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setRotation((value) => (value + 90) % 360)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:border-gray-400"
          title="Rotate clockwise"
        >
          <RotateCw className="h-4 w-4" /> 90°
        </button>
        <button
          type="button"
          onClick={() => setRotation((value) => (value + 270) % 360)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:border-gray-400"
          title="Rotate counterclockwise"
        >
          <RotateCcw className="h-4 w-4" /> -90°
        </button>
        <button
          type="button"
          onClick={() => setFlipH((value) => !value)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium ${
            flipH ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
          title="Flip horizontally"
        >
          <FlipHorizontal2 className="h-4 w-4" /> H
        </button>
        <button
          type="button"
          onClick={() => setFlipV((value) => !value)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium ${
            flipV ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
          title="Flip vertically"
        >
          <FlipVertical2 className="h-4 w-4" /> V
        </button>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          Angle
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotation > 180 ? rotation - 360 : rotation}
            onChange={(event) => setRotation(((Number(event.target.value) % 360) + 360) % 360)}
            className="w-28"
          />
        </label>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:border-gray-400"
        >
          <Undo2 className="h-4 w-4" /> Reset
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {!previewUrl && !error && (
          <div className="flex h-52 items-center justify-center text-sm text-gray-500">
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
            className="block h-auto w-full touch-none cursor-crosshair"
          />
        )}
        {error && <p className="p-4 text-sm text-red-700">{error}</p>}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Drag inside the box to move it, drag a corner to resize, or drag outside to draw a new box.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:border-gray-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={!previewUrl || Boolean(error)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
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
  ctx.restore();
}

function hitHandle(point: { x: number; y: number }, crop: NormalizedRect): DragMode | null {
  const tolerance = 0.035;
  const near = (value: number, target: number) => Math.abs(value - target) <= tolerance;
  if (near(point.x, crop.x) && near(point.y, crop.y)) return 'nw';
  if (near(point.x, crop.x + crop.width) && near(point.y, crop.y)) return 'ne';
  if (near(point.x, crop.x) && near(point.y, crop.y + crop.height)) return 'sw';
  if (near(point.x, crop.x + crop.width) && near(point.y, crop.y + crop.height)) return 'se';
  return null;
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
