import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/shared/i18n/language-provider";
import { AdminObjectsList } from "./admin-objects-list";

const { listMock, archiveMock } = vi.hoisted(() => ({ listMock: vi.fn(), archiveMock: vi.fn() }));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/features/admin-objects/api", () => ({
  adminObjectsApi: { list: listMock, archive: archiveMock },
}));

beforeEach(() => {
  listMock.mockReset();
  listMock.mockResolvedValue({
    items: [{
      id: "object-1",
      status: "available",
      district: "Chilonzor",
      cadastralNumber: "10:01:02:03",
      translations: [{ locale: "uz", title: "Test obyekt", shortDescription: "", description: "", address: "", permittedBusinesses: [] }],
      media: [],
    }],
    meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
  });
});

afterEach(cleanup);

test("submits object search instead of requesting on every keystroke", async () => {
  render(<LanguageProvider><AdminObjectsList /></LanguageProvider>);

  await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));
  await expect(listMock.mock.results[0]?.value).resolves.toMatchObject({ meta: { total: 1 } });
  expect(await screen.findByText("Test obyekt")).toBeVisible();
  expect(listMock).toHaveBeenCalledTimes(1);

  fireEvent.change(screen.getByPlaceholderText("Nomi, tuman yoki kadastr"), { target: { value: "Chilonzor" } });
  expect(listMock).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "Obyektlarni ko‘rsatish" }));
  await waitFor(() => expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({ q: "Chilonzor" })));
});
