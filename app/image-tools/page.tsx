import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import ImageToolsDirectory from '@/components/ImageToolsDirectory';
import JsonLd from '@/components/JsonLd';
import { FaqSection, SeoContent } from '@/components/SeoSections';
import { breadcrumbSchema, faqPageSchema, pageMetadata } from '@/lib/seo';
import { ALL_TOOLS, IMAGE_TOOLS_HUB } from '@/lib/toolPages';

export const metadata: Metadata = pageMetadata({
  title: IMAGE_TOOLS_HUB.title,
  description: IMAGE_TOOLS_HUB.description,
  path: IMAGE_TOOLS_HUB.path,
});

export default function ImageToolsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      <header className="mb-8">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: IMAGE_TOOLS_HUB.h1 },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-normal text-gray-900">
          {IMAGE_TOOLS_HUB.h1}
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">{IMAGE_TOOLS_HUB.intro}</p>
      </header>

      <ImageToolsDirectory
        title="Available tools"
        intro="Every tool below processes images locally in your browser."
        items={ALL_TOOLS}
      />
      <SeoContent sections={IMAGE_TOOLS_HUB.sections} />
      <FaqSection items={IMAGE_TOOLS_HUB.faq} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: IMAGE_TOOLS_HUB.h1, path: IMAGE_TOOLS_HUB.path },
        ])}
      />
      <JsonLd data={faqPageSchema(IMAGE_TOOLS_HUB.faq)} />
    </main>
  );
}
