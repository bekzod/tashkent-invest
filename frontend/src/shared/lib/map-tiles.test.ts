import { describe, expect, test } from "vitest";
import { mapTileUrls } from "./map-tiles";

describe("mapTileUrls", () => {
  test("uses the default HOT tiles when no value is configured", () => {
    expect(mapTileUrls(undefined)).toEqual([
      "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    ]);
  });

  test("keeps ordinary MapLibre tile templates unchanged", () => {
    expect(mapTileUrls("https://tile.openstreetmap.org/{z}/{x}/{y}.png")).toEqual([
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    ]);
  });

  test("expands the common OSM {s} subdomain placeholder", () => {
    expect(mapTileUrls("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")).toEqual([
      "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
    ]);
  });
});
