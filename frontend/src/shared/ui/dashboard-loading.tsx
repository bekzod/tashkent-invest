"use client";

import type { ReactNode } from "react";
import { Skeleton, SkulletProvider } from "skullet/react";
import { cn } from "@/lib/utils";
import type { DashboardSection } from "@/shared/lib/dashboard";

export type DashboardLoadingPreset =
  "overview" | "table" | "grid" | "form" | "map";
type PageLoadingProps = { preset: DashboardLoadingPreset; label?: string };

// Only inert, synthetic presentation markup belongs here: never mount a data
// fetching page, MapLibre map, real images, or prefetching links as a sample.
function LoadingPreview({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div
      role={label ? "status" : undefined}
      aria-busy="true"
      aria-label={label}
    >
      {label ? <span className="sr-only">{label}</span> : null}
      <SkulletProvider>
        <Skeleton loading>{children}</Skeleton>
      </SkulletProvider>
    </div>
  );
}

export function dashboardLoadingPreset(
  section: DashboardSection,
): DashboardLoadingPreset {
  if (section === "map") return "map";
  if (section === "applications") return "table";
  if (section === "projects" || section === "favorites") return "grid";
  if (section === "profile" || section === "settings") return "form";
  return "overview";
}

function HeadingSample() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Investment projects</h1>
        <p className="mt-2 text-sm">
          Browse and manage your investment projects
        </p>
      </div>
      <button disabled className="h-11 rounded-md px-4">
        Add project
      </button>
    </div>
  );
}

function ListSample({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      {Array.from({ length: rows }, (_, index) => (
        <div
          className="flex min-h-16 items-center gap-3 border-b border-border px-4 py-3 last:border-0"
          key={index}
        >
          <span {...{ "skullet-block": "" }} className="size-9 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Investment application</p>
            <p className="mt-2 text-xs">Project information</p>
          </div>
          <span className="rounded-md px-3 py-1 text-sm">Pending</span>
        </div>
      ))}
    </div>
  );
}

function GridSample({
  className,
  count,
}: {
  className?: string;
  count: number;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <article className="object-card" key={index}>
          <div {...{ "skullet-block": "" }} className="object-card-image" />
          <div className="object-card-body">
            <p className="eyebrow">Project location</p>
            <h3>Investment opportunity</h3>
            <p>Project description and information</p>
            <div className="object-card-meta">
              <span>1 hectare</span>
              <strong>$100,000</strong>
            </div>
            <span className="text-link">Details →</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function DashboardListLoading({
  label,
  rows = 5,
}: {
  label?: string;
  rows?: number;
}) {
  return (
    <LoadingPreview label={label}>
      <ListSample rows={rows} />
    </LoadingPreview>
  );
}

export function DashboardGridLoading({
  className,
  count = 4,
  label,
}: {
  className?: string;
  count?: number;
  label?: string;
}) {
  return (
    <LoadingPreview label={label}>
      <GridSample className={className} count={count} />
    </LoadingPreview>
  );
}

function PageSample({ preset }: { preset: DashboardLoadingPreset }) {
  if (preset === "map")
    return (
      <div className="grid min-h-[calc(100vh-4rem)] min-w-0 gap-3 p-[var(--ds-page-gutter)] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="order-2 rounded-md border bg-card p-4 lg:order-1">
          <h2 className="text-xl">Projects</h2>
          <ListSample rows={6} />
        </div>
        <div {...{ "skullet-block": "" }} className="order-1 min-h-[24rem] rounded-md border bg-card lg:order-2" />
      </div>
    );
  return (
    <div className="flex min-w-0 flex-col gap-[var(--ds-section-gap)] px-[var(--ds-page-gutter)] py-[var(--ds-page-y)]">
      <HeadingSample />
      {preset === "overview" ? (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                className="min-h-28 rounded-md border bg-card p-4"
                key={index}
              >
                <p className="text-sm">Total projects</p>
                <strong className="mt-3 block text-xl">120</strong>
              </div>
            ))}
          </div>
          <ListSample rows={3} />
          <GridSample count={4} />
        </>
      ) : null}
      {preset === "table" || preset === "grid" ? (
        <div className="flex flex-wrap gap-3 rounded-md border bg-card p-3">
          <input
            disabled
            placeholder="Search projects"
            className="h-11 min-w-56 flex-1"
          />
          <button disabled className="h-11 px-4">
            All statuses
          </button>
        </div>
      ) : null}
      {preset === "table" ? <ListSample rows={6} /> : null}
      {preset === "grid" ? (
        <GridSample className="xl:grid-cols-3 2xl:grid-cols-4" count={8} />
      ) : null}
      {preset === "form" ? (
        <div className="rounded-md border bg-card p-4 sm:p-6">
          <h2>Project information</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <label className="grid gap-2 text-sm" key={index}>
                Project field
                <input disabled className="h-11 rounded-md border" />
              </label>
            ))}
          </div>
          <textarea disabled className="mt-6 h-24 w-full rounded-md border" />
        </div>
      ) : null}
    </div>
  );
}

export function DashboardPageLoading({ label, preset }: PageLoadingProps) {
  return (
    <div data-loading-preset={preset} data-testid="dashboard-loading-page">
      <LoadingPreview label={label}>
        <PageSample preset={preset} />
      </LoadingPreview>
    </div>
  );
}

export function DashboardLoadingShell({
  label,
  preset,
}: PageLoadingProps & { label: string }) {
  return (
    <div
      className="invest-dashboard"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <aside
        className="dashboard-sidebar dashboard-sidebar--desktop"
        data-testid="dashboard-loading-sidebar"
        aria-hidden="true"
      >
        <LoadingPreview>
          <div className="dashboard-brand-row p-4 font-bold">
            Tashkent Invest
          </div>
          <div className="grid gap-2 p-3">
            {[
              "Overview",
              "Projects",
              "Applications",
              "Favorites",
              "Profile",
              "Settings",
            ].map((item) => (
              <div className="rounded-md px-3 py-2" key={item}>
                {item}
              </div>
            ))}
          </div>
        </LoadingPreview>
      </aside>
      <section className="dashboard-stage min-w-0">
        <header
          className="dashboard-topbar"
          data-testid="dashboard-loading-topbar"
          aria-hidden="true"
        >
          <LoadingPreview>
            <p className="text-sm font-medium">Investment dashboard</p>
          </LoadingPreview>
        </header>
        <main className="dashboard-content min-w-0">
          <DashboardPageLoading preset={preset} />
        </main>
      </section>
    </div>
  );
}
