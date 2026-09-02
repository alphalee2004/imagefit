import type { Metadata } from 'next';
import ToolPage from '@/components/ToolPage';
import { pageMetadata } from '@/lib/seo';
import { TOOL_PAGES } from '@/lib/toolPages';

export const metadata: Metadata = pageMetadata(TOOL_PAGES['compress-image']);

export default function CompressImagePage() {
  return <ToolPage routeKey="compress-image" />;
}
