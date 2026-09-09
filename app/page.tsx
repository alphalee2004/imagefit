import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import ImageOptimizer from '@/components/ImageOptimizer';
import ImageToolsDirectory from '@/components/ImageToolsDirectory';
import JsonLd from '@/components/JsonLd';
import { FaqSection, SeoContent } from '@/components/SeoSections';
import { faqPageSchema, pageMetadata, softwareApplicationSchema } from '@/lib/seo';
import { ALL_TOOLS, HOME_PAGE } from '@/lib/toolPages';

export const metadata: Metadata = pageMetadata({
  title: HOME_PAGE.title,
  description: HOME_PAGE.description,
  path: '/',
});

export default function Home() {
  return (
    <main className="pb-12">
      <Hero h1={HOME_PAGE.h1} intro={HOME_PAGE.intro} />
      <div className="mx-auto w-full max-w-5xl px-4 pt-8 sm:px-6">
        <section aria-labelledby="home-compressor-heading" data-tool-panel>
          <h2 id="home-compressor-heading" className="text-xl font-semibold text-gray-900">
            {HOME_PAGE.toolHeading}
          </h2>
          <p className="mt-2 max-w-2xl text-gray-600">{HOME_PAGE.toolIntro}</p>
          <div className="mt-4">
            <ImageOptimizer config={{ defaultTargetBytes: 200 * 1024 }} />
          </div>
        </section>
        <ImageToolsDirectory
          title="Explore image tools"
          intro="Choose a focused workflow for the limit you need to meet."
          items={ALL_TOOLS}
        />
        <SeoContent sections={HOME_PAGE.sections} />
        <FaqSection items={HOME_PAGE.faq} />
      </div>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={faqPageSchema(HOME_PAGE.faq)} />
    </main>
  );
}
