'use strict';

const { test, expect } = require('bun:test');
const { buildWhere, filterObjects, parseFilters } = require('../investment-object-query');

test('parses object filters and builds the database where clause', () => {
  const filters = parseFilters({
    bbox: '69.1,41.2,69.4,41.5',
    types: 'land',
    statuses: 'auction',
    sectors: 'logistics',
    areaMin: '1',
    areaMax: '9',
  });
  const where = buildWhere(filters);
  expect(where.type[Object.getOwnPropertySymbols(where.type)[0]]).toEqual(['land']);
  expect(where.status[Object.getOwnPropertySymbols(where.status)[0]]).toEqual(['auction']);
  expect(filters.bbox).toEqual([69.1, 41.2, 69.4, 41.5]);
});

test('applies polygon and text filtering after database filtering', () => {
  const filters = parseFilters({
    q: 'Yunusobod',
    polygon: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [69, 41],
          [70, 41],
          [70, 42],
          [69, 42],
          [69, 41],
        ],
      ],
    }),
  });
  const objects = [
    {
      longitude: 69.2,
      latitude: 41.3,
      district: 'Yunusobod',
      cadastralNumber: '1',
      translations: [{ locale: 'uz', title: 'Yer' }],
    },
    {
      longitude: 71,
      latitude: 41.3,
      district: 'Yunusobod',
      cadastralNumber: '2',
      translations: [{ locale: 'uz', title: 'Yer' }],
    },
  ];
  expect(filterObjects(objects, filters)).toHaveLength(1);
});

test('rejects unknown filter enums', () => {
  expect(() => parseFilters({ types: 'unknown' })).toThrow('Invalid types');
});

test('turns sector and hectare phrases into structured filters', () => {
  const filters = parseFilters({ q: 'Textile 5 gektar' });

  expect(filters.q).toBe('');
  expect(filters.sectors).toEqual(['manufacturing']);
  expect(filters.areaMin).toBe(4);
  expect(filters.areaMax).toBe(6);
});

test('keeps a location term after extracting a smart query filter', () => {
  const filters = parseFilters({ q: 'Oziq-ovqat Yunusobod' });

  expect(filters.q).toBe('Yunusobod');
  expect(filters.sectors).toEqual(['manufacturing']);
});
