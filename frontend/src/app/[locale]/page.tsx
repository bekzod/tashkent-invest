import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomeView from '@/views/home';
import { isLocale } from '@/shared/i18n/routing';
import {
  fetchPublicObjects,
  fetchPublicStatistics,
  homeMetadata,
  structuredData,
} from '@/shared/lib/seo';
import { homeStructuredData } from '@/shared/lib/structured-data';


type LocalizedHomePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalizedHomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return homeMetadata(locale);
}

export default async function LocalizedHomePage({ params }: LocalizedHomePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [initialStats, initialObjects] = await Promise.all([
    fetchPublicStatistics(locale).catch(() => null),
    fetchPublicObjects(4, locale).catch(() => []),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={structuredData(homeStructuredData(locale))}
      />
      <HomeView
        initialLocale={locale}
        initialObjects={initialObjects}
        initialStats={initialStats}
      />
    </>
  );
}
