import { describe, expect, test } from "vitest";
import {
  lotBoundaryAreaSqm,
  lotBoundaryBounds,
  validateLotBoundary,
} from "./lot-boundary";

const polygon = (ring: number[][]): GeoJSON.Polygon => ({ type: "Polygon", coordinates: [ring] });

describe("lot boundary domain", () => {
  test("accepts a concave Polygon and computes defensive bounds", () => {
    const geometry = polygon([[69.2, 41.3], [69.21, 41.3], [69.206, 41.305], [69.21, 41.31], [69.2, 41.31], [69.2, 41.3]]);
    expect(validateLotBoundary(geometry).geometry).toBe(geometry);
    expect(lotBoundaryAreaSqm(geometry.coordinates[0])).toBeGreaterThan(1);
    expect(lotBoundaryBounds(geometry)).toEqual([[69.2, 41.3], [69.21, 41.31]]);
  });

  test.each([
    [{ type: "MultiPolygon", coordinates: [] }, "polygonOnly"],
    [polygon([[69.2, 41.3], [69.21, 41.3], [69.2, 41.3], [69.2, 41.3]]), "tooFew"],
    [polygon([[69.2, 41.3], [69.21, 41.3], [69.21, 41.31], [69.2, 41.31]]), "open"],
    [polygon([[181, 41.3], [69.21, 41.3], [69.21, 41.31], [181, 41.3]]), "coordinate"],
    [polygon([[69.2, 41.3], [69.21, 41.31], [69.2, 41.31], [69.21, 41.3], [69.2, 41.3]]), "intersection"],
  ])("rejects invalid geometry %#", (geometry, code) => {
    expect(validateLotBoundary(geometry).code).toBe(code);
    expect(lotBoundaryBounds(geometry as GeoJSON.Polygon)).toBeUndefined();
  });

  test("checks the object point and district boundary", () => {
    const geometry = polygon([[69.2, 41.3], [69.21, 41.3], [69.21, 41.31], [69.2, 41.3]]);
    const district = polygon([[69, 41], [70, 41], [70, 42], [69, 42], [69, 41]]);
    expect(validateLotBoundary(geometry, { point: [69.5, 41.5], district }).code).toBe("point");
    expect(validateLotBoundary(geometry, { point: [69.205, 41.302], district }).geometry).toBe(geometry);
  });
});
