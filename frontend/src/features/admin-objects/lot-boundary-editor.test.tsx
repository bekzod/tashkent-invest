import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { LotBoundaryEditor } from "./lot-boundary-editor";

const mocks = vi.hoisted(() => ({ maps: [] as Array<{ handlers: Record<string, (event?: never) => void> }> }));

vi.mock("maplibre-gl", () => {
  class MockMap {
    handlers: Record<string, (event?: never) => void> = {};
    sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>();
    addControl = vi.fn();
    addLayer = vi.fn();
    fitBounds = vi.fn();
    remove = vi.fn();
    constructor() {
      mocks.maps.push(this);
    }
    addSource(name: string) {
      this.sources.set(name, { setData: vi.fn() });
    }
    getSource(name: string) {
      return this.sources.get(name);
    }
    on(name: string, handler: (event?: never) => void) {
      this.handlers[name] = handler;
    }
  }
  return { default: { Map: MockMap, NavigationControl: class {} } };
});

vi.mock("@/shared/api/client", () => ({
  api: vi.fn().mockResolvedValue([
    {
      slug: "tashkent-district",
      kind: "district",
      geometry: {
        type: "Polygon",
        coordinates: [[[69.1, 41.3], [69.3, 41.3], [69.3, 41.5], [69.1, 41.5], [69.1, 41.3]]],
      },
    },
  ]),
}));

function renderEditor(onChange = vi.fn()) {
  render(
    <LanguageProvider>
      <LotBoundaryEditor
        latitude="41.4"
        longitude="69.2"
        geometry={null}
        source={null}
        onChange={onChange}
      />
    </LanguageProvider>,
  );
  return onChange;
}

function addVertex(longitude: string, latitude: string) {
  fireEvent.change(screen.getByLabelText("Yangi nuqta uzunligi"), { target: { value: longitude } });
  fireEvent.change(screen.getByLabelText("Yangi nuqta kengligi"), { target: { value: latitude } });
  fireEvent.click(screen.getByRole("button", { name: /nuqta qo‘shish/i }));
}

beforeEach(() => {
  mocks.maps.length = 0;
});

afterEach(cleanup);

describe("LotBoundaryEditor", () => {
  test("adds vertices from map clicks while drawing", async () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /chegarani chizish/i }));
    await waitFor(() => expect(mocks.maps).toHaveLength(1));

    const click = mocks.maps[0].handlers.click as unknown as (event: {
      lngLat: { lng: number; lat: number };
    }) => void;
    act(() => click({ lngLat: { lng: 69.19, lat: 41.39 } }));

    expect(screen.getByText(/Nuqtalar soni:/)).toHaveTextContent("1");
  });

  test("supports keyboard vertex entry and emits a closed admin-drawn polygon", async () => {
    const onChange = renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /chegarani chizish/i }));
    addVertex("69.19", "41.39");
    addVertex("69.21", "41.39");
    addVertex("69.21", "41.41");
    addVertex("69.19", "41.41");
    await waitFor(() => expect(screen.getByText(/Nuqtalar soni:/)).toHaveTextContent("4"));
    fireEvent.click(screen.getByRole("button", { name: /shaklni yopish/i }));

    expect(onChange).toHaveBeenCalledWith({
      source: "admin_drawn",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [69.19, 41.39],
          [69.21, 41.39],
          [69.21, 41.41],
          [69.19, 41.41],
          [69.19, 41.39],
        ]],
      },
    });
  });

  test("rejects self-intersection and never persists the invalid polygon", () => {
    const onChange = renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /chegarani chizish/i }));
    addVertex("69.19", "41.39");
    addVertex("69.21", "41.41");
    addVertex("69.19", "41.41");
    addVertex("69.21", "41.39");
    fireEvent.click(screen.getByRole("button", { name: /shaklni yopish/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/kesishmasligi/i);
    expect(onChange).not.toHaveBeenCalled();
  });

  test("undo, cancel and clear remain explicit", () => {
    const geometry: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [[[69.19, 41.39], [69.21, 41.39], [69.2, 41.41], [69.19, 41.39]]],
    };
    const onChange = vi.fn();
    render(
      <LanguageProvider>
        <LotBoundaryEditor
          latitude="41.4"
          longitude="69.2"
          geometry={geometry}
          source="cadastral"
          onChange={onChange}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText(/Kadastr/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /tahrirlash/i }));
    fireEvent.click(screen.getByRole("button", { name: /oxirgi nuqtani/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Bekor qilish$/i }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /chegarani tozalash/i }));
    expect(onChange).toHaveBeenCalledWith({ geometry: null, source: null });
  });
});
