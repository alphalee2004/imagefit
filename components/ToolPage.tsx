import ImageOptimizer from '@/components/ImageOptimizer';
import Breadcrumbs from '@/components/Breadcrumbs';
import {
  FaqSection,
  HowItWorks,
  RelatedTools,
  SeoContent,
  WhyUse,
} from '@/components/SeoSections';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, faqPageSchema } from '@/lib/seo';
import {
  IMAGE_TOOLS_LABEL,
  IMAGE_TOOLS_PATH,
  TOOL_PAGES,
  type RouteKey,
} from '@/lib/toolPages';

export default function ToolPage({ routeKey }: { routeKey: RouteKey }) {
  const data = TOOL_PAGES[routeKey];
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-5 sm:px-6 sm:pt-7">
      <header className="mb-4">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: IMAGE_TOOLS_LABEL, href: IMAGE_TOOLS_PATH },
            { name: data.h1 },
          ]}
        />
        <h1 className="text-3xl font-semibold leading-tight tracking-normal text-gray-900 sm:text-4xl">
          {data.h1}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-gray-600">{data.intro}</p>
      </header>

      <div data-tool-panel>
        <ImageOptimizer config={data.tool} />
      </div>

      <HowItWorks steps={data.howItWorks} />
      <SeoContent sections={data.sections} />
      {data.whyUse.length > 0 && <WhyUse points={data.whyUse} />}
      <FaqSection items={data.faq} />
      <RelatedTools items={data.related} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: IMAGE_TOOLS_LABEL, path: IMAGE_TOOLS_PATH },
          { name: data.h1, path: data.path },
        ])}
      />
      <JsonLd data={faqPageSchema(data.faq)} />
    </main>
  );
}
