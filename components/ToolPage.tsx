import ImageOptimizer from '@/components/ImageOptimizer';
import { FaqSection, HowItWorks, RelatedTools, WhyUse } from '@/components/SeoSections';
import JsonLd from '@/components/JsonLd';
import { faqPageSchema } from '@/lib/seo';
import { TOOL_PAGES, type RouteKey } from '@/lib/toolPages';

export default function ToolPage({ routeKey }: { routeKey: RouteKey }) {
  const data = TOOL_PAGES[routeKey];
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-normal text-gray-900">{data.h1}</h1>
        <p className="mt-2 max-w-2xl text-gray-600">{data.intro}</p>
      </header>

      <ImageOptimizer config={data.tool} />

      <HowItWorks steps={data.howItWorks} />
      <WhyUse points={data.whyUse} />
      <FaqSection items={data.faq} />
      <RelatedTools items={data.related} />
      <JsonLd data={faqPageSchema(data.faq)} />
    </main>
  );
}
