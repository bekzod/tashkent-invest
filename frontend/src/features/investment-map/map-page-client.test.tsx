import { useEffect } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { FeatureCollection } from "@/entities/investment-object/types";
import { LanguageProvider } from "@/shared/i18n/language-provider";

const mocks = vi.hoisted(() => ({ investmentMapProps: vi.fn() }));

let MapPageClient: typeof import("./map-page-client").MapPageClient;

const features: FeatureCollection["features"] = Array.from(
  { length: 30 },
  (_, index) => ({
    id: `bounded-${index + 1}`,
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [69.2 + index / 1000, 41.3] as [number, number],
    },
    properties: {
      id: `bounded-${index + 1}`,
      slug: `bounded-${index + 1}`,
      title: `Bounded result ${index + 1}`,
      shortDescription: "Test",
      address: "Toshkent tumani",
      district: "Toshkent tumani",
      type: "land" as const,
      status: "available" as const,
      investmentAmountUsd: 1000,
    },
  }),
);

let mapFeatures = features;

vi.mock("@/shared/api/client", () => ({ api: vi.fn().mockResolvedValue([]) }));
vi.mock("@/features/investment-map/investment-map", () => ({
  InvestmentMap: ({
    filters,
    onFeatures,
    ...props
  }: {
    filters: unknown;
    onFeatures: (items: typeof features) => void;
    suppressLoadError?: boolean;
  }) => {
    mocks.investmentMapProps(props);
    useEffect(() => onFeatures(mapFeatures), [filters, onFeatures]);
    return <div data-testid="mock-map" />;
  },
}));

afterEach(() => {
  cleanup();
  mocks.investmentMapProps.mockClear();
});

beforeEach(() => {
  mapFeatures = features;
});

beforeAll(async () => {
  ({ MapPageClient } = await import("./map-page-client"));
});

afterAll(() => vi.resetModules());

describe("MapPageClient mobile controls", () => {
  test("uses a placeholder-only failure state for the compact homepage map", async () => {
    render(
      <LanguageProvider initialLocale="uz">
        <MapPageClient compact showToolbar={false} showMapControls={false} />
      </LanguageProvider>,
    );

    await waitFor(() =>
      expect(mocks.investmentMapProps).toHaveBeenLastCalledWith(
        expect.objectContaining({ suppressLoadError: true }),
      ),
    );
  });

  test("hides the empty result message before a homepage filter is applied", async () => {
    mapFeatures = [];
    render(
      <LanguageProvider initialLocale="uz">
        <MapPageClient compact showToolbar={false} showMapControls={false} />
      </LanguageProvider>,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("home-map-placeholder")).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("Sizning shartlaringizga mos obyekt topilmadi.")).not.toBeInTheDocument();
  });

  test("shows the empty result message after homepage filters return no objects", async () => {
    mapFeatures = [];
    render(
      <LanguageProvider initialLocale="uz">
        <MapPageClient
          compact
          showToolbar={false}
          showMapControls={false}
          controlledFilters={{ types: ["land"] }}
        />
      </LanguageProvider>,
    );

    expect(await screen.findByText("Sizning shartlaringizga mos obyekt topilmadi.")).toBeVisible();
  });

  test("focuses the map search when the dashboard search action is triggered", async () => {
    render(
      <LanguageProvider initialLocale="uz">
        <MapPageClient />
      </LanguageProvider>,
    );

    const input = screen.getByRole("textbox", { name: "Qidiruv" });
    expect(document.querySelector("#map-filter-panel")).not.toHaveClass("is-open");

    window.dispatchEvent(new CustomEvent("dashboard-search-focus"));

    expect(input).toHaveFocus();
    await waitFor(() =>
      expect(document.querySelector("#map-filter-panel")).toHaveClass("is-open"),
    );
  });

  test("keeps filters collapsible and bounds rendered results with pagination", async () => {
    render(
      <LanguageProvider initialLocale="uz">
        <MapPageClient />
      </LanguageProvider>,
    );

    await waitFor(() =>
      expect(screen.getAllByTestId("map-result-card")).toHaveLength(12),
    );
    const panel = document.querySelector("#map-filter-panel");
    expect(panel).not.toHaveClass("is-open");
    fireEvent.click(screen.getByRole("button", { name: "Filtrlarni ochish" }));
    expect(panel).toHaveClass("is-open");

    fireEvent.click(screen.getByRole("button", { name: "Keyingi sahifa" }));
    expect(screen.getByRole("heading", { name: "Bounded result 13" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Bounded result 1" })).not.toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeVisible();
  });

  test("offers a keyboard-accessible compact result list and localized details CTA", async () => {
    render(
      <LanguageProvider initialLocale="ru">
        <MapPageClient
          compact
          showToolbar={false}
          showMapControls={false}
          controlledFilters={{
            q: "bounded",
            types: ["land"],
            statuses: ["available"],
            sectors: ["logistics"],
            areaMin: 2,
          }}
        />
      </LanguageProvider>,
    );

    const firstResult = await screen.findByRole("button", {
      name: /Bounded result 1/,
    });
    firstResult.focus();
    fireEvent.keyDown(firstResult, { key: "Enter" });
    fireEvent.click(firstResult);

    expect(screen.getByTestId("home-map-preview")).toBeVisible();
    expect(screen.getByRole("link", { name: "Подробнее" })).toHaveAttribute(
      "href",
      "/ru/objects/bounded-1",
    );
    fireEvent.click(screen.getByRole("button", { name: "К списку" }));
    expect(screen.getByRole("button", { name: /Bounded result 1/ })).toBeVisible();
  });
});
