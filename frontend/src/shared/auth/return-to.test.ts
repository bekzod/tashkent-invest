import { describe, expect, it } from "vitest";
import { safeReturnTo, withReturnTo } from "./return-to";

describe("safe return destinations", () => {
  it("preserves an internal object path with query and fragment", () => {
    expect(safeReturnTo("/ru/objects/e2e-land?from=map#application")).toBe(
      "/ru/objects/e2e-land?from=map#application",
    );
    expect(
      withReturnTo("/ru/register", "/ru/objects/e2e-land#application"),
    ).toBe("/ru/register?returnTo=%2Fru%2Fobjects%2Fe2e-land%23application");
  });

  it.each([
    "https://evil.example/path",
    "//evil.example/path",
    "/\\evil.example/path",
    "/%2f%2fevil.example/path",
    "/ru/login",
    "/uz/register?returnTo=/dashboard",
  ])("rejects unsafe or looping returnTo %s", (value) => {
    expect(safeReturnTo(value)).toBe("/dashboard/profile");
  });
});
