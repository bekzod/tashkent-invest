'use strict';

require('dotenv').config();

const { setTimeout: wait } = require('node:timers/promises');
const db = require('./models');
const { geographicAreas } = require('./data/tashkent-district-geodata');
const { pointInPolygon } = require('../utils/geo');

const OSM_MAP_API = 'https://api.openstreetmap.org/api/0.6/map';
const SEARCH_RADIUS = 0.0065;
const REQUEST_DELAY_MS = 750;

function parseAttributes(source) {
  return Object.fromEntries(
    [...source.matchAll(/([:\w-]+)=(?:"([^"]*)"|'([^']*)')/g)].map((match) => [
      match[1],
      match[2] ?? match[3],
    ]),
  );
}

function isSamePoint([firstLng, firstLat], [lastLng, lastLat]) {
  return firstLng === lastLng && firstLat === lastLat;
}

function geometryCenter(ring) {
  const points = ring.slice(0, -1);
  return [
    points.reduce((sum, [longitude]) => sum + longitude, 0) / points.length,
    points.reduce((sum, [, latitude]) => sum + latitude, 0) / points.length,
  ];
}

function parseBuildingWays(xml) {
  const nodes = new Map();
  for (const match of xml.matchAll(/<node\b([^>]*?)(?:\/>|><\/node>)/g)) {
    const attributes = parseAttributes(match[1]);
    const longitude = Number(attributes.lon);
    const latitude = Number(attributes.lat);
    if (attributes.id && Number.isFinite(longitude) && Number.isFinite(latitude))
      nodes.set(attributes.id, [longitude, latitude]);
  }

  const buildings = [];
  for (const match of xml.matchAll(/<way\b([^>]*)>([\s\S]*?)<\/way>/g)) {
    const attributes = parseAttributes(match[1]);
    const body = match[2];
    const building = [...body.matchAll(/<tag\b([^>]*)\/>/g)]
      .map((tag) => parseAttributes(tag[1]))
      .find((tag) => tag.k === 'building')?.v;
    const references = [...body.matchAll(/<nd\b([^>]*)\/>/g)]
      .map((node) => parseAttributes(node[1]).ref)
      .filter(Boolean);
    const ring = references.map((reference) => nodes.get(reference)).filter(Boolean);

    // Four-corner building footprints are intentionally excluded: the product
    // needs visibly real, multi-vertex shapes rather than rectangle stand-ins.
    if (
      !attributes.id ||
      !building ||
      building === 'roof' ||
      references.length < 6 ||
      ring.length !== references.length ||
      !isSamePoint(ring[0], ring.at(-1))
    )
      continue;

    buildings.push({
      id: attributes.id,
      geometry: { type: 'Polygon', coordinates: [ring] },
      center: geometryCenter(ring),
    });
  }
  return buildings;
}

function distanceSquared([fromLng, fromLat], [toLng, toLat]) {
  const longitudeDistance = (fromLng - toLng) * Math.cos((fromLat * Math.PI) / 180);
  const latitudeDistance = fromLat - toLat;
  return longitudeDistance ** 2 + latitudeDistance ** 2;
}

async function requestBuildings(area) {
  const [longitude, latitude] = area.center;
  const bbox = [
    longitude - SEARCH_RADIUS,
    latitude - SEARCH_RADIUS,
    longitude + SEARCH_RADIUS,
    latitude + SEARCH_RADIUS,
  ].join(',');
  const response = await globalThis.fetch(`${OSM_MAP_API}?bbox=${bbox}`, {
    headers: { 'User-Agent': 'tashkent-invest/0.1 (local prototype)' },
  });
  if (!response.ok) throw new Error(`OSM building-footprint request failed: ${response.status}`);
  return parseBuildingWays(await response.text());
}

async function syncOsmFootprints() {
  await db.sequelize.authenticate();
  const district = await db.GeographicArea.findOne({ where: { slug: 'tashkent-district' } });
  const districtRing =
    district?.geometry?.type === 'Polygon' ? district.geometry.coordinates?.[0] : null;
  if (!districtRing) throw new Error('Toshkent tumani geometry is missing; run db:seed first');

  const localities = geographicAreas.filter((area) => area.kind === 'locality');
  const candidates = [];
  for (const [index, locality] of localities.entries()) {
    const buildings = await requestBuildings(locality);
    candidates.push(
      ...buildings.filter((building) => pointInPolygon(building.center, districtRing)),
    );
    if (index < localities.length - 1) await wait(REQUEST_DELAY_MS);
  }

  const uniqueCandidates = [
    ...new Map(candidates.map((candidate) => [candidate.id, candidate])).values(),
  ];
  // Only generated demo records may be moved. Admin-created records can carry
  // their own surveyed geometry and must never be overwritten by this sync.
  const objects = await db.InvestmentObject.findAll({
    where: { slug: { [db.Sequelize.Op.like]: 'tashkent-invest-%' } },
    order: [['createdAt', 'ASC']],
  });
  if (uniqueCandidates.length < objects.length)
    throw new Error(
      `Only ${uniqueCandidates.length} real OSM multi-vertex footprints found for ${objects.length} objects`,
    );

  const available = [...uniqueCandidates];
  for (const object of objects) {
    const currentPosition = [Number(object.longitude), Number(object.latitude)];
    available.sort(
      (left, right) =>
        distanceSquared(left.center, currentPosition) -
        distanceSquared(right.center, currentPosition),
    );
    const footprint = available.shift();
    await object.update({
      longitude: footprint.center[0],
      latitude: footprint.center[1],
      siteGeometry: footprint.geometry,
    });
  }

  console.log(
    `Synced ${objects.length} mock objects to real OSM multi-vertex building footprints (${uniqueCandidates.length} candidates).`,
  );
}

module.exports = { parseBuildingWays, syncOsmFootprints };

if (require.main === module)
  syncOsmFootprints()
    .then(() => db.sequelize.close())
    .catch(async (error) => {
      console.error(error);
      await db.sequelize.close();
      process.exitCode = 1;
    });
