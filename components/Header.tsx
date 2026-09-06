import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import BrandMark from './BrandMark';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <BrandMark className="h-7 w-7" />
          <span className="text-lg font-bold">CLEEKE</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/compress-image" className="inline-flex min-h-11 items-center px-2 hover:text-gray-900">
            Compress
          </Link>
          <Link href="/resize-image" className="inline-flex min-h-11 items-center px-2 hover:text-gray-900">
            Resize
          </Link>
          <Link href="/image-converter" className="inline-flex min-h-11 items-center px-2 hover:text-gray-900">
            Converter
          </Link>
          <span className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
            <span className="hidden sm:inline">100% local</span>
            <span className="sm:hidden">Local</span>
          </span>
        </nav>
      </div>
    </header>
  );
}
