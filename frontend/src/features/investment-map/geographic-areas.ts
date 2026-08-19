export type GeographicArea = {
  slug: string;
  parentSlug: string | null;
  kind: 'district' | 'locality';
  nameUz: string;
  nameRu: string;
  aliases: string[];
  geometry: GeoJSON.Polygon;
  centerLatitude: string | number;
  centerLongitude: string | number;
  source: string;
};

function normalise(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[ʻʼ‘’`]/g, "'")
    .replace(/[\s-]+/g, ' ')
    .trim();
}

export function findGeographicArea(areas: GeographicArea[], query: string) {
  const value = normalise(query);
  if (!value) return undefined;
  return areas.find((area) =>
    [area.nameUz, area.nameRu, ...area.aliases].some((candidate) => normalise(candidate) === value),
  );
}

export function getTashkentDistrict(areas: GeographicArea[]) {
  return areas.find((area) => area.slug === 'tashkent-district');
}
