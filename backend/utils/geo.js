'use strict';

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
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
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

module.exports = { parseBbox, parsePolygon, pointInPolygon };
