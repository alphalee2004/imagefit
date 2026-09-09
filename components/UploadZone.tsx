'use client';

import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function UploadZone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Choose an image"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        pick(event.dataTransfer.files);
      }}
      className={`flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
        dragging
          ? 'border-teal-600 bg-teal-50'
          : 'border-gray-300 bg-white hover:border-teal-600 hover:bg-teal-50/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          pick(event.target.files);
          event.target.value = '';
        }}
      />
      <UploadCloud className="h-9 w-9 text-teal-700" />
      <p className="mt-3 text-lg font-medium text-gray-900">Drop your image here</p>
      <p className="text-base text-gray-500">or tap to choose</p>
      <p className="mt-3 text-xs text-gray-400">
        JPG, PNG or WebP · up to 50 MB · paste (Ctrl+V)
      </p>
    </div>
  );
}
