'use strict';

const { test, expect } = require('bun:test');
const { parseBbox, pointInPolygon } = require('../geo');

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
  expect(pointInPolygon([71, 41.5], polygon)).toBe(false);
});
