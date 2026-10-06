import { expect, test } from "vitest";
import { dashboardLoginHref } from "./use-dashboard-session";

test("preserves the exact dashboard application link through login", () => {
  expect(
    dashboardLoginHref(
      "ru",
      "/dashboard/applications?application=a4c522dc-164f-4caa-93ed-28be46132192",
    ),
  ).toBe(
    "/ru/login?returnTo=%2Fdashboard%2Fapplications%3Fapplication%3Da4c522dc-164f-4caa-93ed-28be46132192",
  );
});
