import type { MapFilters } from "@/features/investment-map/map-utils";
import type { Locale } from "@/shared/i18n/messages";
import { localizedPath } from "@/shared/i18n/routing";

export type HomeMapFilters = {
  q: string;
  selections: string[];
  sector: string;
  areaMin: number;
};

const objectTypes = new Set(["land", "building", "proposal"]);
const objectStatuses = new Set(["auction", "upcoming", "available"]);

export const emptyHomeMapFilters = (): HomeMapFilters => ({
  q: "",
  selections: [],
  sector: "",
  areaMin: 0,
});

export function toMapFilters(filters: HomeMapFilters): Partial<MapFilters> {
  return {
    q: filters.q.trim(),
    types: filters.selections.filter((value) => objectTypes.has(value)),
    statuses: filters.selections.filter((value) => objectStatuses.has(value)),
    sectors: filters.sector ? [filters.sector] : [],
    areaMin: filters.areaMin > 0 ? filters.areaMin : undefined,
  };
}

export function homeMapHref(locale: Locale, filters: HomeMapFilters) {
  const mapFilters = toMapFilters(filters);
  const params = new URLSearchParams();
  if (mapFilters.q) params.set("q", mapFilters.q);
  if (mapFilters.types?.length) params.set("types", mapFilters.types.join(","));
  if (mapFilters.statuses?.length)
    params.set("statuses", mapFilters.statuses.join(","));
  if (mapFilters.sectors?.length)
    params.set("sectors", mapFilters.sectors.join(","));
  if (mapFilters.areaMin !== undefined)
    params.set("areaMin", String(mapFilters.areaMin));
  const query = params.toString();
  return localizedPath(locale, query ? `/map?${query}` : "/map");
}
