import { beforeEach, describe, expect, test, vi } from "vitest";

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

vi.mock("sonner", () => ({ toast }));

import { notify } from "./feedback";

describe("notify", () => {
  beforeEach(() => vi.clearAllMocks());

  test("uses semantic toast methods and supports a detail", () => {
    notify.success("Saved", { description: "Your changes are live." });
    notify.error("Could not save");
    notify.warning("Check the details");
    notify.info("Loading continues in the background");

    expect(toast.success).toHaveBeenCalledWith("Saved", {
      description: "Your changes are live.",
    });
    expect(toast.error).toHaveBeenCalledWith("Could not save", {
      description: undefined,
    });
    expect(toast.warning).toHaveBeenCalledWith("Check the details", {
      description: undefined,
    });
    expect(toast.info).toHaveBeenCalledWith(
      "Loading continues in the background",
      { description: undefined },
    );
  });
});
