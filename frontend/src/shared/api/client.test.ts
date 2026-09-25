import { afterEach, describe, expect, test, vi } from "vitest";
import { ApiError, api } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("API errors", () => {
  test("keeps stable server codes while exposing only a localized message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "INVALID_REGISTRATION",
            error: "sensitive database detail",
            fieldErrors: { email: "INVALID_EMAIL" },
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const error = await api("/auth/register", { method: "POST" }, "ru").catch(
      (value: unknown) => value,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      message: "Не удалось выполнить запрос.",
      status: 400,
      code: "INVALID_REGISTRATION",
      fieldErrors: { email: "INVALID_EMAIL" },
    });
    expect(error.message).not.toContain("database");
  });
});
