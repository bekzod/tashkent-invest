import { useEffect } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { FeatureCollection } from "@/entities/investment-object/types";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { MapPageClient } from "./map-page-client";

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

vi.mock("@/shared/api/client", () => ({ api: vi.fn().mockResolvedValue([]) }));
vi.mock("./investment-map", () => ({
  InvestmentMap: ({ filters, onFeatures }: { filters: unknown; onFeatures: (items: typeof features) => void }) => {
    useEffect(() => onFeatures(features), [filters, onFeatures]);
    return <div data-testid="mock-map" />;
  },
}));

afterEach(cleanup);

describe("MapPageClient mobile controls", () => {
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
