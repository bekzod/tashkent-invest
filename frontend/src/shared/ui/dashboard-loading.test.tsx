import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import {
  DashboardLoadingShell,
  DashboardGridLoading,
  DashboardListLoading,
  DashboardPageLoading,
  dashboardLoadingPreset,
  type DashboardLoadingPreset,
} from "./dashboard-loading";

afterEach(cleanup);

describe("dashboard loading system", () => {
  test("keeps the dashboard shell stable while session data resolves", () => {
    render(
      <DashboardLoadingShell label="Kabinet yuklanmoqda…" preset="overview" />,
    );

    const status = screen.getByRole("status", { name: "Kabinet yuklanmoqda…" });
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("dashboard-loading-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-loading-topbar")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-loading-page")).toHaveAttribute(
      "data-loading-preset",
      "overview",
    );
  });

  test.each<DashboardLoadingPreset>([
    "overview",
    "table",
    "grid",
    "form",
    "map",
  ])("renders the %s page structure", (preset) => {
    render(<DashboardPageLoading preset={preset} />);

    expect(screen.getByTestId("dashboard-loading-page")).toHaveAttribute(
      "data-loading-preset",
      preset,
    );
  });

  test("announces local list and grid loading without exposing decorative blocks", () => {
    const { rerender } = render(
      <DashboardListLoading label="Arizalar yuklanmoqda…" rows={3} />,
    );
    expect(
      screen.getByRole("status", { name: "Arizalar yuklanmoqda…" }),
    ).toHaveAttribute("aria-busy", "true");

    rerender(<DashboardGridLoading label="Obyektlar yuklanmoqda…" count={4} />);
    expect(
      screen.getByRole("status", { name: "Obyektlar yuklanmoqda…" }),
    ).toHaveAttribute("aria-busy", "true");
  });

  test("maps dashboard sections to stable loading structures", () => {
    expect(dashboardLoadingPreset("overview")).toBe("overview");
    expect(dashboardLoadingPreset("applications")).toBe("table");
    expect(dashboardLoadingPreset("projects")).toBe("grid");
    expect(dashboardLoadingPreset("favorites")).toBe("grid");
    expect(dashboardLoadingPreset("profile")).toBe("form");
    expect(dashboardLoadingPreset("settings")).toBe("form");
    expect(dashboardLoadingPreset("map")).toBe("map");
  });
});

// Samples are presentation-only; loading must not activate app controls or media.
test.each<DashboardLoadingPreset>(["overview", "table", "grid", "form", "map"])(
  "keeps %s samples hidden and inert",
  (preset) => {
    const { container } = render(
      <DashboardPageLoading preset={preset} label="Loading" />,
    );
    expect(container.querySelector("[skullet-reveal]")).not.toBeNull();
    expect(
      container.querySelector('[inert][aria-hidden="true"]'),
    ).not.toBeNull();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
    expect(container.querySelector("img, iframe, a[href], canvas")).toBeNull();
  },
);
