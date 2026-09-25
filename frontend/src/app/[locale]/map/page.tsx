import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPageClient } from '@/features/investment-map/map-page-client';
import { isLocale } from '@/shared/i18n/routing';
import { publicPageMetadata } from '@/shared/lib/seo';

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

export const metadata: Metadata = publicPageMetadata({
  title: 'Investitsiya obyektlari xaritasi',
  description:
    "Toshkent tumanidagi yer uchastkalari, tayyor binolar, investitsiya takliflari va auksion obyektlarini xaritada qidiring va filtrlang.",
  path: '/map',
});

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
