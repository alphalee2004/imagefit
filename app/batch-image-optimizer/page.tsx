import type { Metadata } from 'next';
import BatchImageOptimizer from '@/components/BatchImageOptimizer';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import {
  FaqSection,
  HowItWorks,
  RelatedTools,
  SeoContent,
  WhyUse,
} from '@/components/SeoSections';
import { breadcrumbSchema, faqPageSchema, pageMetadata } from '@/lib/seo';
import {
  BATCH_OPTIMIZER_LABEL,
  BATCH_OPTIMIZER_PATH,
  IMAGE_TOOLS_LABEL,
  IMAGE_TOOLS_PATH,
  relatedFor,
} from '@/lib/toolPages';

export const metadata: Metadata = pageMetadata({
  title: 'Batch Image Optimizer - Compress Multiple Images',
  description:
    'Compress multiple JPG, PNG and WebP images to one target size in your browser. No upload, no account, and download the finished batch as a ZIP.',
  path: BATCH_OPTIMIZER_PATH,
});

const HOW_IT_WORKS = [
  {
    title: 'Choose multiple images',
    text: 'Select up to 20 JPG, PNG or WebP files from your device.',
  },
  {
    title: 'Set one target size',
    text: 'Choose a preset or enter a custom maximum file size.',
  },
  {
    title: 'Process the queue',
    text: 'Cleeke processes images one at a time to keep memory use stable.',
  },
  {
    title: 'Download the results',
    text: 'Save images individually or download the completed batch as a ZIP.',
  },
];

const SECTIONS = [
  {
    heading: 'Why process images in a batch?',
    paragraphs: [
      'Batch processing is useful when many files share the same upload limit. Instead of opening each file and repeating the same settings, you choose the target once and let the queue handle the rest.',
      'Cleeke processes the queue sequentially. This avoids decoding several large images at the same time, which is especially important on mobile devices.',
    ],
  },
  {
    heading: 'What the batch tool optimizes',
    paragraphs: [
      'The first version of this tool focuses on target-size compression. Every queued image keeps its original format while the engine searches for the best quality that fits the selected maximum size.',
    ],
    bullets: [
      'JPG, PNG and WebP input',
      'One shared target size for the whole queue',
      'Individual retry when one image cannot be processed',
      'ZIP download after the successful images finish',
    ],
  },
  {
    heading: 'Files stay in the browser',
    paragraphs: [
      'Files are decoded and encoded by the browser image engine inside a Web Worker. They are not transferred to a Cleeke server, and the ZIP is assembled locally after processing finishes.',
    ],
  },
];

const WHY_USE = [
  'One target size applied to many images',
  'Sequential processing limits memory pressure',
  'Failed files do not stop the rest of the queue',
  'Download completed images together as a ZIP',
];

const FAQ = [
  {
    question: 'How many images can I process at once?',
    answer: 'A batch can contain up to 20 images. Each image can be up to 50 MB.',
  },
  {
    question: 'Does every image need the same target size?',
    answer:
      'Yes. The first batch workflow applies one target size to the entire queue. Individual settings can be added in a later version.',
  },
  {
    question: 'Are my images uploaded while batch processing?',
    answer:
      'No. Images are processed locally in your browser and the ZIP is created on your device.',
  },
  {
    question: 'What happens if one image fails?',
    answer:
      'The failed image is marked separately and the rest of the queue continues. You can retry that image without restarting completed work.',
  },
];

export default function BatchImageOptimizerPage() {
  const related = relatedFor(BATCH_OPTIMIZER_PATH, [
    '/compress-image',
    '/compress-image-to-100kb',
    '/resize-image',
    '/image-converter',
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-5 sm:px-6 sm:pt-7">
      <header className="mb-4">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: IMAGE_TOOLS_LABEL, href: IMAGE_TOOLS_PATH },
            { name: BATCH_OPTIMIZER_LABEL },
          ]}
        />
        <h1 className="text-3xl font-semibold leading-tight tracking-normal text-gray-900 sm:text-4xl">
          {BATCH_OPTIMIZER_LABEL}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-gray-600">
          Compress up to 20 images to one target size, then download the finished results
          individually or in a ZIP.
        </p>
      </header>

      <div data-tool-panel>
        <BatchImageOptimizer />
      </div>

      <HowItWorks steps={HOW_IT_WORKS} />
      <SeoContent sections={SECTIONS} />
      <WhyUse points={WHY_USE} />
      <FaqSection items={FAQ} />
      <RelatedTools items={related} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: IMAGE_TOOLS_LABEL, path: IMAGE_TOOLS_PATH },
          { name: BATCH_OPTIMIZER_LABEL, path: BATCH_OPTIMIZER_PATH },
        ])}
      />
      <JsonLd data={faqPageSchema(FAQ)} />
    </main>
  );
}
