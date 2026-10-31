import { describe, expect, it, vi } from "vitest";
import type { Map as MapLibreMap } from "maplibre-gl";
import { addDistrictBackground, districtFeature } from "./district-background";

describe("Toshkent tumani background", () => {
  it("bundles the district in Tashkent region, not Tashkent city", () => {
    const feature = districtFeature();
    expect(feature.properties?.osmRelation).toBe(11071441);
    expect(feature.geometry.type).toBe("Polygon");
    const rings = (feature.geometry as GeoJSON.Polygon).coordinates;
    expect(rings[0].length).toBe(2396);
    for (const ring of rings) {
      expect(ring[0]).toEqual(ring.at(-1));
      for (const [longitude, latitude] of ring) {
        expect(longitude).toBeGreaterThanOrEqual(69.02);
        expect(longitude).toBeLessThanOrEqual(69.42);
        expect(latitude).toBeGreaterThanOrEqual(41.31);
        expect(latitude).toBeLessThanOrEqual(41.48);
      }
    }
  });

  it("uses the API boundary when available and restores fallback when cleared", () => {
    const polygon: GeoJSON.Polygon = { type: "Polygon", coordinates: [[[69, 41], [69.1, 41], [69.1, 41.1], [69, 41]]] };
    expect(districtFeature(polygon).geometry).toBe(polygon);
    expect(districtFeature(undefined).properties?.osmRelation).toBe(11071441);
  });

  it("preserves inner rings in API geometry", () => {
    const polygon: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [[69.1, 41.3], [69.3, 41.3], [69.3, 41.5], [69.1, 41.3]],
        [[69.2, 41.35], [69.22, 41.4], [69.22, 41.35], [69.2, 41.35]],
      ],
    };
    expect(districtFeature(polygon).geometry).toEqual(polygon);
  });

  it("adds a light, attributed background without interaction handlers", () => {
    const map = { addSource: vi.fn(), addLayer: vi.fn(), on: vi.fn() };
    addDistrictBackground(map as unknown as MapLibreMap);
    expect(map.addSource).toHaveBeenCalledWith("district-boundary", expect.objectContaining({
      type: "geojson", data: districtFeature(), attribution: expect.stringContaining("https://www.openstreetmap.org/copyright"),
    }));
    expect(map.addLayer.mock.calls.map(([layer]) => layer.id)).toEqual(["district-fill", "district-line"]);
    expect(map.addLayer.mock.calls[0][0].paint["fill-opacity"]).toBeLessThanOrEqual(0.1);
    expect(map.on).not.toHaveBeenCalled();
  });
});
