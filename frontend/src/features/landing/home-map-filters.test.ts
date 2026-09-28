import { describe, expect, test } from "vitest";
import {
  emptyHomeMapFilters,
  homeMapHref,
  toMapFilters,
} from "./home-map-filters";

describe("homepage map filters", () => {
  test("keeps search, type, status, sector and minimum area synchronized", () => {
    const filters = {
      q: "  E2E logistika  ",
      selections: ["land", "auction"],
      sector: "logistics",
      areaMin: 12,
    };

    expect(toMapFilters(filters)).toEqual({
      q: "E2E logistika",
      types: ["land"],
      statuses: ["auction"],
      sectors: ["logistics"],
      areaMin: 12,
    });
    expect(homeMapHref("ru", filters)).toBe(
      "/ru/map?q=E2E+logistika&types=land&statuses=auction&sectors=logistics&areaMin=12",
    );
  });

  test("clears every filter without leaving decorative defaults", () => {
    const filters = emptyHomeMapFilters();

    expect(toMapFilters(filters)).toEqual({
      q: "",
      types: [],
      statuses: [],
      sectors: [],
      areaMin: undefined,
    });
    expect(homeMapHref("uz", filters)).toBe("/uz/map");
  });
});
