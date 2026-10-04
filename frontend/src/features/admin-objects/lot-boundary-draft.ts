export type Vertex = [longitude: number, latitude: number];

export function parseLocationPoint(
  latitude: string,
  longitude: string,
): Vertex | undefined {
  if (!latitude.trim() || !longitude.trim()) return undefined;

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  if (
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return undefined;
  }

  return [parsedLongitude, parsedLatitude];
}

export function editableVertices(
  geometry?: GeoJSON.Polygon | null,
): Vertex[] {
  const ring = geometry?.coordinates?.[0];
  if (!Array.isArray(ring) || ring.length < 2) return [];

  return ring.slice(0, -1).filter(
    (point): point is Vertex =>
      point.length === 2 && point.every((value) => Number.isFinite(value)),
  );
}

export function appendVertex(vertices: Vertex[], vertex: Vertex): Vertex[] {
  return [...vertices, vertex];
}

export function replaceVertex(
  vertices: Vertex[],
  index: number,
  vertex: Vertex,
): Vertex[] {
  if (index < 0 || index >= vertices.length) return vertices;
  return vertices.map((current, currentIndex) =>
    currentIndex === index ? vertex : current,
  );
}

export function removeLastVertex(vertices: Vertex[]): Vertex[] {
  return vertices.slice(0, -1);
}

export function draftPolygon(vertices: Vertex[]): GeoJSON.Polygon | undefined {
  if (vertices.length < 3) return undefined;
  return { type: "Polygon", coordinates: [[...vertices, vertices[0]]] };
}

export function buildBoundaryDraft(
  vertices: Vertex[],
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = vertices.map((coordinates, index) => ({
    type: "Feature",
    properties: { index: index + 1 },
    geometry: { type: "Point", coordinates },
  }));

  if (vertices.length >= 2) {
    features.push({
      type: "Feature",
      properties: {},
      geometry:
        vertices.length >= 3
          ? draftPolygon(vertices)!
          : { type: "LineString", coordinates: vertices },
    });
  }

  return { type: "FeatureCollection", features };
}
