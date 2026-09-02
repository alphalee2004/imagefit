import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-700 text-sm font-bold text-white">
            IF
          </span>
          ImageFit
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/compress-image" className="hover:text-gray-900">
            Compress
          </Link>
          <Link href="/resize-image" className="hover:text-gray-900">
            Resize
          </Link>
          <Link href="/image-converter" className="hover:text-gray-900">
            Converter
          </Link>
          <span className="hidden items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
            100% local
          </span>
        </nav>
      </div>
    </header>
  );
}
