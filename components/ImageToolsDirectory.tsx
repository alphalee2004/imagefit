import Link from 'next/link';
import type { ToolLinkItem } from '@/lib/toolPages';

export default function ImageToolsDirectory({
  title,
  intro,
  items,
}: {
  title: string;
  intro?: string;
  items: ToolLinkItem[];
}) {
  const sectionId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return (
    <section className="mt-12" aria-labelledby={sectionId} data-seo-section>
      <h2 id={sectionId} className="text-xl font-semibold text-gray-900">
        {title}
      </h2>
      {intro && <p className="mt-3 max-w-3xl text-gray-600">{intro}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-gray-200 bg-white p-4 hover:border-teal-600"
          >
            <h3 className="font-medium text-gray-900">{item.label}</h3>
            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
