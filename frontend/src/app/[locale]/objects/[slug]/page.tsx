import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/shared/i18n/routing';
import { fetchPublicObject, objectMetadata, structuredData } from '@/shared/lib/seo';
import { objectStructuredData } from '@/shared/lib/structured-data';
import { ObjectDetail } from '@/views/object-detail';

type ObjectPageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: ObjectPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return { robots: { index: false, follow: false } };

  const object = await fetchPublicObject(slug, locale).catch(() => null);
  if (!object) {
    return {
      title: locale === 'uz' ? 'Obyekt topilmadi' : 'Объект не найден',
      robots: { index: false, follow: false },
    };
  }
  return objectMetadata(object, locale);
}

export default async function LocalizedObjectPage({ params }: ObjectPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const object = await fetchPublicObject(slug, locale).catch(() => null);
  if (!object) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={structuredData(objectStructuredData(object, locale))}
      />
      <ObjectDetail slug={slug} initialLocale={locale} initialObject={object} />
    </>
  );
}
