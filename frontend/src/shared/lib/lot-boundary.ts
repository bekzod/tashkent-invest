export type LotBoundaryValidationCode =
  | "polygonOnly"
  | "tooFew"
  | "open"
  | "coordinate"
  | "intersection"
  | "area"
  | "district"
  | "point";

export type LotBoundaryValidation = {
  code?: LotBoundaryValidationCode;
  geometry?: GeoJSON.Polygon;
  areaSqm: number;
};

export const MAX_LOT_VERTICES = 500;
export const MAX_LOT_AREA_SQM = 100_000_000;

function samePoint(left?: GeoJSON.Position, right?: GeoJSON.Position) {
  return left?.[0] === right?.[0] && left?.[1] === right?.[1];
}

function pointOnSegment(
  point: GeoJSON.Position,
  start: GeoJSON.Position,
  end: GeoJSON.Position,
) {
  const cross =
    (point[0] - start[0]) * (end[1] - start[1]) -
    (point[1] - start[1]) * (end[0] - start[0]);
  if (Math.abs(cross) > 1e-12) return false;
  return (
    point[0] >= Math.min(start[0], end[0]) - 1e-12 &&
    point[0] <= Math.max(start[0], end[0]) + 1e-12 &&
    point[1] >= Math.min(start[1], end[1]) - 1e-12 &&
    point[1] <= Math.max(start[1], end[1]) + 1e-12
  );
}

export function pointInRing(point: GeoJSON.Position, ring: GeoJSON.Position[]) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const start = ring[index];
    const end = ring[previous];
    if (pointOnSegment(point, start, end)) return true;
    if (
      start[1] > point[1] !== end[1] > point[1] &&
      point[0] <
        ((end[0] - start[0]) * (point[1] - start[1])) / (end[1] - start[1]) +
          start[0]
    )
      inside = !inside;
  }
  return inside;
}

function orientation(first: GeoJSON.Position, second: GeoJSON.Position, third: GeoJSON.Position) {
  const value =
    (second[1] - first[1]) * (third[0] - second[0]) -
    (second[0] - first[0]) * (third[1] - second[1]);
  return Math.abs(value) < 1e-12 ? 0 : value > 0 ? 1 : 2;
}

function segmentsIntersect(
  firstStart: GeoJSON.Position,
  firstEnd: GeoJSON.Position,
  secondStart: GeoJSON.Position,
  secondEnd: GeoJSON.Position,
) {
  const values = [
    orientation(firstStart, firstEnd, secondStart),
    orientation(firstStart, firstEnd, secondEnd),
    orientation(secondStart, secondEnd, firstStart),
    orientation(secondStart, secondEnd, firstEnd),
  ];
  if (values[0] !== values[1] && values[2] !== values[3]) return true;
  return (
    (values[0] === 0 && pointOnSegment(secondStart, firstStart, firstEnd)) ||
    (values[1] === 0 && pointOnSegment(secondEnd, firstStart, firstEnd)) ||
    (values[2] === 0 && pointOnSegment(firstStart, secondStart, secondEnd)) ||
    (values[3] === 0 && pointOnSegment(firstEnd, secondStart, secondEnd))
  );
}

function selfIntersects(ring: GeoJSON.Position[]) {
  const segments = ring.length - 1;
  for (let first = 0; first < segments; first += 1) {
    for (let second = first + 1; second < segments; second += 1) {
      if (second === first + 1 || (first === 0 && second === segments - 1)) continue;
      if (segmentsIntersect(ring[first], ring[first + 1], ring[second], ring[second + 1]))
        return true;
    }
  }
  return false;
}

export function lotBoundaryAreaSqm(ring: GeoJSON.Position[]) {
  if (ring.length < 4) return 0;
  const meanLatitude =
    ring.slice(0, -1).reduce((sum, point) => sum + point[1], 0) / (ring.length - 1);
  const longitudeScale = 111_320 * Math.cos((meanLatitude * Math.PI) / 180);
  const [originLongitude, originLatitude] = ring[0];
  let twiceArea = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const first = ring[index];
    const second = ring[index + 1];
    twiceArea +=
      (first[0] - originLongitude) * longitudeScale *
        (second[1] - originLatitude) * 111_320 -
      (second[0] - originLongitude) * longitudeScale *
        (first[1] - originLatitude) * 111_320;
  }
  return Math.abs(twiceArea) / 2;
}

export function validateLotBoundary(
  value: unknown,
  options: { point?: GeoJSON.Position; district?: GeoJSON.Polygon } = {},
): LotBoundaryValidation {
  const candidate = value as GeoJSON.Polygon | undefined;
  if (
    candidate?.type !== "Polygon" ||
    !Array.isArray(candidate.coordinates) ||
    candidate.coordinates.length !== 1
  )
    return { code: "polygonOnly", areaSqm: 0 };
  const ring = candidate.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4 || ring.length > MAX_LOT_VERTICES + 1)
    return { code: "tooFew", areaSqm: 0 };
  if (
    ring.some(
      (position) =>
        !Array.isArray(position) ||
        position.length !== 2 ||
        !position.every(Number.isFinite) ||
        position[0] < -180 ||
        position[0] > 180 ||
        position[1] < -90 ||
        position[1] > 90,
    )
  )
    return { code: "coordinate", areaSqm: 0 };
  if (!samePoint(ring[0], ring.at(-1))) return { code: "open", areaSqm: 0 };
  if (new Set(ring.slice(0, -1).map((position) => position.join(","))).size < 3)
    return { code: "tooFew", areaSqm: 0 };
  if (selfIntersects(ring)) return { code: "intersection", areaSqm: 0 };
  const areaSqm = lotBoundaryAreaSqm(ring);
  if (areaSqm < 1 || areaSqm > MAX_LOT_AREA_SQM) return { code: "area", areaSqm };
  if (
    options.district &&
    ring.slice(0, -1).some((position) => !pointInRing(position, options.district!.coordinates[0]))
  )
    return { code: "district", areaSqm };
  if (options.point && !pointInRing(options.point, ring)) return { code: "point", areaSqm };
  return { geometry: candidate, areaSqm };
}

export function lotBoundaryBounds(
  polygon?: GeoJSON.Polygon | null,
): [[number, number], [number, number]] | undefined {
  const validation = validateLotBoundary(polygon);
  if (!validation.geometry) return undefined;
  let minLongitude = Infinity;
  let minLatitude = Infinity;
  let maxLongitude = -Infinity;
  let maxLatitude = -Infinity;
  for (const [longitude, latitude] of validation.geometry.coordinates[0]) {
    minLongitude = Math.min(minLongitude, longitude);
    minLatitude = Math.min(minLatitude, latitude);
    maxLongitude = Math.max(maxLongitude, longitude);
    maxLatitude = Math.max(maxLatitude, latitude);
  }
  return [[minLongitude, minLatitude], [maxLongitude, maxLatitude]];
}
