import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import ImageOptimizer from '@/components/ImageOptimizer';
import JsonLd from '@/components/JsonLd';
import { FaqSection, HowItWorks, RelatedTools, WhyUse } from '@/components/SeoSections';
import { faqPageSchema, pageMetadata, softwareApplicationSchema } from '@/lib/seo';
import { HOME_PAGE } from '@/lib/toolPages';

export const metadata: Metadata = pageMetadata({
  title: HOME_PAGE.title,
  description: HOME_PAGE.description,
  path: '/',
});

export default function Home() {
  return (
    <main className="pb-16">
      <Hero />
      <div className="mx-auto w-full max-w-5xl px-4 pt-8 sm:px-6">
        <ImageOptimizer config={{ defaultTargetBytes: 200 * 1024 }} />
      </div>
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <HowItWorks steps={HOME_PAGE.howItWorks} />
        <WhyUse points={HOME_PAGE.whyUse} />
        <FaqSection items={HOME_PAGE.faq} />
        <RelatedTools items={HOME_PAGE.related} />
      </div>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={faqPageSchema(HOME_PAGE.faq)} />
    </main>
  );
}
