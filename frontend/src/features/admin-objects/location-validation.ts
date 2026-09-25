export const TASHKENT_DISTRICT_CENTER: [number, number] = [69.220651, 41.391335];

export type LocationValidationCode =
  | "bothRequired"
  | "latitudeRange"
  | "longitudeRange"
  | "outsideDistrict";

export type LocationValidation = {
  point?: [longitude: number, latitude: number];
  code?: LocationValidationCode;
};

export function parseOptionalCoordinate(
  value: string | number | null | undefined,
): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pointOnSegment(
  [longitude, latitude]: [number, number],
  [startLongitude, startLatitude]: GeoJSON.Position,
  [endLongitude, endLatitude]: GeoJSON.Position,
) {
  const cross =
    (latitude - startLatitude) * (endLongitude - startLongitude) -
    (longitude - startLongitude) * (endLatitude - startLatitude);
  if (Math.abs(cross) > 1e-10) return false;
  return (
    longitude >= Math.min(startLongitude, endLongitude) &&
    longitude <= Math.max(startLongitude, endLongitude) &&
    latitude >= Math.min(startLatitude, endLatitude) &&
    latitude <= Math.max(startLatitude, endLatitude)
  );
}

function pointInRing(point: [number, number], ring: GeoJSON.Position[]) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    if (pointOnSegment(point, ring[previous], ring[index])) return true;
    const [longitude, latitude] = point;
    const [currentLongitude, currentLatitude] = ring[index];
    const [previousLongitude, previousLatitude] = ring[previous];
    const intersects =
      currentLatitude > latitude !== previousLatitude > latitude &&
      longitude <
        ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
          (previousLatitude - currentLatitude) +
          currentLongitude;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function pointInDistrict(
  point: [longitude: number, latitude: number],
  district: GeoJSON.Polygon,
) {
  const [outer, ...holes] = district.coordinates;
  return Boolean(
    outer?.length &&
      pointInRing(point, outer) &&
      !holes.some((hole) => pointInRing(point, hole)),
  );
}

export function validateLocation(
  latitudeValue: string | number | null | undefined,
  longitudeValue: string | number | null | undefined,
  district?: GeoJSON.Polygon,
): LocationValidation {
  const latitudeBlank =
    latitudeValue === null ||
    latitudeValue === undefined ||
    (typeof latitudeValue === "string" && !latitudeValue.trim());
  const longitudeBlank =
    longitudeValue === null ||
    longitudeValue === undefined ||
    (typeof longitudeValue === "string" && !longitudeValue.trim());

  if (latitudeBlank && longitudeBlank) return { point: undefined };
  if (latitudeBlank || longitudeBlank) return { code: "bothRequired" };

  const latitude = parseOptionalCoordinate(latitudeValue);
  const longitude = parseOptionalCoordinate(longitudeValue);
  if (latitude === undefined || latitude < -90 || latitude > 90)
    return { code: "latitudeRange" };
  if (longitude === undefined || longitude < -180 || longitude > 180)
    return { code: "longitudeRange" };

  const point: [number, number] = [longitude, latitude];
  if (district && !pointInDistrict(point, district))
    return { point, code: "outsideDistrict" };
  return { point };
}
