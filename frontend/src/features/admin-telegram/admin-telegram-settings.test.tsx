import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { api } from "@/shared/api/client";
import { AdminTelegramSettings } from "./admin-telegram-settings";

vi.mock("@/shared/api/client", () => ({ api: vi.fn() }));

const apiMock = vi.mocked(api);

beforeEach(() => {
  apiMock.mockReset();
  vi.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("guides an admin through linking the Telegram bot and safely opens the returned URL", async () => {
  apiMock.mockImplementation((path) => {
    if (path === "/admin/telegram") return Promise.resolve({ linked: false, linkedAt: null }) as never;
    return Promise.resolve({ botUrl: "https://t.me/invest_tuman_bot?start=token", expiresAt: "2026-10-06T10:00:00.000Z" }) as never;
  });

  render(<LanguageProvider><AdminTelegramSettings /></LanguageProvider>);

  expect(await screen.findByText("Telegram bot ulanmagan")).toBeVisible();
  expect(screen.getByText("Telegram botni oching")).toBeVisible();
  expect(screen.getByText("Botdagi Start tugmasini bosing")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Telegram botni ulash" }));

  await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/admin/telegram/link", { method: "POST" }, "uz"));
  expect(window.open).toHaveBeenCalledWith("https://t.me/invest_tuman_bot?start=token", "_blank", "noopener,noreferrer");
  expect(await screen.findByText(/Botdagi Start tugmasini bosing, so‘ng/i)).toBeVisible();
});

test("shows the connected state after the bot chat is linked", async () => {
  apiMock.mockResolvedValue({ linked: true, linkedAt: "2026-10-06T10:00:00.000Z" } as never);

  render(<LanguageProvider><AdminTelegramSettings /></LanguageProvider>);

  expect(await screen.findByText("Telegram bot ulangan")).toBeVisible();
  expect(screen.getByText("Yangi investor arizalari shu Telegram chatiga yuboriladi.")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Telegram botni ulash" })).not.toBeInTheDocument();
});

test("refuses a non-Telegram URL returned by the server", async () => {
  apiMock.mockImplementation((path) => path === "/admin/telegram"
    ? Promise.resolve({ linked: false, linkedAt: null }) as never
    : Promise.resolve({ botUrl: "https://example.com", expiresAt: "2026-10-06T10:00:00.000Z" }) as never,
  );

  render(<LanguageProvider><AdminTelegramSettings /></LanguageProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Telegram botni ulash" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Telegram botni ulashni boshlab bo‘lmadi.");
  expect(window.open).not.toHaveBeenCalled();
});
