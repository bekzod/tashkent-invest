import { absoluteUrl } from '@/shared/lib/seo';

const content = `# Invest Tuman

Invest Tuman is the public investment-object portal for Toshkent district, Uzbekistan.
Invest Tuman — Ташкентский районнинг давлат инвестиция объектлари портали.

## Public pages

- Uzbek home: ${absoluteUrl('/uz')}
- Uzbek map: ${absoluteUrl('/uz/map')}
- Russian home: ${absoluteUrl('/ru')}
- Russian map: ${absoluteUrl('/ru/map')}

## Discovery

- Sitemap index: ${absoluteUrl('/sitemap.xml')}
- Uzbek sitemap: ${absoluteUrl('/sitemap-uz.xml')}
- Russian sitemap: ${absoluteUrl('/sitemap-ru.xml')}

Object details and contact options are available only on their canonical public pages.
`;

export function GET() {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
