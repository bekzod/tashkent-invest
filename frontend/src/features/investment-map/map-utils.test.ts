import { describe, expect, test } from 'vitest';
import { buildMapQuery, objectBoundaryFeatures, objectSelectionGeometry, objectTooltipElement, safePolygonBounds, statusColor } from './map-utils';

describe('map query', () => {
  test('serializes viewport, filters and polygon', () => {
    const query = buildMapQuery([69.1, 41.2, 69.4, 41.5], { q: 'Yunusobod', types: ['land'], statuses: [], sectors: ['logistics'], areaMin: 5, areaMax: 25, polygon: { type: 'Polygon', coordinates: [[[69.1, 41.2], [69.2, 41.2], [69.1, 41.2]]] } }, 20);
    expect(query).toContain('bbox=69.1%2C41.2%2C69.4%2C41.5');
    expect(query).toContain('types=land');
    expect(query).toContain('sectors=logistics');
    expect(query).toContain('areaMin=5');
    expect(query).toContain('areaMax=25');
    expect(query).toContain('limit=20');
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
  test('does not invent a lot outline from coordinates or declared land area', () => {
    expect(objectSelectionGeometry({ coordinates: [69.2, 41.3], landAreaHa: 2 } as never)).toBeUndefined();
  });
  test('rejects malformed boundaries and computes safe bounds without spreading input', () => {
    const invalid = { type: 'Polygon' as const, coordinates: [[[69.2, 41.3], [69.21, 41.31], [69.2, 41.31], [69.21, 41.3], [69.2, 41.3]]] };
    expect(objectSelectionGeometry({ siteGeometry: invalid } as never)).toBeUndefined();
    expect(safePolygonBounds(invalid)).toBeUndefined();
  });
  test('creates public boundary features only when geometry and provenance are valid', () => {
    const geometry = { type: 'Polygon' as const, coordinates: [[[69.2, 41.3], [69.21, 41.3], [69.21, 41.31], [69.2, 41.3]]] };
    const features = objectBoundaryFeatures([
      { id: 'one', type: 'Feature', geometry: { type: 'Point', coordinates: [69.205, 41.302] }, properties: { id: 'one', siteGeometry: geometry, geometrySource: 'cadastral' } as never },
      { id: 'two', type: 'Feature', geometry: { type: 'Point', coordinates: [69.3, 41.4] }, properties: { id: 'two', landAreaHa: 4 } as never },
    ]);
    expect(features.features).toHaveLength(1);
    expect(features.features[0].properties).toMatchObject({ objectId: 'one', approximate: false });
  });
  test('builds tooltip content with text nodes instead of interpreting markup', () => {
    const tooltip = objectTooltipElement({ title: '<img src=x onerror=alert(1)>', address: '<script>bad()</script>' });
    expect(tooltip.querySelector('img')).toBeNull();
    expect(tooltip.querySelector('script')).toBeNull();
    expect(tooltip.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
