import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomeView from '@/views/home';
import { isLocale } from '@/shared/i18n/routing';
import {
  absoluteUrl,
  fetchPublicObjects,
  fetchPublicStatistics,
  publicPageMetadata,
  site,
  structuredData,
} from '@/shared/lib/seo';

export const metadata: Metadata = publicPageMetadata({
  title: site.title,
  description:
    "Toshkent tumanidagi investitsiya obyektlari, yer uchastkalari, tayyor binolar va e-auksion imkoniyatlarini bitta interaktiv portalda ko'ring.",
  path: '/',
});

const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: absoluteUrl('/'),
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Toshkent tumani',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: absoluteUrl('/'),
    inLanguage: ['uz', 'ru'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/map')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
];

type LocalizedHomePageProps = { params: Promise<{ locale: string }> };

export default async function LocalizedHomePage({ params }: LocalizedHomePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [initialStats, initialObjects] = await Promise.all([
    fetchPublicStatistics().catch(() => null),
    fetchPublicObjects(4).catch(() => []),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={structuredData(homeJsonLd)}
      />
      <HomeView
        initialLocale={locale}
        initialObjects={initialObjects}
        initialStats={initialStats}
      />
    </>
  );
}
