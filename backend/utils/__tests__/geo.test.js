'use strict';

const { test, expect } = require('bun:test');
const { normalizeLotPolygon, parseBbox, pointInPolygon, polygonAreaSqm } = require('../geo');

test('parses a valid bbox and rejects an inverted one', () => {
  expect(parseBbox('69.1,41.2,69.4,41.5')).toEqual([69.1, 41.2, 69.4, 41.5]);
  expect(() => parseBbox('69.4,41.5,69.1,41.2')).toThrow('Invalid bbox order');
});

test('determines whether a point is inside a polygon', () => {
  const polygon = [
    [69, 41],
    [70, 41],
    [70, 42],
    [69, 42],
    [69, 41],
  ];
  expect(pointInPolygon([69.5, 41.5], polygon)).toBe(true);
  expect(pointInPolygon([69, 41.5], polygon)).toBe(true);
  expect(pointInPolygon([71, 41.5], polygon)).toBe(false);
});

const polygon = (ring) => ({ type: 'Polygon', coordinates: [ring] });

test('accepts a closed concave Polygon and reports its positive area', () => {
  const geometry = polygon([
    [69.216, 41.389],
    [69.224, 41.389],
    [69.221, 41.392],
    [69.224, 41.396],
    [69.216, 41.396],
    [69.216, 41.389],
  ]);
  const result = normalizeLotPolygon(geometry, { point: [69.219, 41.392] });
  expect(result.geometry).toEqual(geometry);
  expect(result.areaSqm).toBeGreaterThan(100_000);
  expect(polygonAreaSqm(geometry.coordinates[0])).toBe(result.areaSqm);
});

test('enforces Polygon-only, closed and three-distinct-vertex semantics', () => {
  expect(() => normalizeLotPolygon({ type: 'MultiPolygon', coordinates: [] })).toThrow(
    'Polygon without holes',
  );
  expect(() =>
    normalizeLotPolygon(
      polygon([
        [69.2, 41.3],
        [69.21, 41.3],
        [69.21, 41.31],
        [69.2, 41.31],
      ]),
    ),
  ).toThrow('closed');
  expect(() =>
    normalizeLotPolygon(
      polygon([
        [69.2, 41.3],
        [69.21, 41.3],
        [69.2, 41.3],
        [69.2, 41.3],
      ]),
    ),
  ).toThrow('distinct');
});

test('rejects zero-area, self-intersecting, invalid-range and oversized lots', () => {
  expect(() =>
    normalizeLotPolygon(
      polygon([
        [69.2, 41.3],
        [69.21, 41.3],
        [69.22, 41.3],
        [69.2, 41.3],
      ]),
    ),
  ).toThrow('area');
  expect(() =>
    normalizeLotPolygon(
      polygon([
        [69.2, 41.3],
        [69.21, 41.31],
        [69.2, 41.31],
        [69.21, 41.3],
        [69.2, 41.3],
      ]),
    ),
  ).toThrow('self-intersect');
  expect(() =>
    normalizeLotPolygon(
      polygon([
        [181, 41.3],
        [69.21, 41.3],
        [69.2, 41.31],
        [181, 41.3],
      ]),
    ),
  ).toThrow('range');
  expect(() =>
    normalizeLotPolygon(
      polygon([
        [68, 40],
        [71, 40],
        [71, 43],
        [68, 43],
        [68, 40],
      ]),
    ),
  ).toThrow('larger');
});

test('rejects a lot outside its district and a location outside its lot', () => {
  const district = [
    [69, 41],
    [70, 41],
    [70, 42],
    [69, 42],
    [69, 41],
  ];
  expect(() =>
    normalizeLotPolygon(
      polygon([
        [70.1, 41.2],
        [70.2, 41.2],
        [70.2, 41.3],
        [70.1, 41.2],
      ]),
      { districtRing: district },
    ),
  ).toThrow('outside Toshkent district');
  expect(() =>
    normalizeLotPolygon(
      polygon([
        [69.2, 41.2],
        [69.3, 41.2],
        [69.3, 41.3],
        [69.2, 41.2],
      ]),
      { point: [69.5, 41.5] },
    ),
  ).toThrow('inside its polygon');
});
