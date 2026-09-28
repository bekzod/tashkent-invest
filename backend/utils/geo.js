'use strict';

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

const MAX_LOT_VERTICES = 500;
const MAX_LOT_AREA_SQM = 100_000_000;
const MIN_LOT_AREA_SQM = 1;

function samePoint(left, right) {
  return left?.[0] === right?.[0] && left?.[1] === right?.[1];
}

function pointOnSegment(
  [longitude, latitude],
  [startLongitude, startLatitude],
  [endLongitude, endLatitude],
) {
  const cross =
    (longitude - startLongitude) * (endLatitude - startLatitude) -
    (latitude - startLatitude) * (endLongitude - startLongitude);
  if (Math.abs(cross) > 1e-12) return false;
  return (
    longitude >= Math.min(startLongitude, endLongitude) - 1e-12 &&
    longitude <= Math.max(startLongitude, endLongitude) + 1e-12 &&
    latitude >= Math.min(startLatitude, endLatitude) - 1e-12 &&
    latitude <= Math.max(startLatitude, endLatitude) + 1e-12
  );
}

function orientation(first, second, third) {
  const value =
    (second[1] - first[1]) * (third[0] - second[0]) -
    (second[0] - first[0]) * (third[1] - second[1]);
  if (Math.abs(value) < 1e-12) return 0;
  return value > 0 ? 1 : 2;
}

function segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd) {
  const firstOrientation = orientation(firstStart, firstEnd, secondStart);
  const secondOrientation = orientation(firstStart, firstEnd, secondEnd);
  const thirdOrientation = orientation(secondStart, secondEnd, firstStart);
  const fourthOrientation = orientation(secondStart, secondEnd, firstEnd);
  if (firstOrientation !== secondOrientation && thirdOrientation !== fourthOrientation) return true;
  return (
    (firstOrientation === 0 && pointOnSegment(secondStart, firstStart, firstEnd)) ||
    (secondOrientation === 0 && pointOnSegment(secondEnd, firstStart, firstEnd)) ||
    (thirdOrientation === 0 && pointOnSegment(firstStart, secondStart, secondEnd)) ||
    (fourthOrientation === 0 && pointOnSegment(firstEnd, secondStart, secondEnd))
  );
}

function ringSelfIntersects(ring) {
  const segmentCount = ring.length - 1;
  for (let first = 0; first < segmentCount; first += 1) {
    for (let second = first + 1; second < segmentCount; second += 1) {
      const adjacent = second === first + 1 || (first === 0 && second === segmentCount - 1);
      if (adjacent) continue;
      if (segmentsIntersect(ring[first], ring[first + 1], ring[second], ring[second + 1]))
        return true;
    }
  }
  return false;
}

function polygonAreaSqm(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return 0;
  const meanLatitude =
    ring.slice(0, -1).reduce((total, [, latitude]) => total + latitude, 0) / (ring.length - 1);
  const longitudeScale = 111_320 * Math.cos((meanLatitude * Math.PI) / 180);
  const latitudeScale = 111_320;
  const [originLongitude, originLatitude] = ring[0];
  let twiceArea = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [firstLongitude, firstLatitude] = ring[index];
    const [secondLongitude, secondLatitude] = ring[index + 1];
    twiceArea +=
      (firstLongitude - originLongitude) *
        longitudeScale *
        (secondLatitude - originLatitude) *
        latitudeScale -
      (secondLongitude - originLongitude) *
        longitudeScale *
        (firstLatitude - originLatitude) *
        latitudeScale;
  }
  return Math.abs(twiceArea) / 2;
}

function lotValidation(message, code) {
  throw Object.assign(new Error(message), { statusCode: 400, code });
}

function normalizeLotPolygon(value, options = {}) {
  if (value === null) return { geometry: null, areaSqm: 0 };
  if (
    value?.type !== 'Polygon' ||
    !Array.isArray(value.coordinates) ||
    value.coordinates.length !== 1
  )
    lotValidation('Site geometry must be a Polygon without holes', 'LOT_BOUNDARY_POLYGON_ONLY');
  const ring = value.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4)
    lotValidation('Polygon needs at least three distinct vertices', 'LOT_BOUNDARY_TOO_FEW_POINTS');
  if (ring.length > (options.maxVertices || MAX_LOT_VERTICES) + 1)
    lotValidation('Polygon has too many vertices', 'LOT_BOUNDARY_TOO_MANY_POINTS');

  const normalized = ring.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(isFiniteNumber))
      lotValidation('Polygon coordinate is invalid', 'LOT_BOUNDARY_COORDINATE_INVALID');
    const longitude = Number(pair[0]);
    const latitude = Number(pair[1]);
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90)
      lotValidation('Polygon coordinate is out of range', 'LOT_BOUNDARY_COORDINATE_RANGE');
    return [longitude, latitude];
  });
  if (!samePoint(normalized[0], normalized.at(-1)))
    lotValidation('Polygon must be closed', 'LOT_BOUNDARY_OPEN');
  const distinct = new Set(normalized.slice(0, -1).map((point) => point.join(',')));
  if (distinct.size < 3)
    lotValidation('Polygon needs at least three distinct vertices', 'LOT_BOUNDARY_TOO_FEW_POINTS');
  if (ringSelfIntersects(normalized))
    lotValidation('Polygon must not self-intersect', 'LOT_BOUNDARY_SELF_INTERSECTION');
  const areaSqm = polygonAreaSqm(normalized);
  if (areaSqm < (options.minAreaSqm || MIN_LOT_AREA_SQM))
    lotValidation('Polygon area must be positive', 'LOT_BOUNDARY_ZERO_AREA');
  if (areaSqm > (options.maxAreaSqm || MAX_LOT_AREA_SQM))
    lotValidation('Polygon is larger than the supported lot size', 'LOT_BOUNDARY_TOO_LARGE');
  if (options.districtRing) {
    const outside = normalized
      .slice(0, -1)
      .some((point) => !pointInPolygon(point, options.districtRing));
    if (outside)
      lotValidation('Polygon is outside Toshkent district', 'LOT_BOUNDARY_OUTSIDE_DISTRICT');
  }
  if (options.point && !pointInPolygon(options.point, normalized))
    lotValidation('Object location must be inside its polygon', 'LOT_BOUNDARY_POINT_OUTSIDE');
  return { geometry: { type: 'Polygon', coordinates: [normalized] }, areaSqm };
}

function parseBbox(raw) {
  if (!raw) return null;
  const values = String(raw).split(',').map(Number);
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value)))
    throw Object.assign(new Error('Invalid bbox'), { statusCode: 400 });
  const [minLng, minLat, maxLng, maxLat] = values;
  if (minLng >= maxLng || minLat >= maxLat)
    throw Object.assign(new Error('Invalid bbox order'), { statusCode: 400 });
  return values;
}

function parsePolygon(raw) {
  if (!raw) return null;
  let geometry;
  try {
    geometry = JSON.parse(raw);
  } catch {
    throw Object.assign(new Error('Invalid polygon JSON'), { statusCode: 400 });
  }
  const coordinates =
    geometry?.type === 'Feature' ? geometry.geometry?.coordinates : geometry?.coordinates;
  const ring =
    geometry?.type === 'Feature'
      ? geometry.geometry?.type === 'Polygon' && coordinates?.[0]
      : geometry?.type === 'Polygon' && coordinates?.[0];
  if (
    !ring ||
    ring.length < 3 ||
    !ring.every(
      (point) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        isFiniteNumber(point[0]) &&
        isFiniteNumber(point[1]),
    )
  )
    throw Object.assign(new Error('Invalid polygon'), { statusCode: 400 });
  const closed = [...ring];
  if (closed[0][0] !== closed.at(-1)[0] || closed[0][1] !== closed.at(-1)[1])
    closed.push([...closed[0]]);
  return closed;
}

function pointInPolygon([lng, lat], ring) {
  if (!ring) return true;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (pointOnSegment([lng, lat], [xi, yi], [xj, yj])) return true;
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

module.exports = {
  MAX_LOT_AREA_SQM,
  MAX_LOT_VERTICES,
  normalizeLotPolygon,
  parseBbox,
  parsePolygon,
  pointInPolygon,
  polygonAreaSqm,
  ringSelfIntersects,
};
