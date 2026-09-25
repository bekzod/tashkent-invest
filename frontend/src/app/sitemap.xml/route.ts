import { buildSitemapIndex } from '@/shared/lib/sitemap';

export function GET() {
  return new Response(buildSitemapIndex(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
