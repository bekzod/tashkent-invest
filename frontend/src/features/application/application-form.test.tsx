import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import {
  ApplicationForm,
  applicationErrorMessageKey,
} from "./application-form";

const mocks = vi.hoisted(() => {
  class MockApiError extends Error {
    constructor(
      message: string,
      public status: number,
      public code?: string,
    ) {
      super(message);
    }
  }
  return { api: vi.fn(), MockApiError };
});

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/shared/api/client", () => ({
  api: mocks.api,
  ApiError: mocks.MockApiError,
}));
vi.mock("@/shared/auth/session", () => ({
  readSession: () => ({
    token: "token",
    user: {
      id: "investor-1",
      name: "Demo Investor",
      email: "demo@example.uz",
      role: "investor",
    },
  }),
}));

beforeEach(() => mocks.api.mockReset());
afterEach(cleanup);

test("prefills identity and locks the application after a successful submission", async () => {
  mocks.api.mockResolvedValue({
    id: "application-1",
    status: "received",
    duplicate: false,
  });
  render(
    <LanguageProvider>
      <ApplicationForm objectId="11111111-1111-4111-8111-111111111111" />
    </LanguageProvider>,
  );

  expect(await screen.findByLabelText("F.I.Sh.")).toHaveValue("Demo Investor");
  expect(screen.getByLabelText("Email")).toHaveValue("demo@example.uz");
  fireEvent.change(screen.getByLabelText("Telefon"), {
    target: { value: "+998901234567" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Yuborish" }));

  expect(await screen.findByRole("status")).toHaveTextContent(
    "Arizangiz qabul qilindi",
  );
  expect(screen.getByRole("button", { name: "Yuborildi" })).toBeDisabled();
  expect(mocks.api).toHaveBeenCalledWith(
    "/applications",
    expect.objectContaining({ method: "POST" }),
    "uz",
  );
});

test("maps stable API error codes to localized copy keys", () => {
  expect(applicationErrorMessageKey("OBJECT_NOT_AVAILABLE")).toBe(
    "applicationObjectUnavailable",
  );
  expect(applicationErrorMessageKey("ACCOUNT_INACTIVE")).toBe(
    "applicationAccountInactive",
  );
  expect(applicationErrorMessageKey("database detail")).toBeUndefined();
});
