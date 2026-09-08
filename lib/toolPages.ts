import type { ToolUiConfig } from './toolConfig';

export const IMAGE_TOOLS_PATH = '/image-tools';
export const IMAGE_TOOLS_LABEL = 'Image Tools';

export interface SeoSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface ToolLinkItem {
  href: string;
  label: string;
  description: string;
}

export type RouteKey =
  | 'compress-image'
  | 'compress-image-to-100kb'
  | 'compress-image-to-200kb'
  | 'resize-image'
  | 'resize-image-to-100kb'
  | 'image-converter';

export interface SeoFaqItem {
  question: string;
  answer: string;
}

export interface ToolPageData {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  tool: ToolUiConfig;
  sections: SeoSection[];
  howItWorks: Array<{ title: string; text: string }>;
  whyUse: string[];
  faq: SeoFaqItem[];
  related: ToolLinkItem[];
}

export interface InfoPageData {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: SeoSection[];
  faq: SeoFaqItem[];
}

export const ALL_TOOLS: ToolLinkItem[] = [
  {
    href: '/compress-image',
    label: 'Compress Image',
    description: 'Compress JPG, PNG or WebP to a target file size.',
  },
  {
    href: '/compress-image-to-100kb',
    label: 'Compress to 100KB',
    description: 'Fit an image under a 100KB limit.',
  },
  {
    href: '/compress-image-to-200kb',
    label: 'Compress to 200KB',
    description: 'Fit an image under a 200KB limit.',
  },
  {
    href: '/resize-image',
    label: 'Resize Image',
    description: 'Resize by a maximum width or height.',
  },
  {
    href: '/resize-image-to-100kb',
    label: 'Resize to 100KB',
    description: 'Set max dimensions and fit under 100KB.',
  },
  {
    href: '/image-converter',
    label: 'Image Converter',
    description: 'Convert between JPG, PNG and WebP.',
  },
];

export function relatedFor(path: string, hrefs: string[]): ToolLinkItem[] {
  return ALL_TOOLS.filter(
    (tool) => tool.href !== path && hrefs.includes(tool.href),
  );
}

export const TOOL_PAGES: Record<RouteKey, ToolPageData> = {
  'compress-image': {
    path: '/compress-image',
    title: 'Compress Image Online - JPG, PNG & WebP',
    description:
      'Compress JPG, PNG and WebP images online. Pick a target file size and Cleeke keeps the best quality that fits, right in your browser.',
    h1: 'Compress Image',
    intro:
      'Reduce the file size of a JPG, PNG or WebP image to a target limit without uploading it anywhere.',
    tool: { defaultTargetBytes: 200 * 1024 },
    sections: [
      {
        heading: 'What image compression does',
        paragraphs: [
          'Image compression reduces the number of bytes needed to store a picture. Cleeke re-encodes your file in the browser and searches for the visual quality that still fits the size you choose.',
          'The compression method depends on the format. JPG and WebP files can become smaller by lowering encoding quality. PNG is kept lossless, so reaching a very small PNG target may require reducing the pixel dimensions instead.',
        ],
      },
      {
        heading: 'How target-size optimization works',
        paragraphs: [
          'Cleeke does not apply one fixed quality setting. It encodes several versions of your image and compares the result against your target.',
        ],
        bullets: [
          'The highest quality is tried at the original resolution first.',
          'If that file is still too large, Cleeke reduces the resolution and searches again.',
          'A downloaded file does not exceed the selected target size.',
          'If even the minimum resolution cannot fit, Cleeke reports the smallest achievable size instead of returning an unusable image.',
        ],
      },
      {
        heading: 'Compression vs resizing',
        paragraphs: [
          'Compression changes how an image is encoded. Resizing changes the pixel width and height. When a target is very demanding, Cleeke may resize as part of the optimization because quality alone cannot reach the limit.',
          'If your real requirement is a maximum width or height, start with the Resize Image tool. This page is for a file-size limit, not a pixel limit.',
        ],
      },
      {
        heading: 'Formats and current limits',
        paragraphs: [
          'This tool accepts JPG, PNG and WebP files up to 50 MB and keeps the original format unless you use the Image Converter.',
        ],
        bullets: [
          'JPG works well for photos.',
          'PNG keeps transparency and is useful for screenshots and graphics.',
          'WebP suits modern websites where browser support is available.',
          'HEIC, AVIF, GIF and other formats are not supported yet.',
        ],
      },
    ],
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Pick a target size', text: 'Choose 50 KB, 100 KB, 200 KB, 500 KB, 1 MB or enter your own.' },
      { title: 'Optimize', text: 'Cleeke searches for the best quality that fits the limit.' },
      { title: 'Download', text: 'Save the optimized image to your device.' },
    ],
    whyUse: [
      'Quality search happens before resolution is reduced',
      'The result stays under the selected target',
      'No account or server upload',
      'JPG, PNG and WebP input',
    ],
    faq: [
      {
        question: 'Do you upload my images?',
        answer:
          'No. Your image is processed locally in your browser and never leaves your device.',
      },
      {
        question: 'Which formats can I compress?',
        answer:
          'You can compress JPG, PNG and WebP files. The output keeps the original format.',
      },
      {
        question: 'Will PNG compression stay lossless?',
        answer:
          'PNG output is encoded losslessly. When a very small target cannot be reached at the original resolution, Cleeke reduces the dimensions instead of lowering PNG quality.',
      },
      {
        question: 'What happens if the target size is too small?',
        answer:
          'Cleeke reports that the limit cannot be reached and tells you the smallest size that still looks usable.',
      },
    ],
    related: relatedFor('/compress-image', [
      '/compress-image-to-100kb',
      '/compress-image-to-200kb',
      '/resize-image',
      '/image-converter',
    ]),
  },
  'compress-image-to-100kb': {
    path: '/compress-image-to-100kb',
    title: 'Compress Image to 100KB Online',
    description:
      'Compress JPG, PNG and WebP images to under 100KB directly in your browser. Free, private and no upload required.',
    h1: 'Compress Image to 100KB',
    intro:
      'Make a JPG, PNG or WebP image fit under 100KB while keeping as much visual quality as possible.',
    tool: { defaultTargetBytes: 100 * 1024 },
    sections: [
      {
        heading: 'Why 100KB matters',
        paragraphs: [
          'Many forms, admin panels, forums and messaging systems reject attachments that are too large. A 100KB limit is common enough that having one dedicated workflow is useful.',
        ],
        bullets: [
          'Profile photos and avatars',
          'Job application and signup forms',
          'Email attachments with strict limits',
          'CMS and blog uploads',
        ],
      },
      {
        heading: 'How Cleeke protects visual quality',
        paragraphs: [
          'This page starts with the 100KB target already selected. Cleeke first tries the highest quality at the original resolution and only lowers quality as much as needed.',
          'If a clean photo cannot reach 100KB at the original resolution, the engine reduces dimensions as a later step. This is why a 20 MB photo can still leave your device as a useful 100KB file.',
        ],
      },
      {
        heading: 'When 100KB is not realistic',
        paragraphs: [
          'Not every image can fit 100KB while remaining recognizable. Cleeke does not silently return a ruined file: it reports the smallest achievable size and suggests trying a larger target.',
          'A 200KB target gives the encoder much more room for detail, especially for photos with fine texture or busy backgrounds.',
        ],
      },
      {
        heading: 'Resize and compress in one step',
        paragraphs: [
          'If your upload also has a maximum width or height, use the Resize to 100KB tool instead. It combines a pixel limit with the 100KB file limit in one pass.',
        ],
      },
    ],
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Keep 100KB selected', text: 'The target is already set to a maximum of 100KB.' },
      { title: 'Optimize', text: 'Cleeke finds the best quality under the limit.' },
      { title: 'Download', text: 'Save the image when it fits.' },
    ],
    whyUse: [
      '100KB target selected automatically',
      'Quality is reduced before resolution when possible',
      'Clear message when 100KB is not feasible',
      'No upload, no account',
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
        question: 'Why should I use 200KB instead?',
        answer:
          '200KB gives the encoder more room for detail. Use it when the upload limit allows and 100KB looks too compressed.',
      },
      {
        question: 'Does my image leave my device?',
        answer: 'No. Everything runs locally in your browser.',
      },
    ],
    related: relatedFor('/compress-image-to-100kb', [
      '/compress-image',
      '/compress-image-to-200kb',
      '/resize-image-to-100kb',
      '/image-converter',
    ]),
  },
  'compress-image-to-200kb': {
    path: '/compress-image-to-200kb',
    title: 'Compress Image to 200KB Online',
    description:
      'Compress JPG, PNG and WebP images to under 200KB directly in your browser. Free, private and no upload required.',
    h1: 'Compress Image to 200KB',
    intro:
      'Reduce a JPG, PNG or WebP image to 200KB or less while keeping more detail than an aggressive 100KB target.',
    tool: { defaultTargetBytes: 200 * 1024 },
    sections: [
      {
        heading: 'How 200KB differs from 100KB',
        paragraphs: [
          'A 200KB limit is less punishing than 100KB. Cleeke can often keep the original resolution, use a higher quality level, or keep more pixels before the search needs to trade off detail.',
          'That makes 200KB a good middle ground for images that should stay sharp but still need to pass a file-size check.',
        ],
      },
      {
        heading: 'Common 200KB use cases',
        bullets: [
          'Email attachments that allow roughly 200KB per image',
          'CMS, forum and ticket-system uploads',
          'Website images where 100KB is too aggressive',
          'Scanned documents and report screenshots',
        ],
      },
      {
        heading: 'What Cleeke changes to fit 200KB',
        paragraphs: [
          'For JPG and WebP, Cleeke searches quality at the original resolution first. If quality alone cannot fit 200KB, it reduces the resolution and repeats the quality search at the smaller size.',
          'For PNG, pixels are encoded losslessly, so reaching 200KB may require fewer dimensions on very large images.',
        ],
      },
      {
        heading: 'Start with a pixel limit if you have one',
        paragraphs: [
          'When an uploader also specifies maximum dimensions, set those dimensions before compression. The Resize to 100KB page shows this combined flow; the same idea applies to larger targets on the general Resize Image page.',
        ],
      },
    ],
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Keep 200KB selected', text: 'The target is already set to a maximum of 200KB.' },
      { title: 'Optimize', text: 'Cleeke finds the best quality under the limit.' },
      { title: 'Download', text: 'Save the image when it fits.' },
    ],
    whyUse: [
      'Less aggressive than a 100KB target',
      'Higher quality and resolution are tried first',
      'Works locally without upload',
      'Output stays under 200KB',
    ],
    faq: [
      {
        question: 'Will the output stay under 200KB?',
        answer:
          'Yes. The optimizer never returns a file that exceeds the 200KB target.',
      },
      {
        question: 'Why is 200KB better than 100KB for some images?',
        answer:
          'A 200KB budget leaves room for higher encoding quality and larger dimensions, which preserves more detail in busy photos.',
      },
      {
        question: 'When should I still use the 100KB page?',
        answer:
          'Use 100KB when the destination requires it. If the form allows 200KB, the 200KB page usually gives a better looking result.',
      },
      {
        question: 'Is my image uploaded anywhere?',
        answer: 'No. Processing happens locally in your browser.',
      },
    ],
    related: relatedFor('/compress-image-to-200kb', [
      '/compress-image',
      '/compress-image-to-100kb',
      '/resize-image',
      '/image-converter',
    ]),
  },
  'resize-image': {
    path: '/resize-image',
    title: 'Resize Image Online - Set Max Width or Height',
    description:
      'Resize JPG, PNG and WebP images to a maximum width or height without upscaling. Aspect ratio is preserved and the file never leaves your browser.',
    h1: 'Resize Image',
    intro:
      'Set a maximum width or height and Cleeke resizes the image while preserving the original aspect ratio.',
    tool: {
      defaultTargetBytes: null,
      showResize: true,
      resizeRequired: true,
    },
    sections: [
      {
        heading: 'What this resize tool does',
        paragraphs: [
          'Cleeke resizing works with maximum dimensions, not free-form distortion. Enter one maximum value or both, and the other side is calculated automatically.',
          'The image is never upscaled, so a small source keeps its original dimensions when you enter a larger limit.',
        ],
        bullets: [
          'Aspect ratio is preserved',
          'Enter just a width, just a height, or both',
          'Resizing itself never crops the image',
          'The output keeps the original format',
        ],
      },
      {
        heading: 'Resize vs compress',
        paragraphs: [
          'Resizing changes pixel dimensions; compression reduces bytes. A smaller pixel size usually creates a smaller file, but it does not promise a specific file-size limit.',
          'If a website or form gives you a strict byte limit, use a target-size compressor such as Compress Image to 100KB or Compress Image to 200KB.',
        ],
      },
      {
        heading: 'What happens to the encoded file',
        paragraphs: [
          'This page starts with no file-size target. Cleeke re-encodes the resized image with a high default quality setting so the main change is the pixel size.',
          'If you select a target size from the panel as well, Cleeke treats your max dimensions as an outer limit and then optimizes the file to stay below the target.',
        ],
      },
      {
        heading: 'Current limits',
        bullets: [
          'Supported input: JPG, PNG and WebP up to 50 MB',
          'Dimensions are pixels, not print size or DPI',
          'Very small images are not enlarged',
          'HEIC, AVIF and other formats are not accepted',
        ],
      },
    ],
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Enter max dimensions', text: 'Set the largest width or height in pixels.' },
      { title: 'Optimize', text: 'Cleeke resizes without upscaling or distortion.' },
      { title: 'Download', text: 'Save the resized image to your device.' },
    ],
    whyUse: [
      'Preserves the aspect ratio',
      'Never upscales a smaller source',
      'Works with one or two max dimensions',
      'Private browser-based processing',
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
        question: 'Can I convert the format at the same time?',
        answer:
          'This page keeps the original format. Use the Image Converter when you also need JPG, PNG or WebP output.',
      },
      {
        question: 'Do you upload my image?',
        answer: 'No. Resizing happens locally in your browser.',
      },
    ],
    related: relatedFor('/resize-image', [
      '/resize-image-to-100kb',
      '/compress-image',
      '/image-converter',
    ]),
  },
  'resize-image-to-100kb': {
    path: '/resize-image-to-100kb',
    title: 'Resize Image to 100KB',
    description:
      'Resize and compress JPG, PNG and WebP images to under 100KB in one step. Set max dimensions and a 100KB target, all in your browser.',
    h1: 'Resize Image to 100KB',
    intro:
      'Combine a pixel limit with a 100KB file limit in one workflow, entirely inside your browser.',
    tool: {
      defaultTargetBytes: 100 * 1024,
      showResize: true,
      resizeRequired: true,
    },
    sections: [
      {
        heading: 'How this workflow differs from plain 100KB compression',
        paragraphs: [
          'The plain Compress Image to 100KB page only asks for a file size. This page lets you control the maximum dimensions first, which is useful when the destination also limits width or height.',
          'Both pages can reduce resolution when needed, but only this one guarantees that the starting pixel limit is respected.',
        ],
      },
      {
        heading: 'What happens during optimization',
        paragraphs: [
          'Cleeke applies your maximum width or height first. It then searches for the highest quality that keeps the output under 100KB.',
          'If quality alone cannot fit the file, the engine can go below your max dimensions, but it never upscales and never exceeds the 100KB target.',
        ],
      },
      {
        heading: 'When to use this page',
        bullets: [
          'The uploader states a max width or height',
          'The image should also stay under 100KB',
          'A photo keeps its aspect ratio without cropping',
        ],
      },
      {
        heading: 'When to use the compressor instead',
        paragraphs: [
          'If only the file size matters, start with Compress Image to 100KB. It tries the original resolution first and gives the engine the most freedom to preserve detail.',
        ],
      },
    ],
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Set max dimensions', text: 'Enter the largest width or height you can accept.' },
      { title: 'Optimize', text: 'Cleeke resizes and compresses to stay under 100KB.' },
      { title: 'Download', text: 'Save the final image to your device.' },
    ],
    whyUse: [
      'One pass for dimensions and file size',
      'Max dimensions are respected',
      'Aspect ratio preserved',
      'No upload required',
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
      {
        question: 'What if my image still cannot reach 100KB?',
        answer:
          'Cleeke reports the smallest achievable size instead of returning a file over the limit.',
      },
    ],
    related: relatedFor('/resize-image-to-100kb', [
      '/compress-image-to-100kb',
      '/resize-image',
      '/compress-image',
    ]),
  },
  'image-converter': {
    path: '/image-converter',
    title: 'Image Converter - JPG, PNG & WebP Online',
    description:
      'Convert JPG, PNG and WebP images to JPG, PNG or WebP online. Private browser-based conversion, no upload required.',
    h1: 'Image Converter',
    intro:
      'Convert between JPG, PNG and WebP without uploading the file or creating an account.',
    tool: {
      defaultTargetBytes: null,
      showFormat: true,
      defaultFormat: 'webp',
      showTargetSize: false,
      primaryActionLabel: 'Convert Image',
    },
    sections: [
      {
        heading: 'Conversions Cleeke supports today',
        paragraphs: [
          'The converter accepts JPG, PNG and WebP input and writes JPG, PNG or WebP output. Every format pair in that set is available from the output selector.',
        ],
        bullets: [
          'JPG to WebP for lighter website images',
          'PNG to WebP when transparency must survive',
          'WebP to JPG or PNG for older workflows',
          'PNG to JPG for photos that do not need transparency',
        ],
      },
      {
        heading: 'How conversion changes the file',
        paragraphs: [
          'Conversion re-encodes the image from its pixels, which means the output is a fresh file rather than a renamed container.',
          'Transparent PNG areas are filled with white when converting to JPG because JPG has no transparency channel.',
        ],
      },
      {
        heading: 'Formats that are not supported',
        paragraphs: [
          'HEIC, AVIF, GIF, BMP and TIFF files cannot be opened by this tool yet. Convert those files to JPG, PNG or WebP with software that supports them first.',
        ],
      },
      {
        heading: 'Convert then optimize',
        paragraphs: [
          'After conversion you may still need a file-size limit. Run the output through Compress Image or one of the target-size pages when the destination has a byte cap.',
        ],
      },
    ],
    howItWorks: [
      { title: 'Choose an image', text: 'Select a JPG, PNG or WebP from your device.' },
      { title: 'Pick output format', text: 'Choose JPG, PNG or WebP.' },
      { title: 'Convert', text: 'Cleeke converts the image locally.' },
      { title: 'Download', text: 'Save the converted file to your device.' },
    ],
    whyUse: [
      'JPG, PNG and WebP conversion without upload',
      'Fresh encoding instead of a renamed file',
      'No account or signup',
      'Runs on desktop and mobile browsers',
    ],
    faq: [
      {
        question: 'Can I convert JPG to WebP here?',
        answer:
          'Yes. Choose a JPG, select WebP as the output format and convert. PNG to WebP works the same way.',
      },
      {
        question: 'Does this tool support HEIC?',
        answer:
          'No. The current version converts JPG, PNG and WebP only. A HEIC file must be converted to one of those formats first.',
      },
      {
        question: 'What happens to transparency in JPG?',
        answer:
          'JPG does not support transparency, so transparent areas are filled with white when converting to JPG.',
      },
      {
        question: 'Is my image uploaded while converting?',
        answer: 'No. Conversion is processed locally in your browser.',
      },
    ],
    related: relatedFor('/image-converter', [
      '/compress-image',
      '/compress-image-to-100kb',
      '/resize-image',
    ]),
  },
};

export const HOME_PAGE: InfoPageData & {
  toolHeading: string;
  toolIntro: string;
} = {
  path: '/',
  title: 'Cleeke Image Tools - Compress, Resize & Convert',
  description:
    'Cleeke is a free browser-based image tools platform. Compress JPG, PNG and WebP to a target size, resize photos, and convert formats without uploading.',
  h1: 'Cleeke Image Tools',
  intro:
    'Compress images to an exact file size, resize photos, and convert between JPG, PNG and WebP - all in your browser.',
  toolHeading: 'Compress an image',
  toolIntro:
    'Start with the core tool: pick a file-size target and Cleeke finds the best quality that fits.',
  sections: [
    {
      heading: 'One toolset for everyday image tasks',
      paragraphs: [
        'Cleeke is an online image tools platform built around real file jobs: fitting an image under an upload limit, changing pixel dimensions, or moving between web-friendly formats.',
        'Each tool is a focused workflow. Pick the task you need, process one file without an account, and download the result to your device.',
      ],
    },
    {
      heading: 'Compression, resizing and conversion are separate jobs',
      paragraphs: [
        'Target-size compression matters when a form, CMS or email client rejects large files. Resizing is the starting point when an image must fit a maximum width or height. Conversion changes the container format so the file works in a different context.',
      ],
      bullets: [
        'Compress images to 50KB, 100KB, 200KB, 500KB, 1MB or a custom size.',
        'Resize without upscaling while keeping the aspect ratio.',
        'Convert between JPG, PNG and WebP in the browser.',
      ],
    },
    {
      heading: 'Private by design',
      paragraphs: [
        'Every image task runs locally in your browser. Files are not uploaded to a Cleeke server, no account is required, and there are no watermarks on the output.',
      ],
    },
  ],
  faq: [
    {
      question: 'Is Cleeke free?',
      answer: 'Yes. The current image tools are free and run entirely in your browser.',
    },
    {
      question: 'Which image tools are available now?',
      answer:
        'Cleeke currently offers image compression, target-size compression at 100KB and 200KB, resizing, resize-to-100KB, and JPG/PNG/WebP conversion.',
    },
    {
      question: 'Which formats are supported?',
      answer:
        'The current image tools support JPG, PNG and WebP input and output. HEIC, AVIF and other formats are not supported yet.',
    },
    {
      question: 'Are my images uploaded?',
      answer:
        'No. Images are processed in your browser and never leave your device.',
    },
  ],
};

export const IMAGE_TOOLS_HUB: InfoPageData = {
  path: IMAGE_TOOLS_PATH,
  title: 'Image Tools - Compress, Resize & Convert Online',
  description:
    'Browse Cleeke image tools: target-size image compression, resizing and JPG/PNG/WebP conversion, all in your browser without uploading.',
  h1: 'Image Tools',
  intro:
    'Compression, resizing and conversion tools for JPG, PNG and WebP images. Choose the workflow that matches the limit you need to satisfy.',
  sections: [
    {
      heading: 'Choose the tool that matches the task',
      paragraphs: [
        'Compression pages solve file-size limits. Resize pages solve pixel-dimension limits. The converter solves format requirements. Some uploads need more than one, which is why the related tools section on every page points to the next logical step.',
      ],
    },
    {
      heading: 'How Cleeke handles your files',
      paragraphs: [
        'Cleeke decodes and encodes images with browser APIs inside a Web Worker. The UI stays responsive and the file data is not transferred to a server.',
      ],
      bullets: [
        'Files are processed locally and never uploaded.',
        'JPG, PNG and WebP are supported up to 50 MB.',
        'Output is a fresh encoded file, not a renamed original.',
      ],
    },
    {
      heading: 'Current image tools',
      paragraphs: [
        'The tool directory below covers the current product line. Target-size pages for 500KB and 1MB and dedicated format-pair pages may be added as new real-world workflows, but the existing pages already cover every format supported by the engine.',
      ],
    },
  ],
  faq: [
    {
      question: 'What can Cleeke do with images right now?',
      answer:
        'Cleeke can compress JPG, PNG and WebP to a target size, resize them by max dimensions, and convert them between JPG, PNG and WebP.',
    },
    {
      question: 'Do I need to create an account?',
      answer:
        'No. Every image tool works without an account.',
    },
    {
      question: 'Are my images uploaded to a server?',
      answer:
        'No. All processing happens locally in your browser.',
    },
    {
      question: 'Why is there no HEIC converter?',
      answer:
        'HEIC is not one of the formats the current browser image engine supports. Pages are only added for tools that already work.',
    },
  ],
};
