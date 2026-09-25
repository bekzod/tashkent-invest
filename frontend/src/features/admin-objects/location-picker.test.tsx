import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { LocationPicker } from "./location-picker";

const mocks = vi.hoisted(() => {
  const maps: Array<{
    handlers: Record<string, (event?: unknown) => void>;
    remove: ReturnType<typeof vi.fn>;
    jumpTo: ReturnType<typeof vi.fn>;
  }> = [];
  const markers: Array<{
    addTo: ReturnType<typeof vi.fn>;
    getLngLat: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    setLngLat: ReturnType<typeof vi.fn>;
  }> = [];
  return { maps, markers };
});

vi.mock("maplibre-gl", () => {
  class MockMap {
    handlers: Record<string, (event?: unknown) => void> = {};
    remove = vi.fn();
    jumpTo = vi.fn();
    getZoom = vi.fn(() => 11);
    addControl = vi.fn();
    addSource = vi.fn();
    addLayer = vi.fn();
    getSource = vi.fn();
    constructor() {
      mocks.maps.push(this);
    }
    on(name: string, handler: (event?: unknown) => void) {
      this.handlers[name] = handler;
    }
  }

  class MockMarker {
    addTo = vi.fn(() => this);
    getLngLat = vi.fn(() => ({ lng: 69.22, lat: 41.39 }));
    on = vi.fn(() => this);
    remove = vi.fn();
    setLngLat = vi.fn(() => this);
    constructor() {
      mocks.markers.push(this);
    }
  }

  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      NavigationControl: class {},
    },
  };
});

vi.mock("@/shared/api/client", () => ({
  api: vi.fn().mockResolvedValue([
    {
      slug: "tashkent-district",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [69.1, 41.3],
            [69.3, 41.3],
            [69.3, 41.5],
            [69.1, 41.5],
            [69.1, 41.3],
          ],
        ],
      },
    },
  ]),
}));

function renderPicker(
  props: Partial<React.ComponentProps<typeof LocationPicker>> = {},
) {
  const onChange = props.onChange ?? vi.fn();
  const result = render(
    <LanguageProvider>
      <LocationPicker
        latitude=""
        longitude=""
        onChange={onChange}
        {...props}
      />
    </LanguageProvider>,
  );
  return { ...result, onChange };
}

beforeEach(() => {
  mocks.maps.length = 0;
  mocks.markers.length = 0;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: true })),
  });
});

afterEach(cleanup);

describe("LocationPicker", () => {
  test("does not create a marker for blank coordinates", () => {
    renderPicker();
    expect(mocks.maps).toHaveLength(1);
    expect(mocks.markers).toHaveLength(0);
  });

  test("does not recreate the map when its parent callback changes", () => {
    const first = vi.fn();
    const { rerender } = renderPicker({ onChange: first });
    const second = vi.fn();
    rerender(
      <LanguageProvider>
        <LocationPicker latitude="" longitude="" onChange={second} />
      </LanguageProvider>,
    );

    expect(mocks.maps).toHaveLength(1);
    mocks.maps[0].handlers.click({ lngLat: { lat: 41.4, lng: 69.2 } });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  test("reuses one draggable marker and emits a drag update once", () => {
    const { rerender, onChange } = renderPicker({
      latitude: "41.39",
      longitude: "69.22",
    });
    expect(mocks.markers).toHaveLength(1);
    rerender(
      <LanguageProvider>
        <LocationPicker
          latitude="41.40"
          longitude="69.23"
          onChange={onChange}
        />
      </LanguageProvider>,
    );
    expect(mocks.markers).toHaveLength(1);
    const dragHandler = mocks.markers[0].on.mock.calls.find(
      ([name]) => name === "dragend",
    )?.[1] as (() => void) | undefined;
    dragHandler?.();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test("clears the selected point and reports an outside-district point", async () => {
    const { onChange, rerender } = renderPicker({
      latitude: "41.39",
      longitude: "69.22",
    });
    fireEvent.click(screen.getByRole("button", { name: /joylashuvni tozalash/i }));
    expect(onChange).toHaveBeenCalledWith({ latitude: "", longitude: "" });

    rerender(
      <LanguageProvider>
        <LocationPicker
          latitude="41.6"
          longitude="69.2"
          onChange={onChange}
        />
      </LanguageProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/toshkent tumani/i),
    );
  });

  test("uses browser geolocation when requested", () => {
    const getCurrentPosition = vi.fn((success) =>
      success({ coords: { latitude: 41.391335, longitude: 69.220651 } }),
    );
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });
    const { onChange } = renderPicker();

    fireEvent.click(screen.getByRole("button", { name: /joriy joyim/i }));

    expect(getCurrentPosition).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({
      latitude: "41.391335",
      longitude: "69.220651",
    });
  });
});
