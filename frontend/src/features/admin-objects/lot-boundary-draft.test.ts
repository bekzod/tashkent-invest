import { describe, expect, test } from "vitest";
import {
  appendVertex,
  buildBoundaryDraft,
  draftPolygon,
  parseLocationPoint,
  removeLastVertex,
  replaceVertex,
} from "./lot-boundary-draft";

describe("lot boundary draft helpers", () => {
  test("does not turn incomplete coordinates into the Gulf of Guinea", () => {
    expect(parseLocationPoint("", "")).toBeUndefined();
    expect(parseLocationPoint("41.4", "")).toBeUndefined();
    expect(parseLocationPoint("", "69.2")).toBeUndefined();
    expect(parseLocationPoint("41.4", "69.2")).toEqual([69.2, 41.4]);
  });

  test("rejects invalid coordinate ranges", () => {
    expect(parseLocationPoint("91", "69.2")).toBeUndefined();
    expect(parseLocationPoint("41.4", "181")).toBeUndefined();
    expect(parseLocationPoint("invalid", "69.2")).toBeUndefined();
  });

  test("represents one point, two points, and a closed polygon distinctly", () => {
    const one = buildBoundaryDraft([[69.2, 41.4]]);
    expect(one.features).toHaveLength(1);
    expect(one.features[0]).toMatchObject({
      properties: { index: 1 },
      geometry: { type: "Point", coordinates: [69.2, 41.4] },
    });

    const two = buildBoundaryDraft([
      [69.2, 41.4],
      [69.21, 41.4],
    ]);
    expect(two.features.at(-1)?.geometry).toMatchObject({
      type: "LineString",
    });

    const three: Array<[number, number]> = [
      [69.2, 41.4],
      [69.21, 41.4],
      [69.2, 41.41],
    ];
    expect(draftPolygon(three)).toEqual({
      type: "Polygon",
      coordinates: [[...three, three[0]]],
    });
    expect(buildBoundaryDraft(three).features.at(-1)?.geometry).toMatchObject({
      type: "Polygon",
    });
  });

  test("edits vertices immutably", () => {
    const vertices = appendVertex([[69.2, 41.4]], [69.21, 41.4]);
    expect(vertices).toEqual([
      [69.2, 41.4],
      [69.21, 41.4],
    ]);
    expect(replaceVertex(vertices, 1, [69.22, 41.4])).toEqual([
      [69.2, 41.4],
      [69.22, 41.4],
    ]);
    expect(removeLastVertex(vertices)).toEqual([[69.2, 41.4]]);
  });
});
