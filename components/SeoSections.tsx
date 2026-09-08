import Link from 'next/link';
import type { SeoFaqItem, SeoSection, ToolLinkItem } from '@/lib/toolPages';

export interface SeoStep {
  title: string;
  text: string;
}

export function HowItWorks({ steps }: { steps: SeoStep[] }) {
  return (
    <section className="mt-12" aria-labelledby="how-it-works" data-seo-section>
      <h2 id="how-it-works" className="text-xl font-semibold text-gray-900">
        How it works
      </h2>
      <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-lg border border-gray-200 bg-white p-4">
            <span className="text-sm font-semibold text-teal-700">{index + 1}</span>
            <h3 className="mt-1 font-medium text-gray-900">{step.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function WhyUse({ points }: { points: string[] }) {
  return (
    <section className="mt-12" aria-labelledby="why-use-cleeke" data-seo-section>
      <h2 id="why-use-cleeke" className="text-xl font-semibold text-gray-900">
        Why use Cleeke?
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {points.map((point) => (
          <li key={point} className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FaqSection({ items }: { items: SeoFaqItem[] }) {
  return (
    <section className="mt-12" aria-labelledby="faq" data-seo-section>
      <h2 id="faq" className="text-xl font-semibold text-gray-900">
        FAQ
      </h2>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.question} className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-medium text-gray-900">{item.question}</h3>
            <p className="mt-1 text-sm text-gray-600">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RelatedTools({ items }: { items: ToolLinkItem[] }) {
  return (
    <section className="mt-12" aria-labelledby="related-tools" data-seo-section>
      <h2 id="related-tools" className="text-xl font-semibold text-gray-900">
        Related tools
      </h2>
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

export function SeoContent({ sections }: { sections: SeoSection[] }) {
  return (
    <>
      {sections.map((section, index) => (
        <section
          key={`${section.heading}-${index}`}
          className="mt-12"
          aria-labelledby={`seo-section-${index}`}
          data-seo-section
        >
          <h2 id={`seo-section-${index}`} className="text-xl font-semibold text-gray-900">
            {section.heading}
          </h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-3 max-w-3xl text-gray-600">
              {paragraph}
            </p>
          ))}
          {section.bullets && section.bullets.length > 0 && (
            <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-gray-600">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}
