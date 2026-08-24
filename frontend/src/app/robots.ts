import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/shared/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/map', '/objects/'],
        disallow: ['/dashboard/', '/login', '/profile'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
