import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Building2 } from "lucide-react";
import { afterEach, expect, test } from "vitest";
import { StatCard } from "./stat-card";
import { DashboardPageLoading } from "./dashboard-loading";

afterEach(cleanup);

test("statistic transitions through loading, zero, and repeated loading", () => {
  const { container, rerender } = render(
    <StatCard label="Projects" value={42} icon={Building2} loading />,
  );
  expect(container.querySelector('[inert][aria-hidden="true"]')).not.toBeNull();
  expect(screen.queryByText("42")).toBeNull();
  rerender(<StatCard label="Projects" value={0} icon={Building2} />);
  expect(screen.getByText("0")).toBeVisible();
  rerender(<StatCard label="Projects" value={0} icon={Building2} loading />);
  expect(container.querySelector('[inert][aria-hidden="true"]')).not.toBeNull();
});

test("server rendering includes inert hidden samples and a loading announcement", () => {
  const html = renderToString(
    <DashboardPageLoading preset="form" label="Loading" />,
  );
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('inert=""');
  expect(html).toContain('role="status"');
  expect(html).toContain('aria-busy="true"');
  expect(html).not.toMatch(/<p[^>]*>\s*<div/);
});
