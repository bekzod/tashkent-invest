'use strict';

const { expect, test } = require('bun:test');
const { parseBuildingWays } = require('../sync-osm-footprints');

test('keeps only closed multi-vertex OSM building footprints', () => {
  const xml = `
    <osm>
      <node id="1" lon="69.1" lat="41.1"/><node id="2" lon="69.2" lat="41.1"/>
      <node id="3" lon="69.25" lat="41.16"/><node id="4" lon="69.18" lat="41.22"/>
      <node id="5" lon="69.08" lat="41.18"/>
      <way id="valid"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="5"/><nd ref="1"/><tag k="building" v="yes"/></way>
      <way id="rectangle"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="1"/><tag k="building" v="yes"/></way>
    </osm>`;

  const footprints = parseBuildingWays(xml);

  expect(footprints).toHaveLength(1);
  expect(footprints[0].id).toBe('valid');
  expect(footprints[0].geometry.coordinates[0]).toHaveLength(6);
});
