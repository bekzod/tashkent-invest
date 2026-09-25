import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiError } from "@/shared/api/client";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { RegisterView } from "./register";

const { apiMock, replaceMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock("@/shared/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api/client")>();
  return { ...actual, api: apiMock };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  apiMock.mockReset();
  replaceMock.mockReset();
  window.localStorage.clear();
});

afterEach(cleanup);

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("F.I.Sh."), {
    target: { value: "  Nodira   Investor " },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: " NODIRA@EXAMPLE.UZ " },
  });
  fireEvent.change(screen.getByLabelText("Parol"), {
    target: { value: "investor2026" },
  });
  fireEvent.change(screen.getByLabelText("Parolni tasdiqlang"), {
    target: { value: "investor2026" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
}

describe("RegisterView", () => {
  test("shows localized field errors before making a request", () => {
    render(
      <LanguageProvider initialLocale="ru">
        <RegisterView />
      </LanguageProvider>,
    );

    fireEvent.submit(screen.getByTestId("register-form"));

    expect(apiMock).not.toHaveBeenCalled();
    expect(
      screen.getByText("Ф.И.О. должно содержать от 2 до 100 символов."),
    ).toBeVisible();
    expect(
      screen.getByText("Введите корректный адрес электронной почты."),
    ).toBeVisible();
    expect(
      screen.getByText(/Пароль должен содержать не менее 10 символов/),
    ).toBeVisible();
    expect(
      screen.getByText("Для регистрации необходимо согласие."),
    ).toBeVisible();
  });

  test("normalizes submitted identity, prevents a double submit, and returns safely", async () => {
    apiMock.mockResolvedValue({
      token: "token",
      user: {
        id: "investor-1",
        name: "Nodira Investor",
        email: "nodira@example.uz",
        role: "investor",
        emailVerified: false,
      },
      emailVerification: "not_configured",
    });
    render(
      <LanguageProvider initialLocale="uz">
        <RegisterView returnTo="/uz/objects/e2e-land#application" />
      </LanguageProvider>,
    );
    fillValidForm();
    const form = screen.getByTestId("register-form");

    fireEvent.submit(form);
    fireEvent.submit(form);

    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(apiMock.mock.calls[0][1].body)).toEqual({
      name: "Nodira Investor",
      email: "nodira@example.uz",
      password: "investor2026",
      consent: true,
      locale: "uz",
    });
    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        "/uz/objects/e2e-land#application",
      ),
    );
    expect(window.localStorage.getItem("tashkent-invest.session")).toContain(
      "investor-1",
    );
  });

  test("renders a localized duplicate-account error and preserves returnTo in login link", async () => {
    apiMock.mockRejectedValue(new ApiError("failed", 409, "ACCOUNT_EXISTS"));
    render(
      <LanguageProvider initialLocale="ru">
        <RegisterView returnTo="/ru/objects/e2e-land#application" />
      </LanguageProvider>,
    );

    fireEvent.change(screen.getByLabelText("Ф.И.О."), {
      target: { value: "Nodira Investor" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "nodira@example.uz" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "investor2026" },
    });
    fireEvent.change(screen.getByLabelText("Подтвердите пароль"), {
      target: { value: "investor2026" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(screen.getByTestId("register-form"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Аккаунт с этим email уже существует.",
    );
    expect(screen.getByRole("link", { name: "Войти" })).toHaveAttribute(
      "href",
      "/ru/login?returnTo=%2Fru%2Fobjects%2Fe2e-land%23application",
    );
  });
});
