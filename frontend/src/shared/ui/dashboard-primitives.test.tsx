import { render, screen } from "@testing-library/react";
import { Building2 } from "lucide-react";
import { describe, expect, test } from "vitest";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { FilterToolbar } from "./filter-toolbar";
import { FormSection } from "./form-section";
import { PageHeader } from "./page-header";
import { PageLayout } from "./page-layout";
import { StatCard } from "./stat-card";
import { StatusBadge } from "./status-badge";

describe("dashboard compositions", () => {
  test("renders the page hierarchy and actions", () => {
    render(<PageLayout><PageHeader title="Obyektlar" description="Barcha obyektlar" actions={<Button>Qo‘shish</Button>} /></PageLayout>);
    expect(screen.getByRole("main")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Obyektlar" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Qo‘shish" })).toBeVisible();
  });

  test("renders reusable states and semantic sections", () => {
    render(<><FilterToolbar aria-label="Filtrlar" /><StatCard label="Jami" value={12} icon={Building2} /><FormSection title="Asosiy"><p>Form</p></FormSection><EmptyState title="Natija yo‘q" action={<Button>Tozalash</Button>} /><ErrorState title="Yuklanmadi" /></>);
    expect(screen.getByRole("search", { name: "Filtrlar" })).toBeVisible();
    expect(screen.getByText("12")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Asosiy" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Tozalash" })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Yuklanmadi");
  });

  test("exposes status meaning independently from color", () => {
    render(<StatusBadge tone="success">Mavjud</StatusBadge>);
    expect(screen.getByText("Mavjud")).toHaveAttribute("data-tone", "success");
  });
});
