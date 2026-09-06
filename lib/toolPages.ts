import type { ToolUiConfig } from './toolConfig';

export type RouteKey =
  | 'compress-image'
  | 'compress-image-to-100kb'
  | 'compress-image-to-200kb'
  | 'resize-image'
  | 'resize-image-to-100kb'
  | 'image-converter';

export interface ToolPageData {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  tool: ToolUiConfig;
  howItWorks: Array<{ title: string; text: string }>;
  whyUse: string[];
  faq: Array<{ question: string; answer: string }>;
  related: Array<{ href: string; label: string; description: string }>;
}

const ALL_TOOLS = [
  {
    href: '/compress-image',
    label: 'Compress Image',
    description: 'Compress JPG, PNG or WebP to the file size you need.',
  },
  {
    href: '/compress-image-to-100kb',
    label: 'Compress to 100KB',
    description: 'Shrink an image to under 100KB in one step.',
  },
  {
    href: '/compress-image-to-200kb',
    label: 'Compress to 200KB',
    description: 'Fit an image under a 200KB limit.',
  },
  {
    href: '/resize-image',
    label: 'Resize Image',
    description: 'Resize by max width or height without losing sharpness.',
  },
  {
    href: '/resize-image-to-100kb',
    label: 'Resize to 100KB',
    description: 'Resize and compress to under 100KB at the same time.',
  },
  {
    href: '/image-converter',
    label: 'Image Converter',
    description: 'Convert between JPG, PNG and WebP.',
  },
];

function relatedFor(path: string) {
  return ALL_TOOLS.filter((tool) => tool.href !== path);
}

export const TOOL_PAGES: Record<RouteKey, ToolPageData> = {
  'compress-image': {
    path: '/compress-image',
    title: 'Compress Image Online - JPG, PNG & WebP',
    description:
      'Compress JPG, PNG and WebP images online. Pick a target file size and Cleeke keeps the best quality that fits, right in your browser.',
    h1: 'Compress Image',
    intro:
      'Compress JPG, PNG and WebP images to the file size you need directly in your browser.',
    tool: { defaultTargetBytes: 200 * 1024 },
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Pick a target size', text: 'Choose 50 KB, 100 KB, 200 KB, 500 KB, 1 MB or enter your own.' },
      { title: 'Optimize', text: 'Cleeke searches for the best quality that fits the limit.' },
      { title: 'Download', text: 'Save the optimized image to your device.' },
    ],
    whyUse: [
      'Browser-based processing',
      'No mandatory upload',
      'Target-size optimization',
      'JPG / PNG / WebP',
      'Free',
      'Works on mobile',
    ],
    faq: [
      {
        question: 'Do you upload my images?',
        answer:
          'No. Your image is processed locally in your browser and never leaves your device.',
      },
      {
        question: 'Which formats are supported?',
        answer: 'You can compress JPG, PNG and WebP images. The output keeps the original format.',
      },
      {
        question: 'What happens if the target size is too small?',
        answer:
          'Cleeke reports that the limit cannot be reached and tells you the smallest size that still looks usable.',
      },
      {
        question: 'Does compression reduce quality?',
        answer:
          'Cleeke automatically finds the highest quality that still fits your target size, so it only removes as much quality as needed.',
      },
    ],
    related: relatedFor('/compress-image'),
  },
  'compress-image-to-100kb': {
    path: '/compress-image-to-100kb',
    title: 'Compress Image to 100KB Online',
    description:
      'Compress JPG, PNG and WebP images to under 100KB directly in your browser. Free, private and no upload required.',
    h1: 'Compress Image to 100KB',
    intro:
      'Compress JPG, PNG and WebP images to under 100KB directly in your browser.',
    tool: { defaultTargetBytes: 100 * 1024 },
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Select 100KB', text: 'The 100KB target is selected automatically on this page.' },
      { title: 'Optimize', text: 'Cleeke finds the best quality under 100KB.' },
      { title: 'Download', text: 'Save your image when it fits the limit.' },
    ],
    whyUse: [
      'Built for the 100KB limit',
      'Browser-based processing',
      'No mandatory upload',
      'Best quality that fits',
      'JPG / PNG / WebP',
      'Free',
    ],
    faq: [
      {
        question: 'Can every image be compressed to 100KB?',
        answer:
          'Most images can. If a 100KB file would look unusable, Cleeke tells you instead of silently destroying quality.',
      },
      {
        question: 'Is this really 100KB or less?',
        answer:
          'The optimizer targets a maximum of 100KB. The download will not exceed the target.',
      },
      {
        question: 'Does my image leave my device?',
        answer: 'No. Everything runs locally in your browser.',
      },
    ],
    related: relatedFor('/compress-image-to-100kb'),
  },
  'compress-image-to-200kb': {
    path: '/compress-image-to-200kb',
    title: 'Compress Image to 200KB Online',
    description:
      'Compress JPG, PNG and WebP images to under 200KB directly in your browser. Free, private and no upload required.',
    h1: 'Compress Image to 200KB',
    intro:
      'Compress JPG, PNG and WebP images to under 200KB directly in your browser.',
    tool: { defaultTargetBytes: 200 * 1024 },
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Select 200KB', text: 'The 200KB target is selected automatically on this page.' },
      { title: 'Optimize', text: 'Cleeke finds the best quality under 200KB.' },
      { title: 'Download', text: 'Save your image when it fits the limit.' },
    ],
    whyUse: [
      'Built for the 200KB limit',
      'Browser-based processing',
      'No mandatory upload',
      'Best quality that fits',
      'JPG / PNG / WebP',
      'Free',
    ],
    faq: [
      {
        question: 'Why 200KB?',
        answer:
          '200KB is a common limit for email attachments, forms, forums and CMS uploads, and usually preserves much more detail than smaller targets.',
      },
      {
        question: 'Will the output stay under 200KB?',
        answer:
          'Yes. The optimizer never returns a file that exceeds the 200KB target.',
      },
      {
        question: 'Is my image uploaded anywhere?',
        answer: 'No. Processing happens locally in your browser.',
      },
    ],
    related: relatedFor('/compress-image-to-200kb'),
  },
  'resize-image': {
    path: '/resize-image',
    title: 'Resize Image Online - Change Width & Height',
    description:
      'Resize JPG, PNG and WebP images to a max width or height without losing sharpness. 100% private, processed in your browser.',
    h1: 'Resize Image',
    intro:
      'Resize JPG, PNG and WebP images to a max width or height directly in your browser.',
    tool: {
      defaultTargetBytes: null,
      showResize: true,
      resizeRequired: true,
    },
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Enter max dimensions', text: 'Set the maximum width or height in pixels.' },
      { title: 'Optimize', text: 'Cleeke resizes without upscaling.' },
      { title: 'Download', text: 'Save the resized image to your device.' },
    ],
    whyUse: [
      'Exact max width or height',
      'Aspect ratio preserved',
      'Never upscales',
      'Browser-based processing',
      'No mandatory upload',
      'Free',
    ],
    faq: [
      {
        question: 'Will my aspect ratio change?',
        answer:
          'No. Cleeke keeps the original aspect ratio and only reduces the image until it fits your max dimensions.',
      },
      {
        question: 'Can I enlarge a small image?',
        answer:
          'No. Cleeke never upscales, so a small image keeps its original size.',
      },
      {
        question: 'Do you upload my image?',
        answer: 'No. Resizing happens locally in your browser.',
      },
    ],
    related: relatedFor('/resize-image'),
  },
  'resize-image-to-100kb': {
    path: '/resize-image-to-100kb',
    title: 'Resize Image to 100KB',
    description:
      'Resize and compress JPG, PNG and WebP images to under 100KB in one step. Set max dimensions and a 100KB target, all in your browser.',
    h1: 'Resize Image to 100KB',
    intro:
      'Resize and compress an image to under 100KB at the same time, directly in your browser.',
    tool: {
      defaultTargetBytes: 100 * 1024,
      showResize: true,
      resizeRequired: true,
    },
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Set max dimensions', text: 'Enter the largest width or height you can accept.' },
      { title: 'Optimize', text: 'Cleeke resizes and compresses to stay under 100KB.' },
      { title: 'Download', text: 'Save the final image to your device.' },
    ],
    whyUse: [
      'Resize and compress in one step',
      'Built for the 100KB limit',
      'Aspect ratio preserved',
      'Browser-based processing',
      'No mandatory upload',
      'Free',
    ],
    faq: [
      {
        question: 'Can I use only one dimension?',
        answer:
          'Yes. Enter just a max width or just a max height and the other side is calculated automatically.',
      },
      {
        question: 'Does resizing make the image blurry?',
        answer:
          'Downscaling usually looks sharp. Cleeke uses high-quality smoothing when it reduces dimensions.',
      },
      {
        question: 'Is this really processed locally?',
        answer: 'Yes. No upload is needed.',
      },
    ],
    related: relatedFor('/resize-image-to-100kb'),
  },
  'image-converter': {
    path: '/image-converter',
    title: 'Image Converter - JPG, PNG & WebP Online',
    description:
      'Convert JPG, PNG and WebP images to JPG, PNG or WebP online. Private browser-based conversion, no upload required.',
    h1: 'Image Converter',
    intro:
      'Convert JPG, PNG and WebP images to JPG, PNG or WebP directly in your browser.',
    tool: {
      defaultTargetBytes: null,
      showFormat: true,
      defaultFormat: 'webp',
      showTargetSize: false,
    },
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Pick output format', text: 'Choose JPG, PNG or WebP.' },
      { title: 'Convert', text: 'Cleeke converts the image locally.' },
      { title: 'Download', text: 'Save the converted file to your device.' },
    ],
    whyUse: [
      'JPG / PNG / WebP conversion',
      'Browser-based processing',
      'No mandatory upload',
      'Batch-ready architecture',
      'Free',
      'Works on mobile',
    ],
    faq: [
      {
        question: 'Which formats can I convert?',
        answer:
          'You can convert between JPG, PNG and WebP. HEIC and AVIF are planned for a later version.',
      },
      {
        question: 'What happens to transparency in JPG?',
        answer:
          'JPG does not support transparency, so transparent areas are filled with white when converting to JPG.',
      },
      {
        question: 'Is WebP supported by my browser?',
        answer:
          'Modern browsers all display WebP. Cleeke converts the file locally, so the output works wherever WebP is supported.',
      },
    ],
    related: relatedFor('/image-converter'),
  },
};

export const HOME_PAGE = {
  path: '/',
  title: 'Cleeke - Compress Images to the Size You Need',
  description:
    'Compress, resize and convert JPG, PNG and WebP images to the size you need. Fast and private: files are processed in your browser and never uploaded.',
  howItWorks: [
    { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
    { title: 'Pick a target size', text: 'Choose 50 KB, 100 KB, 200 KB, 500 KB, 1 MB or enter your own.' },
    { title: 'Optimize', text: 'Cleeke searches for the best quality that fits the limit.' },
    { title: 'Download', text: 'Save the optimized image to your device.' },
  ],
  whyUse: [
    'Browser-based processing',
    'No mandatory upload',
    'Target-size optimization',
    'JPG / PNG / WebP',
    'Free',
    'Works on mobile',
  ],
  faq: [
    {
      question: 'Do you upload my images?',
      answer:
        'No. Your image is processed locally in your browser and never leaves your device.',
    },
    {
      question: 'Which formats are supported?',
      answer:
        'Cleeke supports JPG, PNG and WebP input and output in this version.',
    },
    {
      question: 'How does target-size compression work?',
      answer:
        'Cleeke first tries the highest quality at the original resolution. If that is still too large, it reduces resolution and searches again until the file fits.',
    },
    {
      question: 'Is Cleeke free?',
      answer: 'Yes. The core optimizer is free and runs entirely in your browser.',
    },
  ],
  related: ALL_TOOLS,
};
