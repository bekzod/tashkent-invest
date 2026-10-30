import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvestmentMap } from "./investment-map";
import { districtFeature } from "./district-background";
import type { MapFilters } from "./map-utils";

const state = vi.hoisted(() => ({ maps: [] as FakeMap[] }));
class FakeMap {
  layers: { id: string }[] = [{ id: "osm" }];
  sources = new Map<string, { data: unknown; setData: (data: unknown) => void }>();
  handlers: unknown[][] = [];
  load?: () => void;
  addSource(id: string, source: { data: unknown }) {
    this.sources.set(id, { ...source, setData(data) { this.data = data; } });
  }
  getSource(id: string) { return this.sources.get(id); }
  addLayer(layer: { id: string }) { this.layers.push(layer); }
  on(...args: unknown[]) { this.handlers.push(args); if (args[0] === "load") this.load = args[1] as () => void; }
  once() {}
  getBounds() { return { getWest: () => 69, getSouth: () => 41, getEast: () => 70, getNorth: () => 42 }; }
  remove = vi.fn();
  fitBounds = vi.fn();
  resize() {}
}
vi.mock("maplibre-gl", () => ({
  Map: class extends FakeMap { constructor() { super(); state.maps.push(this); } },
  Popup: class { remove() {} },
}));
vi.mock("@/shared/api/client", () => ({ api: vi.fn().mockResolvedValue({ type: "FeatureCollection", features: [] }) }));
vi.mock("@/shared/i18n/language-provider", () => ({ useLanguage: () => ({ locale: "uz", t: (key: string) => key }) }));
const filters: MapFilters = { q: "", types: [], statuses: [], sectors: [] };
const callbacks = { onFeatures: vi.fn(), onSelect: vi.fn(), onPolygonChange: vi.fn() };

beforeEach(() => {
  state.maps.length = 0;
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});

describe("investment map district context", () => {
  it("renders below every interactive layer even without /areas and survives filter resets", async () => {
    const view = render(<InvestmentMap filters={filters} {...callbacks} showControls={false} />);
    await waitFor(() => expect(state.maps[0]?.load).toBeDefined());
    const map = state.maps[0];
    map.load!();
    const ids = map.layers.map((layer) => layer.id);
    expect(ids.slice(0, 3)).toEqual(["osm", "district-fill", "district-line"]);
    for (const id of ["objects-circle", "clusters", "object-boundaries-fill", "selection-fill", "selected-object-fill"]) {
      expect(ids.indexOf(id)).toBeGreaterThan(ids.indexOf("district-line"));
    }
    expect(map.handlers.some((args) => String(args[1]).startsWith("district-"))).toBe(false);
    expect(map.sources.get("district-boundary")?.data).toEqual(districtFeature());
    const polygon = { type: "Polygon" as const, coordinates: [[[69.1, 41.4], [69.2, 41.4], [69.2, 41.5], [69.1, 41.4]]] };
    view.rerender(<InvestmentMap filters={{ ...filters, districtPolygon: polygon }} {...callbacks} showControls={false} />);
    await waitFor(() => expect(map.sources.get("district-boundary")?.data).toEqual(districtFeature(polygon)));
    view.rerender(<InvestmentMap filters={filters} {...callbacks} showControls={false} />);
    await waitFor(() => expect(map.sources.get("district-boundary")?.data).toEqual(districtFeature()));
    expect(map.fitBounds).not.toHaveBeenCalled();
    view.unmount();
    expect(map.remove).toHaveBeenCalledOnce();
  });
});
