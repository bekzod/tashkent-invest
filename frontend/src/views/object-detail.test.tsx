import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { api } from "@/shared/api/client";
import { ObjectDetail } from "./object-detail";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/shared/api/client", () => ({ api: vi.fn() }));

afterEach(cleanup);

test("shows localized not-found copy when an object request fails", async () => {
  vi.mocked(api).mockRejectedValueOnce(new Error("not found"));

  render(
    <LanguageProvider initialLocale="ru">
      <ObjectDetail slug="missing" />
    </LanguageProvider>,
  );

  expect(await screen.findByText("Страница не найдена.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Смотреть карту" })).toHaveAttribute(
    "href",
    "/ru/map",
  );
});

test("does not offer an application form for an upcoming object", () => {
  const object = {
    id: "object-1",
    slug: "upcoming",
    title: "Kutilayotgan obyekt",
    shortDescription: "",
    description: "",
    address: "Toshkent",
    district: "Toshkent",
    type: "land" as const,
    status: "upcoming" as const,
    landAreaHa: 2,
    investmentAmountUsd: 1000,
  };
  render(
    <LanguageProvider>
      <ObjectDetail slug="upcoming" initialObject={object} initialLocale="uz" />
    </LanguageProvider>,
  );
  expect(
    screen.getByText("Bu obyekt hozir ariza qabul qilmaydi."),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Yuborish" }),
  ).not.toBeInTheDocument();
});
