const DEFAULT_TILE_URL = "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
const DEFAULT_SUBDOMAINS = ["a", "b", "c"];

function normalizeTileUrl(value?: string) {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_TILE_URL;
}

export function mapTileUrls(value = process.env.NEXT_PUBLIC_MAP_TILE_URL) {
  const tileUrl = normalizeTileUrl(value);
  if (!tileUrl.includes("{s}")) return [tileUrl];
  return DEFAULT_SUBDOMAINS.map((subdomain) =>
    tileUrl.replaceAll("{s}", subdomain),
  );
}

export const mapTileAttribution =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
  "© OpenStreetMap contributors";
