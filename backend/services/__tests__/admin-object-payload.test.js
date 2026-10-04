'use strict';

const { test, expect } = require('bun:test');
const { applyLocationGeometryPolicy, normalizeObjectPayload } = require('../admin-object-payload');

const publishPayload = {
  slug: 'logistics-hub-2026',
  type: 'land',
  status: 'available',
  district: 'Yunusobod',
  cadastralNumber: '10:01:01:0001',
  latitude: 41.391335,
  longitude: 69.220651,
  landAreaHa: 5,
  investmentAmountUsd: 500000,
  sectors: ['logistics'],
  translations: {
    uz: {
      title: 'Logistika markazi',
      shortDescription: 'Qisqa tavsif',
      description: 'Batafsil tavsif',
      address: 'Yunusobod',
    },
    ru: {
      title: 'Логистический центр',
      shortDescription: 'Краткое описание',
      description: 'Подробное описание',
      address: 'Юнусабад',
    },
  },
};

const validLotBoundary = {
  type: 'Polygon',
  coordinates: [
    [
      [69.2067, 41.4031],
      [69.2073, 41.4031],
      [69.2073, 41.4037],
      [69.2067, 41.4037],
      [69.2067, 41.4031],
    ],
  ],
};

test('accepts an incomplete draft but requires publishing fields', () => {
  expect(
    normalizeObjectPayload({ status: 'draft', translations: { uz: { title: 'Qoralama' } } })
      .translations.uz.title,
  ).toBe('Qoralama');
  expect(() =>
    normalizeObjectPayload({ ...publishPayload, status: 'available', sectors: [] }),
  ).toThrow('sector');
});

test('requires a secure e-auksion link for auction objects', () => {
  const normalized = normalizeObjectPayload({
    ...publishPayload,
    status: 'auction',
    auctionUrl: 'https://e-auksion.uz/lot-view?lot_id=123',
  });
  expect(normalized.auctionUrl).toBe('https://e-auksion.uz/lot-view?lot_id=123');
  expect(() =>
    normalizeObjectPayload({ ...publishPayload, status: 'auction', auctionUrl: '' }),
  ).toThrow('Auction URL is required');
  expect(() =>
    normalizeObjectPayload({ status: 'draft', auctionUrl: 'https://example.com/lot/123' }),
  ).toThrow('https://e-auksion.uz');
  expect(() =>
    normalizeObjectPayload({ status: 'draft', auctionUrl: 'http://e-auksion.uz/lot/123' }),
  ).toThrow('https://e-auksion.uz');
});

test('preserves complete Russian admin fields and rejects a partial published translation', () => {
  const normalized = normalizeObjectPayload(publishPayload);

  expect(normalized.translations.ru).toEqual({
    title: 'Логистический центр',
    shortDescription: 'Краткое описание',
    description: 'Подробное описание',
    address: 'Юнусабад',
    permittedBusinesses: [],
  });
  expect(() =>
    normalizeObjectPayload({
      ...publishPayload,
      translations: {
        ...publishPayload.translations,
        ru: { title: 'Неполный перевод' },
      },
    }),
  ).toThrow('ru translation is incomplete');
});

test('normalizes safe media and rejects unsafe or duplicate virtual tours', () => {
  const normalized = normalizeObjectPayload({
    ...publishPayload,
    media: [
      { kind: 'image', url: 'https://cdn.example.com/hero.webp', title: 'Asosiy foto' },
      { kind: 'virtual_tour', url: 'https://cdn.example.com/tour.jpg' },
    ],
  });

  expect(normalized.media).toHaveLength(2);
  expect(() =>
    normalizeObjectPayload({
      ...publishPayload,
      media: [{ kind: 'image', url: 'http://unsafe.example/image.jpg' }],
    }),
  ).toThrow('HTTPS');
  expect(() =>
    normalizeObjectPayload({
      ...publishPayload,
      media: [
        { kind: 'virtual_tour', url: 'https://a.example/1.jpg' },
        { kind: 'virtual_tour', url: 'https://a.example/2.jpg' },
      ],
    }),
  ).toThrow('virtual tour');
});

test('validates point and polygon coordinates', () => {
  expect(() => normalizeObjectPayload({ ...publishPayload, latitude: 100 })).toThrow('Latitude');
  expect(() =>
    normalizeObjectPayload({
      ...publishPayload,
      siteGeometry: {
        type: 'Polygon',
        coordinates: [
          [
            [69, 41],
            [70, 41],
            [70, 42],
            [69, 42],
          ],
        ],
      },
    }),
  ).toThrow('closed');
});

test('requires truthful geometry provenance and keeps Polygon-only semantics explicit', () => {
  expect(() =>
    normalizeObjectPayload({
      ...publishPayload,
      longitude: 69.20701,
      latitude: 41.403398,
      siteGeometry: validLotBoundary,
    }),
  ).toThrow('Geometry source');
  expect(() =>
    normalizeObjectPayload({
      ...publishPayload,
      longitude: 69.20701,
      latitude: 41.403398,
      siteGeometry: validLotBoundary,
      geometrySource: 'guessed',
    }),
  ).toThrow('Geometry source');
  expect(
    normalizeObjectPayload({
      ...publishPayload,
      longitude: 69.20701,
      latitude: 41.403398,
      siteGeometry: validLotBoundary,
      geometrySource: 'admin_drawn',
    }),
  ).toMatchObject({ siteGeometry: validLotBoundary, geometrySource: 'admin_drawn' });
  expect(() =>
    normalizeObjectPayload({
      ...publishPayload,
      siteGeometry: { type: 'MultiPolygon', coordinates: [] },
      geometrySource: 'admin_drawn',
    }),
  ).toThrow('Polygon without holes');
});

test('requires a point inside a district-bounded lot polygon', () => {
  expect(() =>
    normalizeObjectPayload({
      status: 'draft',
      siteGeometry: validLotBoundary,
      geometrySource: 'admin_drawn',
    }),
  ).toThrow('location is required');
  expect(() =>
    normalizeObjectPayload({
      ...publishPayload,
      longitude: 69.231469,
      latitude: 41.407415,
      siteGeometry: validLotBoundary,
      geometrySource: 'admin_drawn',
    }),
  ).toThrow('inside its polygon');
});

test('clears provenance when the boundary is explicitly cleared', () => {
  expect(
    normalizeObjectPayload({
      status: 'draft',
      siteGeometry: null,
      geometrySource: 'surveyed',
    }),
  ).toMatchObject({ siteGeometry: null, geometrySource: null });
  expect(() => normalizeObjectPayload({ status: 'draft', geometrySource: 'admin_drawn' })).toThrow(
    'without site geometry',
  );
});

test('keeps coordinate clearing explicit and requires the pair together', () => {
  expect(normalizeObjectPayload({ status: 'draft', latitude: '', longitude: '' })).toMatchObject({
    latitude: null,
    longitude: null,
  });
  expect(() =>
    normalizeObjectPayload({ status: 'draft', latitude: '41.39', longitude: '' }),
  ).toThrow('together');
  expect(() =>
    normalizeObjectPayload({ status: 'draft', latitude: 'not-a-number', longitude: '69.2' }),
  ).toThrow('Latitude');
});

test('rejects a published point outside Toshkent district', () => {
  expect(() =>
    normalizeObjectPayload({ ...publishPayload, latitude: 41.3111, longitude: 69.2797 }),
  ).toThrow('outside Toshkent district');
  expect(normalizeObjectPayload(publishPayload)).toMatchObject({
    latitude: 41.391335,
    longitude: 69.220651,
  });
});

test('clears stale geometry when an existing point moves', () => {
  const geometry = {
    type: 'Polygon',
    coordinates: [
      [
        [69.21, 41.38],
        [69.22, 41.38],
        [69.22, 41.39],
        [69.21, 41.38],
      ],
    ],
  };
  const existing = { latitude: '41.38', longitude: '69.21', siteGeometry: geometry };
  const moved = applyLocationGeometryPolicy(
    existing,
    { latitude: 41.39, longitude: 69.22 },
    { latitude: 41.39, longitude: 69.22 },
  );
  expect(moved.siteGeometry).toBeNull();
  expect(
    applyLocationGeometryPolicy(
      existing,
      { latitude: 41.5, longitude: 69.3, siteGeometry: geometry },
      { latitude: 41.5, longitude: 69.3, siteGeometry: geometry },
    ).siteGeometry,
  ).toBeNull();
  expect(
    applyLocationGeometryPolicy(
      existing,
      { latitude: 41.384, longitude: 69.218, siteGeometry: geometry },
      { latitude: 41.384, longitude: 69.218, siteGeometry: geometry },
    ).siteGeometry,
  ).toEqual(geometry);
  expect(
    applyLocationGeometryPolicy(
      existing,
      { latitude: 41.38, longitude: 69.21 },
      { latitude: 41.38, longitude: 69.21 },
    ).siteGeometry,
  ).toBeUndefined();
});
