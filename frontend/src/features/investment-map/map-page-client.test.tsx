import { useEffect } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
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
  InvestmentMap: ({ onFeatures }: { onFeatures: (items: typeof features) => void }) => {
    useEffect(() => onFeatures(features), [onFeatures]);
    return <div data-testid="mock-map" />;
  },
}));

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
});
