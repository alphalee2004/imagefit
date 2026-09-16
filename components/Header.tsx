import Link from 'next/link';
import BrandMark from './BrandMark';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Cleeke home"
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <BrandMark className="h-10 w-10 sm:h-11 sm:w-11" />
        </Link>
        <nav
          aria-label="Primary navigation"
          className="ml-auto flex min-w-0 items-center justify-end gap-1 text-base text-gray-600 sm:gap-3"
        >
          <Link
            href="/image-tools"
            className="inline-flex min-h-12 items-center justify-center rounded-lg px-2.5 text-center hover:bg-gray-50 hover:text-gray-900 sm:px-3"
          >
            <span className="leading-tight sm:hidden">
              Image
              <br />
              Tools
            </span>
            <span className="hidden leading-tight sm:inline">Image Tools</span>
          </Link>
          <Link
            href="/resize-image"
            className="hidden min-h-12 items-center rounded-lg px-3 hover:bg-gray-50 hover:text-gray-900 sm:inline-flex"
          >
            Resize
          </Link>
          <Link
            href="/image-converter"
            className="hidden min-h-12 items-center rounded-lg px-3 hover:bg-gray-50 hover:text-gray-900 lg:inline-flex"
          >
            Converter
          </Link>
        </nav>
      </div>
    </header>
  );
}
