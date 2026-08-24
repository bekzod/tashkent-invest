import type { MetadataRoute } from 'next';
import { absoluteUrl, fetchPublicObjects } from '@/shared/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/map'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  const objects = await fetchPublicObjects(48).catch(() => []);
  return [
    ...staticRoutes,
    ...objects.map((object) => ({
      url: absoluteUrl(`/objects/${object.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: object.status === 'auction' ? 0.85 : 0.75,
    })),
  ];
}
