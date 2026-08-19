import type { FeatureCollection, InvestmentObject } from '@/entities/investment-object/types';

export type MapFilters = {
  q: string;
  types: string[];
  statuses: string[];
  sectors: string[];
  polygon?: GeoJSON.Polygon;
  districtPolygon?: GeoJSON.Polygon;
  areaSlug?: string;
  areaKind?: 'district' | 'locality' | 'manual';
  areaMatchesQuery?: boolean;
};
export function buildMapQuery(bbox: [number, number, number, number], filters: MapFilters) {
  const params = new URLSearchParams({ bbox: bbox.join(',') });
  if (filters.areaSlug) params.set('areaSlug', filters.areaSlug);
  // A recognised geographic area is already represented by its polygon. Do not
  // additionally search the object title for "Toshkent tumani".
  if (filters.q.trim() && !filters.areaMatchesQuery) params.set('q', filters.q.trim());
  if (filters.types.length) params.set('types', filters.types.join(','));
  if (filters.statuses.length) params.set('statuses', filters.statuses.join(','));
  if (filters.sectors.length) params.set('sectors', filters.sectors.join(','));
  if (filters.polygon && !filters.areaSlug) params.set('polygon', JSON.stringify(filters.polygon));
  return params.toString();
}

export function objectSelectionGeometry(object: InvestmentObject): GeoJSON.Polygon | undefined {
  if (object.siteGeometry?.type === 'Polygon' && object.siteGeometry.coordinates[0]?.length >= 4)
    return object.siteGeometry;
  if (!object.coordinates) return undefined;

  const [longitude, latitude] = object.coordinates;
  const areaSqm = Math.max(Number(object.landAreaHa || 0.25) * 10000, 2500);
  const halfSideMeters = Math.sqrt(areaSqm) / 2;
  const longitudeScale = 111320 * Math.cos((latitude * Math.PI) / 180);
  const longitudeOffset = halfSideMeters / longitudeScale;
  const latitudeOffset = halfSideMeters / 111320;
  return {
    type: 'Polygon',
    coordinates: [[
      [longitude - longitudeOffset, latitude - latitudeOffset],
      [longitude + longitudeOffset, latitude - latitudeOffset],
      [longitude + longitudeOffset, latitude + latitudeOffset],
      [longitude - longitudeOffset, latitude + latitudeOffset],
      [longitude - longitudeOffset, latitude - latitudeOffset],
    ]],
  };
}
export function statusColor(object: InvestmentObject) { if (object.status === 'auction') return '#e94145'; if (object.status === 'upcoming') return '#9653ee'; if (object.type === 'land') return '#18a957'; if (object.type === 'building') return '#1976dc'; return '#e4a72d'; }
export const emptyFeatures: FeatureCollection = { type: 'FeatureCollection', features: [] };
