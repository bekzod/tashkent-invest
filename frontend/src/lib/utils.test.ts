import { describe, expect, test } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  test("merges conditional and conflicting Tailwind classes", () => {
    expect(cn("px-2", false && "px-3", "px-4", { hidden: false, block: true })).toBe(
      "px-4 block",
    );
  });
});
