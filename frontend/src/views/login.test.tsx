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
import { LoginView } from "./login";

const { apiMock, replaceMock, notifyErrorMock } = vi.hoisted(() => ({
  apiMock: vi.fn(),
  replaceMock: vi.fn(),
  notifyErrorMock: vi.fn(),
}));

vi.mock("@/shared/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api/client")>();
  return { ...actual, api: apiMock };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));
vi.mock("@/shared/ui/feedback", () => ({
  notify: { error: notifyErrorMock },
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
  notifyErrorMock.mockReset();
  window.localStorage.clear();
});

afterEach(cleanup);

describe("LoginView", () => {
  test("prefills query credentials and submits them through the login action", async () => {
    apiMock.mockResolvedValue({
      token: "token",
      user: {
        id: "admin-1",
        name: "Portal Admin",
        email: "admin@demo.uz",
        role: "admin",
      },
    });

    render(
      <LanguageProvider initialLocale="uz">
        <LoginView
          initialCredentials={{
            email: "Admin@Demo.Uz",
            password: "invest2026",
          }}
        />
      </LanguageProvider>,
    );

    expect(screen.getByLabelText("Email")).toHaveValue("Admin@Demo.Uz");
    expect(screen.getByLabelText("Parol")).toHaveValue("invest2026");

    fireEvent.click(screen.getByRole("button", { name: "Kirish" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(apiMock.mock.calls[0][1].body)).toEqual({
      email: "admin@demo.uz",
      password: "invest2026",
    });
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
  });

  test("shows a toast when submitted credentials are rejected", async () => {
    apiMock.mockRejectedValue(new ApiError("Invalid credentials", 401));

    render(
      <LanguageProvider initialLocale="uz">
        <LoginView
          initialCredentials={{
            email: "admin1@demo.uz",
            password: "1taatirgul",
          }}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Kirish" }));

    await waitFor(() =>
      expect(notifyErrorMock).toHaveBeenCalledWith("Email yoki parol noto‘g‘ri."),
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("shows a request error when the login service is unavailable", async () => {
    apiMock.mockRejectedValue(new ApiError("Internal server error", 500));

    render(
      <LanguageProvider initialLocale="uz">
        <LoginView
          initialCredentials={{
            email: "admin@demo.uz",
            password: "invest2026",
          }}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Kirish" }));

    await waitFor(() => expect(notifyErrorMock).toHaveBeenCalledWith("So‘rov bajarilmadi."));
  });
});
