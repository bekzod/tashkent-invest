import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { api } from "@/shared/api/client";
import { AdminApplications } from "./admin-applications";

vi.mock("@/shared/api/client", () => ({ api: vi.fn() }));
const apiMock = vi.mocked(api);

const application = {
  id: "application-1",
  status: "received" as const,
  name: "Demo Investor",
  phone: "+998901234567",
  email: "demo@example.uz",
  createdAt: "2026-09-28T10:00:00.000Z",
  object: { title: "Demo yer uchastkasi", slug: "demo-land" },
};

beforeEach(() => {
  apiMock.mockReset();
  apiMock.mockImplementation((path, options) => {
    if (path.endsWith("/status") && options?.method === "PUT") {
      return Promise.resolve({ ...application, status: "in_review" }) as never;
    }
    return Promise.resolve({
      items: [application],
      meta: { page: 1, total: 1, totalPages: 1 },
    }) as never;
  });
});
afterEach(cleanup);

test("lets an admin open a request and make only the valid next transition", async () => {
  render(
    <LanguageProvider>
      <AdminApplications />
    </LanguageProvider>,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: /Demo yer uchastkasi/i }),
  );
  expect(apiMock).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("button", { name: "Ko‘rib chiqishni boshlash" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Tasdiqlash" }),
  ).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Ko‘rib chiqish izohi"), {
    target: { value: "Hujjatlar tekshirilmoqda" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Ko‘rib chiqishni boshlash" }),
  );
  await waitFor(() =>
    expect(apiMock).toHaveBeenCalledWith(
      "/admin/applications/application-1/status",
      expect.objectContaining({
        method: "PUT",
        body: expect.stringContaining("in_review"),
      }),
      "uz",
    ),
  );
});
