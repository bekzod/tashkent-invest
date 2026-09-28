import type { FeatureCollection, InvestmentObject } from '@/entities/investment-object/types';
import { lotBoundaryBounds, validateLotBoundary } from '@/shared/lib/lot-boundary';

export type MapFilters = {
  q: string;
  types: string[];
  statuses: string[];
  sectors: string[];
  areaMin?: number;
  areaMax?: number;
  polygon?: GeoJSON.Polygon;
  districtPolygon?: GeoJSON.Polygon;
  areaSlug?: string;
  areaKind?: 'district' | 'locality' | 'manual';
  areaMatchesQuery?: boolean;
};
export function buildMapQuery(
  bbox: [number, number, number, number],
  filters: MapFilters,
  limit?: number,
) {
  const params = new URLSearchParams({ bbox: bbox.join(',') });
  if (filters.areaSlug) params.set('areaSlug', filters.areaSlug);
  // A recognised geographic area is already represented by its polygon. Do not
  // additionally search the object title for "Toshkent tumani".
  if (filters.q.trim() && !filters.areaMatchesQuery) params.set('q', filters.q.trim());
  if (filters.types.length) params.set('types', filters.types.join(','));
  if (filters.statuses.length) params.set('statuses', filters.statuses.join(','));
  if (filters.sectors.length) params.set('sectors', filters.sectors.join(','));
  if (filters.areaMin !== undefined) params.set('areaMin', String(filters.areaMin));
  if (filters.areaMax !== undefined) params.set('areaMax', String(filters.areaMax));
  if (limit !== undefined) params.set('limit', String(limit));
  if (filters.polygon && !filters.areaSlug) params.set('polygon', JSON.stringify(filters.polygon));
  return params.toString();
}

export function objectSelectionGeometry(object: InvestmentObject): GeoJSON.Polygon | undefined {
  const validation = validateLotBoundary(object.siteGeometry, {
    point: object.coordinates,
  });
  return validation.geometry;
}

export function objectBoundaryFeatures(
  features: FeatureCollection['features'],
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: 'FeatureCollection',
    features: features.flatMap((feature) => {
      const object = feature.properties;
      const geometry = objectSelectionGeometry({
        ...object,
        coordinates: feature.geometry.coordinates,
      });
      if (!geometry || !object.geometrySource) return [];
      return [{
        type: 'Feature' as const,
        id: `boundary-${object.id}`,
        geometry,
        properties: {
          objectId: object.id,
          geometrySource: object.geometrySource,
          approximate: object.geometrySource === 'estimated' || object.geometrySource === 'demo',
        },
      }];
    }),
  };
}

export function safePolygonBounds(polygon?: GeoJSON.Polygon | null) {
  return lotBoundaryBounds(polygon);
}

export function objectTooltipElement(object: Pick<InvestmentObject, 'title' | 'address'>) {
  const container = document.createElement('div');
  const title = document.createElement('strong');
  const address = document.createElement('small');
  title.textContent = object.title || '';
  address.textContent = object.address || '';
  container.append(title, document.createElement('br'), address);
  return container;
}
export function statusColor(object: InvestmentObject) { if (object.status === 'auction') return '#e94145'; if (object.status === 'upcoming') return '#9653ee'; if (object.type === 'land') return '#18a957'; if (object.type === 'building') return '#1976dc'; return '#e4a72d'; }
export const emptyFeatures: FeatureCollection = { type: 'FeatureCollection', features: [] };
