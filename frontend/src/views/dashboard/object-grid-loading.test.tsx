import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { InvestmentObject } from "@/entities/investment-object/types";
import { DashboardObjectGrid } from "./object-grid";

vi.mock("@/entities/investment-object/object-card", () => ({
  ObjectCard: ({ object }: { object: InvestmentObject }) => <article>{object.title}</article>,
}));
afterEach(cleanup);

test("loading does not replace an empty result or expose stale real data", () => {
  const items = [{ id: "test", title: "Real project" }] as InvestmentObject[];
  const { container, rerender } = render(<DashboardObjectGrid items={items} loading loadingLabel="Loading projects" />);
  expect(screen.getByRole("status", { name: "Loading projects" })).toBeInTheDocument();
  expect(screen.queryByText("Real project")).toBeNull();
  rerender(<DashboardObjectGrid items={[]} />);
  expect(container.querySelector('[skullet-reveal]')).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
  rerender(<DashboardObjectGrid items={items} />);
  expect(screen.getByRole("article")).toHaveTextContent("Real project");
  rerender(<DashboardObjectGrid items={items} loading loadingLabel="Loading projects" />);
  expect(screen.queryByRole("article")).toBeNull();
});
