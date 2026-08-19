import { describe, expect, test } from 'vitest';
import { buildMapQuery, objectSelectionGeometry, statusColor } from './map-utils';

describe('map query', () => {
  test('serializes viewport, filters and polygon', () => {
    const query = buildMapQuery([69.1, 41.2, 69.4, 41.5], { q: 'Yunusobod', types: ['land'], statuses: [], sectors: ['logistics'], polygon: { type: 'Polygon', coordinates: [[[69.1, 41.2], [69.2, 41.2], [69.1, 41.2]]] } });
    expect(query).toContain('bbox=69.1%2C41.2%2C69.4%2C41.5');
    expect(query).toContain('types=land');
    expect(query).toContain('sectors=logistics');
  });
  test('uses an area slug instead of serializing a recognised boundary', () => {
    const query = buildMapQuery([69.1, 41.2, 69.4, 41.5], {
      q: 'Toshkent tumani',
      types: [],
      statuses: [],
      sectors: [],
      areaSlug: 'tashkent-district',
      areaMatchesQuery: true,
      polygon: { type: 'Polygon', coordinates: [[[69.1, 41.2], [69.2, 41.2], [69.1, 41.2]]] },
    });
    expect(query).toContain('areaSlug=tashkent-district');
    expect(query).not.toContain('polygon=');
    expect(query).not.toContain('q=');
  });
  test('maps status to marker colours', () => expect(statusColor({ status: 'auction' } as never)).toBe('#e94145'));
  test('uses an object site geometry for the selection outline', () => {
    const geometry = { type: 'Polygon' as const, coordinates: [[[69.2, 41.3], [69.21, 41.3], [69.21, 41.31], [69.2, 41.3]]] };
    expect(objectSelectionGeometry({ siteGeometry: geometry } as never)).toBe(geometry);
  });
  test('creates a fallback plot outline from object coordinates', () => {
    const geometry = objectSelectionGeometry({ coordinates: [69.2, 41.3], landAreaHa: 2 } as never);
    expect(geometry?.coordinates[0]).toHaveLength(5);
    expect(geometry?.coordinates[0][0]).toEqual(geometry?.coordinates[0][4]);
  });
});
