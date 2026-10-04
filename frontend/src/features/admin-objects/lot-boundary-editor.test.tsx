import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { TASHKENT_DISTRICT_CENTER } from "./location-validation";
import { LotBoundaryEditor } from "./lot-boundary-editor";

const mocks = vi.hoisted(() => ({
  maps: [] as Array<{
    handlers: Record<string, (event?: never) => void>;
    options: { center: [number, number]; zoom: number };
    easeTo: ReturnType<typeof vi.fn>;
    jumpTo: ReturnType<typeof vi.fn>;
    sources: Map<string, { setData: ReturnType<typeof vi.fn> }>;
    dragPan: { disable: ReturnType<typeof vi.fn>; enable: ReturnType<typeof vi.fn> };
  }>,
}));

vi.mock("maplibre-gl", () => {
  class MockMap {
    handlers: Record<string, (event?: never) => void> = {};
    sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>();
    addControl = vi.fn();
    addLayer = vi.fn();
    fitBounds = vi.fn();
    remove = vi.fn();
    dragPan = { disable: vi.fn(), enable: vi.fn() };
    canvas = document.createElement("canvas");
    options: { center: [number, number]; zoom: number };
    easeTo = vi.fn();
    jumpTo = vi.fn();
    constructor(options: { center: [number, number]; zoom: number }) {
      this.options = options;
      mocks.maps.push(this);
    }
    addSource(name: string) {
      this.sources.set(name, { setData: vi.fn() });
    }
    getSource(name: string) {
      return this.sources.get(name);
    }
    getCanvas() {
      return this.canvas;
    }
    on(
      name: string,
      layerOrHandler: string | ((event?: never) => void),
      layerHandler?: (event?: never) => void,
    ) {
      const isLayerHandler = typeof layerOrHandler === "string";
      const handler = isLayerHandler ? layerHandler : layerOrHandler;
      if (handler) {
        this.handlers[isLayerHandler ? `${name}:${layerOrHandler}` : name] = handler;
      }
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

function editorTree(
  latitude: string,
  longitude: string,
  onChange = vi.fn(),
) {
  return (
    <LanguageProvider>
      <LotBoundaryEditor
        latitude={latitude}
        longitude={longitude}
        geometry={null}
        source={null}
        onChange={onChange}
      />
    </LanguageProvider>
  );
}

function addVertex(longitude: string, latitude: string) {
  const coordinateEntry = screen.getByRole("button", {
    name: /aniq koordinata/i,
  });
  if (coordinateEntry.getAttribute("aria-expanded") !== "true") {
    fireEvent.click(coordinateEntry);
  }
  fireEvent.change(screen.getByLabelText("Yangi nuqta uzunligi"), { target: { value: longitude } });
  fireEvent.change(screen.getByLabelText("Yangi nuqta kengligi"), { target: { value: latitude } });
  fireEvent.click(screen.getByRole("button", { name: /nuqta qo‘shish/i }));
}

beforeEach(() => {
  mocks.maps.length = 0;
});

afterEach(cleanup);

describe("LotBoundaryEditor", () => {
  test("keeps an incomplete location at the district centre and reacts to a later point", async () => {
    const view = render(editorTree("", ""));
    await waitFor(() => expect(mocks.maps).toHaveLength(1));
    expect(mocks.maps[0].options).toMatchObject({
      center: TASHKENT_DISTRICT_CENTER,
      zoom: 10,
    });
    expect(
      screen.getByRole("button", { name: /chegarani chizish/i }),
    ).toBeDisabled();

    act(() => mocks.maps[0].handlers.load());
    view.rerender(editorTree("41.4", "69.2"));

    await waitFor(() =>
      expect(mocks.maps[0].easeTo).toHaveBeenCalledWith(
        expect.objectContaining({ center: [69.2, 41.4] }),
      ),
    );
    expect(
      screen.getByRole("button", { name: /chegarani chizish/i }),
    ).toBeEnabled();
  });

  test("shows a retryable error instead of a blank map", async () => {
    renderEditor();
    await waitFor(() => expect(mocks.maps).toHaveLength(1));
    act(() => mocks.maps[0].handlers.error());

    expect(screen.getByRole("alert")).toHaveTextContent(/lot xaritasini yuklab bo‘lmadi/i);
    fireEvent.click(screen.getByRole("button", { name: /qayta urinish/i }));
    await waitFor(() => expect(mocks.maps).toHaveLength(2));
  });

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

  test("shows drawing progress and lets an administrator drag a vertex", async () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /chegarani chizish/i }));
    await waitFor(() => expect(mocks.maps).toHaveLength(1));
    act(() => mocks.maps[0].handlers.load());
    expect(screen.getByRole("status")).toHaveTextContent(/0 \/ 3 nuqta/i);

    const click = mocks.maps[0].handlers.click as unknown as (event: {
      lngLat: { lng: number; lat: number };
    }) => void;
    act(() => click({ lngLat: { lng: 69.19, lat: 41.39 } }));
    expect(screen.getByRole("status")).toHaveTextContent(/1 \/ 3 nuqta/i);

    const dragStart = mocks.maps[0].handlers[
      "mousedown:lot-boundary-draft-points"
    ] as unknown as (event: { features: Array<{ properties: { index: number } }> }) => void;
    const dragMove = mocks.maps[0].handlers.mousemove as unknown as (event: {
      lngLat: { lng: number; lat: number };
    }) => void;
    act(() => dragStart({ features: [{ properties: { index: 1 } }] }));
    act(() => dragMove({ lngLat: { lng: 69.191, lat: 41.391 } }));
    expect(mocks.maps[0].dragPan.disable).toHaveBeenCalled();
    expect(mocks.maps[0].sources.get("lot-boundary-draft")?.setData).toHaveBeenCalled();
  });

  test("supports keyboard vertex entry and emits a closed admin-drawn polygon", async () => {
    const onChange = renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /chegarani chizish/i }));
    addVertex("69.19", "41.39");
    addVertex("69.21", "41.39");
    addVertex("69.21", "41.41");
    addVertex("69.19", "41.41");
    await waitFor(() => expect(screen.getByText(/Nuqtalar soni:/)).toHaveTextContent("4"));
    fireEvent.click(screen.getByRole("button", { name: /chegarani yakunlash/i }));

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
    fireEvent.click(screen.getByRole("button", { name: /chegarani yakunlash/i }));
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
    fireEvent.click(screen.getAllByRole("button", { name: /chegarani tozalash/i }).at(-1)!);
    expect(onChange).toHaveBeenCalledWith({ geometry: null, source: null });
  });
});
