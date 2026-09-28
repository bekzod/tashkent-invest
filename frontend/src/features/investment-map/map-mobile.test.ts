import { describe, expect, test } from "vitest";
import {
  clampResultPage,
  FreehandPolygonDraft,
  mapLibreControlLocale,
  resultPageCount,
  resultPageSlice,
} from "./map-mobile";

describe("mobile map result pagination", () => {
  test("renders one bounded page even for a very large result set", () => {
    const records = Array.from({ length: 40_001 }, (_, index) => index);
    expect(resultPageCount(records.length)).toBe(3334);
    expect(resultPageSlice(records, 1)).toEqual(records.slice(0, 12));
    expect(resultPageSlice(records, 3334)).toEqual([39_996, 39_997, 39_998, 39_999, 40_000]);
    expect(clampResultPage(9999, records.length)).toBe(3334);
  });
});

describe("pointer-safe area drawing", () => {
  test("ignores other pointers and produces a closed polygon after pointer release", () => {
    const draft = new FreehandPolygonDraft();
    draft.start(7, [69.2, 41.3]);
    expect(draft.move(8, [69.21, 41.31])).toBe(false);
    draft.move(7, [69.21, 41.3]);
    draft.move(7, [69.21, 41.31]);

    const preview = draft.end(7);
    expect(preview?.coordinates[0]).toEqual([
      [69.2, 41.3],
      [69.21, 41.3],
      [69.21, 41.31],
      [69.2, 41.3],
    ]);
    expect(draft.isActive()).toBe(false);
    expect(draft.finish()).toEqual(preview);
  });

  test("pointer cancellation clears the draft and cannot leave it active", () => {
    const draft = new FreehandPolygonDraft();
    draft.start(4, [69.2, 41.3]);
    expect(draft.cancel(5)).toBe(false);
    expect(draft.isActive(4)).toBe(true);
    expect(draft.cancel(4)).toBe(true);
    expect(draft.isActive()).toBe(false);
    expect(draft.finish()).toBeUndefined();
  });
});

test("MapLibre labels are localized", () => {
  expect(mapLibreControlLocale("uz")["NavigationControl.ZoomIn"]).toBe("Yaqinlashtirish");
  expect(mapLibreControlLocale("ru")["CooperativeGesturesHandler.MobileHelpText"]).toBe(
    "Перемещайте карту двумя пальцами",
  );
});
