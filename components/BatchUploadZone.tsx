'use client';

import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { MAX_BATCH_FILES, MAX_BATCH_FILE_BYTES } from '@/lib/batchQueue';
import { formatBytes } from '@/lib/utils';

export default function BatchUploadZone({
  onFiles,
  disabled = false,
}: {
  onFiles: (files: FileList) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Choose images for batch processing"
      aria-disabled={disabled}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) onFiles(event.dataTransfer.files);
      }}
      className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
          : dragging
            ? 'border-teal-600 bg-teal-50'
            : 'border-gray-300 bg-white hover:border-teal-600 hover:bg-teal-50/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          if (event.target.files) onFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <UploadCloud className={`h-9 w-9 ${disabled ? 'text-gray-300' : 'text-teal-700'}`} />
      <p className="mt-2 text-lg font-medium text-gray-900">Drop images here</p>
      <p className="text-base text-gray-500">or tap to choose multiple files</p>
      <p className="mt-2 text-sm text-gray-500">
        Up to {MAX_BATCH_FILES} files · {formatBytes(MAX_BATCH_FILE_BYTES)} each · JPG, PNG or WebP
      </p>
    </div>
  );
}
