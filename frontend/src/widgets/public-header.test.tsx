import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { PublicHeader } from "./public-header";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  pushMock.mockReset();
  window.localStorage.clear();
  window.history.replaceState({}, "", "/ru/objects/demo?from=map#application");
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

test("uses the active locale for every public navigation link", () => {
  render(
    <LanguageProvider initialLocale="ru">
      <PublicHeader pathname="/ru/objects/demo" />
    </LanguageProvider>,
  );

  expect(screen.getByRole("link", { name: /Invest Tuman/ })).toHaveAttribute(
    "href",
    "/ru",
  );
  expect(screen.getByRole("link", { name: "Карта" })).toHaveAttribute(
    "href",
    "/ru/map",
  );
  expect(screen.getByRole("link", { name: "Проекты" })).toHaveAttribute(
    "href",
    "/ru#projects",
  );
  expect(screen.getByRole("link", { name: "Аукционы" })).toHaveAttribute(
    "href",
    "/ru/map?statuses=auction",
  );
  expect(screen.getByRole("link", { name: "Новости" })).toHaveAttribute(
    "href",
    "/ru#news",
  );
  expect(screen.getByRole("link", { name: /Войти/ })).toHaveAttribute(
    "href",
    "/ru/login",
  );
  expect(
    screen.queryByRole("link", { name: /Регистрация/ }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /Войти/ })).toHaveLength(1);
});

test("shows a single guest auth action in the mobile menu", () => {
  render(
    <LanguageProvider initialLocale="uz">
      <PublicHeader pathname="/uz" />
    </LanguageProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Menyuni ochish" }));

  const mobilePanel = document.getElementById("mobile-public-navigation");
  expect(mobilePanel).not.toBeNull();
  const loginLinks = within(mobilePanel as HTMLElement).getAllByRole("link", {
    name: /Kirish/,
  });
  expect(loginLinks).toHaveLength(1);
  expect(loginLinks[0]).toHaveAttribute(
    "href",
    "/uz/login",
  );
  expect(loginLinks[0].querySelector("svg")).toBeTruthy();
});

test("switches to the equivalent localized URL and persists the choice", () => {
  render(
    <LanguageProvider initialLocale="ru">
      <PublicHeader pathname="/ru/objects/demo" />
    </LanguageProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Язык" }));
  fireEvent.click(screen.getByRole("option", { name: "O‘z" }));

  expect(pushMock).toHaveBeenCalledWith(
    "/uz/objects/demo?from=map#application",
  );
  expect(window.localStorage.getItem("tashkent-invest.locale")).toBe("uz");
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});

test("keeps an authenticated dashboard destination unprefixed", async () => {
  window.localStorage.setItem(
    "tashkent-invest.session",
    JSON.stringify({
      token: "token",
      user: {
        id: "admin-1",
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
      },
    }),
  );

  render(
    <LanguageProvider initialLocale="ru">
      <PublicHeader pathname="/ru" />
    </LanguageProvider>,
  );

  await waitFor(() =>
    expect(screen.getByRole("link", { name: /Кабинет/ })).toHaveAttribute(
      "href",
      "/dashboard",
    ),
  );
});

test("opens an accessible mobile navigation menu", () => {
  render(
    <LanguageProvider initialLocale="uz">
      <PublicHeader pathname="/uz" />
    </LanguageProvider>,
  );

  const menu = screen.getByRole("button", { name: "Menyuni ochish" });
  expect(menu).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(menu);
  expect(
    screen.getByRole("button", { name: "Menyuni yopish" }),
  ).toHaveAttribute("aria-expanded", "true");
  expect(screen.getAllByRole("link", { name: "Xarita" })).toHaveLength(2);
});

test("keeps the compact public header controls on their intended surfaces", () => {
  render(
    <LanguageProvider initialLocale="uz">
      <PublicHeader pathname="/uz" />
    </LanguageProvider>,
  );

  expect(screen.getByRole("button", { name: "Til" })).toHaveClass(
    "locale-trigger",
  );
  expect(screen.getByRole("button", { name: "Menyuni ochish" })).toHaveClass(
    "mobile-menu",
  );
});
