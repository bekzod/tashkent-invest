import { fetchAllPublicObjects } from '@/shared/lib/seo';
import { buildLocaleSitemap } from '@/shared/lib/sitemap';

export async function GET() {
  const objects = await fetchAllPublicObjects('uz').catch(() => []);
  return new Response(buildLocaleSitemap('uz', objects), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
