import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPageClient } from '@/features/investment-map/map-page-client';
import { isLocale } from '@/shared/i18n/routing';
import { mapMetadata } from '@/shared/lib/seo';

type MapSearchParams = {
  q?: string | string[];
  types?: string | string[];
  statuses?: string | string[];
  sectors?: string | string[];
};

type LocalizedMapPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<MapSearchParams>;
};

const list = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value || '').split(',').filter(Boolean);

export async function generateMetadata({ params }: LocalizedMapPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return mapMetadata(locale);
}

export default async function LocalizedMapPage({ params, searchParams }: LocalizedMapPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  return (
    <main className="full-map-page">
      <MapPageClient
        initialFilters={{
          q: Array.isArray(query.q) ? query.q[0] || '' : query.q || '',
          types: list(query.types),
          statuses: list(query.statuses),
          sectors: list(query.sectors),
        }}
      />
    </main>
  );
}
