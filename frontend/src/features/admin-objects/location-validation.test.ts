import { describe, expect, test } from "vitest";
import {
  parseOptionalCoordinate,
  validateLocation,
} from "./location-validation";

const district: GeoJSON.Polygon = {
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
};

describe("location validation", () => {
  test("keeps blank coordinate inputs empty instead of coercing them to zero", () => {
    expect(parseOptionalCoordinate("")).toBeUndefined();
    expect(parseOptionalCoordinate("   ")).toBeUndefined();
    expect(validateLocation("", "", district)).toEqual({ point: undefined });
  });

  test("requires latitude and longitude together", () => {
    expect(validateLocation("41.391335", "", district).code).toBe(
      "bothRequired",
    );
    expect(validateLocation("", "69.220651", district).code).toBe(
      "bothRequired",
    );
  });

  test("rejects invalid ranges and points outside the configured district", () => {
    expect(validateLocation("91", "69.2", district).code).toBe(
      "latitudeRange",
    );
    expect(validateLocation("41.4", "181", district).code).toBe(
      "longitudeRange",
    );
    expect(validateLocation("41.6", "69.2", district).code).toBe(
      "outsideDistrict",
    );
  });

  test("returns a longitude-latitude tuple for a valid district point", () => {
    expect(validateLocation("41.4", "69.2", district)).toEqual({
      point: [69.2, 41.4],
    });
  });
});
