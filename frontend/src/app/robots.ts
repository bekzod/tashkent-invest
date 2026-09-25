import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/shared/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const allow = ['/uz/', '/ru/'];
  const disallow = ['/dashboard', '/profile', '/uz/login', '/ru/login', '/api'];
  return {
    rules: [
      { userAgent: '*', allow, disallow },
      { userAgent: 'OAI-SearchBot', allow, disallow },
      { userAgent: 'GPTBot', allow, disallow },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
