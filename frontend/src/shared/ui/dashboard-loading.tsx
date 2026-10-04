import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DashboardSection } from "@/shared/lib/dashboard";

export type DashboardLoadingPreset =
  | "overview"
  | "table"
  | "grid"
  | "form"
  | "map";

type PageSkeletonProps = {
  preset: DashboardLoadingPreset;
  label?: string;
};

type LoadingShellProps = PageSkeletonProps & {
  label: string;
};

function PageHeadingSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex min-w-0 flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-7 w-44 max-w-[60vw]" />
        <Skeleton className="mt-2 h-4 w-96 max-w-[80vw]" />
      </div>
      {action ? <Skeleton className="h-11 w-40" /> : null}
    </div>
  );
}

export function dashboardLoadingPreset(section: DashboardSection): DashboardLoadingPreset {
  if (section === "map") return "map";
  if (section === "applications") return "table";
  if (section === "projects" || section === "favorites") return "grid";
  if (section === "profile" || section === "settings") return "form";
  return "overview";
}

export function DashboardListSkeleton({ label, rows = 5 }: { label?: string; rows?: number }) {
  return (
    <div
      className="overflow-hidden rounded-md border border-border bg-card"
      role={label ? "status" : undefined}
      aria-busy={label ? "true" : undefined}
      aria-label={label}
    >
      {label ? <span className="sr-only">{label}</span> : null}
      {Array.from({ length: rows }, (_, index) => (
        <div className="flex min-h-16 items-center gap-3 border-b border-border px-4 py-3 last:border-0" key={index}>
          <Skeleton className="size-9 shrink-0" />
          <div className="min-w-0 flex-1"><Skeleton className="h-4 w-52 max-w-full" /><Skeleton className="mt-2 h-3 w-32 max-w-full" /></div>
          <Skeleton className="h-7 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function DashboardGridSkeleton({
  className,
  count = 4,
  label,
}: {
  className?: string;
  count?: number;
  label?: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}
      role={label ? "status" : undefined}
      aria-busy={label ? "true" : undefined}
      aria-label={label}
    >
      {label ? <span className="sr-only">{label}</span> : null}
      {Array.from({ length: count }, (_, index) => <Skeleton className="h-72 w-full" key={index} />)}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <PageHeadingSkeleton />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="min-h-24 rounded-md border border-border bg-card p-4" key={index}>
            <Skeleton className="h-4 w-28 max-w-full" />
            <Skeleton className="mt-3 h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="rounded-md border border-border bg-card p-4">
          <Skeleton className="h-5 w-36" />
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 3 }, (_, index) => <Skeleton className="h-14 w-full" key={index} />)}
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <Skeleton className="h-5 w-48 max-w-full" />
          <div className="mt-5 grid gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-11 w-full" />
          </div>
        </div>
      </div>
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="h-5 w-44" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <Skeleton className="h-52 w-full" key={index} />)}
        </div>
      </div>
    </>
  );
}

function TableSkeleton() {
  return (
    <>
      <PageHeadingSkeleton />
      <div className="flex flex-wrap gap-3 rounded-md border border-border bg-card p-3">
        <Skeleton className="h-11 min-w-56 flex-1" />
        <Skeleton className="h-11 w-40" />
        <Skeleton className="h-11 w-32" />
      </div>
      <DashboardListSkeleton rows={6} />
    </>
  );
}

function GridSkeleton() {
  return (
    <>
      <PageHeadingSkeleton />
      <div className="flex flex-wrap gap-3 rounded-md border border-border bg-card p-3">
        <Skeleton className="h-11 min-w-56 flex-1" />
        <Skeleton className="h-11 w-44" />
      </div>
      <DashboardGridSkeleton className="xl:grid-cols-3 2xl:grid-cols-4" count={8} />
    </>
  );
}

function FormSkeleton() {
  return (
    <>
      <PageHeadingSkeleton />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => <Skeleton className="h-10 w-full" key={index} />)}
      </div>
      <div className="rounded-md border border-border bg-card p-4 sm:p-6">
        <Skeleton className="h-5 w-36" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index}><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-11 w-full" /></div>
          ))}
        </div>
        <Skeleton className="mt-6 h-24 w-full" />
      </div>
    </>
  );
}

function MapSkeleton() {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] min-w-0 gap-3 p-[var(--ds-page-gutter)] lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="order-2 rounded-md border border-border bg-card p-4 lg:order-1">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-4 h-11 w-full" />
        <div className="mt-5 grid gap-3">
          {Array.from({ length: 6 }, (_, index) => <Skeleton className="h-9 w-full" key={index} />)}
        </div>
      </div>
      <div className="order-1 min-h-[24rem] overflow-hidden rounded-md border border-border bg-card p-3 lg:order-2 lg:min-h-0">
        <Skeleton className="h-full min-h-[22rem] w-full" />
      </div>
    </div>
  );
}

export function DashboardPageSkeleton({ label, preset }: PageSkeletonProps) {
  if (preset === "map") {
    return <div data-loading-preset={preset} data-testid="dashboard-loading-page" role={label ? "status" : undefined} aria-busy={label ? "true" : undefined} aria-label={label}>{label ? <span className="sr-only">{label}</span> : null}<MapSkeleton /></div>;
  }

  return (
    <div
      className="flex min-w-0 flex-col gap-[var(--ds-section-gap)] px-[var(--ds-page-gutter)] py-[var(--ds-page-y)]"
      data-loading-preset={preset}
      data-testid="dashboard-loading-page"
      role={label ? "status" : undefined}
      aria-busy={label ? "true" : undefined}
      aria-label={label}
    >
      {label ? <span className="sr-only">{label}</span> : null}
      {preset === "overview" ? <OverviewSkeleton /> : null}
      {preset === "table" ? <TableSkeleton /> : null}
      {preset === "grid" ? <GridSkeleton /> : null}
      {preset === "form" ? <FormSkeleton /> : null}
    </div>
  );
}

export function DashboardLoadingShell({ label, preset }: LoadingShellProps) {
  return (
    <div className="invest-dashboard" role="status" aria-busy="true" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>
      <aside className="dashboard-sidebar dashboard-sidebar--desktop" data-testid="dashboard-loading-sidebar" aria-hidden="true">
        <div className="dashboard-brand-row flex items-center gap-3">
          <Skeleton className="size-9 shrink-0" />
          <div className="min-w-0 flex-1"><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-3 w-24" /></div>
        </div>
        <div className="px-2 py-3"><Skeleton className="h-9 w-full" /></div>
        <div className="grid gap-2 px-3 py-2">
          <Skeleton className="mb-2 h-3 w-16" />
          {Array.from({ length: 5 }, (_, index) => <Skeleton className="h-9 w-full" key={index} />)}
          <Skeleton className="mb-2 mt-4 h-3 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="dashboard-sidebar-bottom p-3"><Skeleton className="h-10 w-full" /></div>
      </aside>
      <section className="dashboard-stage min-w-0">
        <header className="dashboard-topbar" data-testid="dashboard-loading-topbar" aria-hidden="true">
          <Skeleton className="dashboard-mobile-menu size-10 shrink-0" />
          <div className="dashboard-topbar-title min-w-0 flex-1"><Skeleton className="h-4 w-44 max-w-full" /></div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="size-10" />
            <Skeleton className="size-10" />
          </div>
        </header>
        <main className="dashboard-content min-w-0">
          <DashboardPageSkeleton preset={preset} />
        </main>
      </section>
    </div>
  );
}
