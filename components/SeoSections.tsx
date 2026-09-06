import Link from 'next/link';

export interface SeoStep {
  title: string;
  text: string;
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface RelatedTool {
  href: string;
  label: string;
  description: string;
}

export function HowItWorks({ steps }: { steps: SeoStep[] }) {
  return (
    <section className="mt-12" aria-labelledby="how-it-works">
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
    <section className="mt-12" aria-labelledby="why-use-cleeke">
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

export function FaqSection({ items }: { items: SeoFaq[] }) {
  return (
    <section className="mt-12" aria-labelledby="faq">
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

export function RelatedTools({ items }: { items: RelatedTool[] }) {
  return (
    <section className="mt-12" aria-labelledby="related-tools">
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
