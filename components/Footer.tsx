import Link from 'next/link';
import packageJson from '@/package.json';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-5 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/image-tools">Image Tools</Link>
          <Link href="/compress-image">Compress</Link>
          <Link href="/resize-image">Resize</Link>
          <Link href="/image-converter">Converter</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <span className="self-end text-xs tabular-nums text-gray-400 sm:self-auto">
          ver-{packageJson.version}
        </span>
      </div>
    </footer>
  );
}
