import type { Metadata } from 'next';
import ToolPage from '@/components/ToolPage';
import { pageMetadata } from '@/lib/seo';
import { TOOL_PAGES } from '@/lib/toolPages';

export const metadata: Metadata = pageMetadata(TOOL_PAGES['compress-image-to-100kb']);

export default function CompressTo100kbPage() {
  return <ToolPage routeKey="compress-image-to-100kb" />;
}
