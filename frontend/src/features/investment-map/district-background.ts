import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import boundary from "./tashkent-district.geojson.json";

/** Bundled OSM context remains visible while /areas is loading or unavailable. */
export function districtFeature(polygon?: GeoJSON.Polygon): GeoJSON.Feature {
  return polygon
    ? { type: "Feature", properties: {}, geometry: polygon }
    : (boundary as GeoJSON.Feature<GeoJSON.Polygon>);
}

/** Call before interactive layers. No handlers: this is context, not a filter. */
export function addDistrictBackground(map: MapLibreMap, polygon?: GeoJSON.Polygon) {
  map.addSource("district-boundary", {
    type: "geojson",
    data: districtFeature(polygon),
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
  });
  map.addLayer({
    id: "district-fill",
    type: "fill",
    source: "district-boundary",
    paint: { "fill-color": "#0b5ec8", "fill-opacity": 0.2 },
  });
  map.addLayer({
    id: "district-line",
    type: "line",
    source: "district-boundary",
    paint: { "line-color": "#0b5ec8", "line-opacity": 0.95, "line-width": 3 },
  });
}

export function updateDistrictBackground(map: MapLibreMap, polygon?: GeoJSON.Polygon) {
  (map.getSource("district-boundary") as GeoJSONSource | undefined)?.setData(districtFeature(polygon));
}
