import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { api } from "@/shared/api/client";
import { AdminTelegramConnectAction } from "./admin-telegram-connect-action";

const push = vi.fn();

vi.mock("@/shared/api/client", () => ({ api: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const apiMock = vi.mocked(api);

beforeEach(() => {
  apiMock.mockReset();
  push.mockReset();
  vi.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("creates a start link for an unlinked admin and safely opens the Telegram bot", async () => {
  apiMock.mockImplementation((path) => {
    if (path === "/admin/telegram") return Promise.resolve({ linked: false }) as never;
    return Promise.resolve({ botUrl: "https://t.me/invest_tuman_bot?start=token" }) as never;
  });

  render(<LanguageProvider><AdminTelegramConnectAction /></LanguageProvider>);

  const button = await screen.findByRole("button", { name: "Telegram botni ulash" });
  expect(button).toBeEnabled();
  fireEvent.click(button);

  await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/admin/telegram/link", { method: "POST" }, "uz"));
  expect(window.open).toHaveBeenCalledWith("https://t.me/invest_tuman_bot?start=token", "_blank", "noopener,noreferrer");
  expect(push).not.toHaveBeenCalled();
});

test("routes a linked admin to Settings without creating another start link", async () => {
  apiMock.mockResolvedValue({ linked: true } as never);

  render(<LanguageProvider><AdminTelegramConnectAction /></LanguageProvider>);

  fireEvent.click(await screen.findByRole("button", { name: "Telegram bot ulangan" }));

  expect(push).toHaveBeenCalledWith("/dashboard/settings");
  expect(apiMock).not.toHaveBeenCalledWith("/admin/telegram/link", { method: "POST" }, "uz");
});
