import { describe, expect, test } from 'vitest';
import { findGeographicArea, getTashkentDistrict, type GeographicArea } from './geographic-areas';

const areas: GeographicArea[] = [
  {
    slug: 'tashkent-district', parentSlug: null, kind: 'district', nameUz: 'Toshkent tumani', nameRu: 'Ташкентский район', aliases: ['Tashkent District'], geometry: { type: 'Polygon', coordinates: [] }, centerLatitude: 41.39, centerLongitude: 69.22, source: 'test',
  },
  {
    slug: 'keles', parentSlug: 'tashkent-district', kind: 'locality', nameUz: 'Keles', nameRu: 'Келес', aliases: [], geometry: { type: 'Polygon', coordinates: [] }, centerLatitude: 41.4, centerLongitude: 69.2, source: 'test',
  },
];

describe('geographic areas', () => {
  test('finds district and locality aliases in Uzbek and Russian', () => {
    expect(getTashkentDistrict(areas)?.slug).toBe('tashkent-district');
    expect(findGeographicArea(areas, 'Ташкентский район')?.slug).toBe('tashkent-district');
    expect(findGeographicArea(areas, 'Келес')?.slug).toBe('keles');
  });

  test('does not treat an object phrase as an area', () => {
    expect(findGeographicArea(areas, 'logistika markazi')).toBeUndefined();
  });
});
