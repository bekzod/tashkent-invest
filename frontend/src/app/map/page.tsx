import type { Metadata } from 'next';
import { MapPageClient } from '@/features/investment-map/map-page-client';
import { publicPageMetadata } from '@/shared/lib/seo';

type MapSearchParams = { q?: string | string[]; types?: string | string[]; statuses?: string | string[]; sectors?: string | string[] };
const list = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value || '').split(',').filter(Boolean);

export const metadata: Metadata = publicPageMetadata({
  title: 'Investitsiya obyektlari xaritasi',
  description:
    "Toshkent tumanidagi yer uchastkalari, tayyor binolar, investitsiya takliflari va auksion obyektlarini xaritada qidiring va filtrlang.",
  path: '/map',
});

export default async function MapPage({ searchParams }: { searchParams: Promise<MapSearchParams> }) {
  const params = await searchParams;
  return <main className="full-map-page"><MapPageClient initialFilters={{ q: Array.isArray(params.q) ? params.q[0] || '' : params.q || '', types: list(params.types), statuses: list(params.statuses), sectors: list(params.sectors) }} /></main>;
}
