import Link from 'next/link';
import { LayoutGrid, RefreshCw, Scaling, ShieldCheck } from 'lucide-react';
import BrandMark from './BrandMark';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <Link
          href="/"
          aria-label="Cleeke home"
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <BrandMark className="h-10 w-10 sm:h-11 sm:w-11" />
        </Link>
        <nav
          aria-label="Primary navigation"
          className="flex min-w-0 items-center gap-0.5 text-base text-gray-600 sm:gap-1"
        >
          <Link
            href="/image-tools"
            aria-label="Image Tools"
            title="Image Tools"
            className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-lg hover:bg-gray-50 hover:text-gray-900 sm:w-auto sm:px-3"
          >
            <LayoutGrid className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Image Tools</span>
          </Link>
          <Link
            href="/resize-image"
            aria-label="Resize Image"
            title="Resize Image"
            className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-lg hover:bg-gray-50 hover:text-gray-900 sm:w-auto sm:px-3"
          >
            <Scaling className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Resize</span>
          </Link>
          <Link
            href="/image-converter"
            aria-label="Image Converter"
            title="Image Converter"
            className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-lg hover:bg-gray-50 hover:text-gray-900 sm:w-auto sm:px-3"
          >
            <RefreshCw className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Converter</span>
          </Link>
        </nav>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-xs text-gray-500 sm:px-2.5">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
          <span className="hidden sm:inline">100% local</span>
          <span className="sm:hidden">Local</span>
        </span>
      </div>
    </header>
  );
}
