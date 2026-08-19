import { MapPageClient } from '@/features/investment-map/map-page-client';

type MapSearchParams = { q?: string | string[]; types?: string | string[]; statuses?: string | string[]; sectors?: string | string[] };
const list = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value || '').split(',').filter(Boolean);

export default async function MapPage({ searchParams }: { searchParams: Promise<MapSearchParams> }) {
  const params = await searchParams;
  return <main className="full-map-page"><MapPageClient initialFilters={{ q: Array.isArray(params.q) ? params.q[0] || '' : params.q || '', types: list(params.types), statuses: list(params.statuses), sectors: list(params.sectors) }} /></main>;
}
