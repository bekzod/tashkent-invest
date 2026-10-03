# Dashboard UI/UX Audit and Refactor Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Refactor every administrator and investor dashboard route into one compact, accessible, responsive design system without changing business rules or API contracts.

**Architecture:** Keep shadcn/Radix primitives in `src/components/ui`, add reusable dashboard compositions in `src/shared/ui`, and split the large dashboard view into route-specific role views that fetch only their own data. Preserve the common role-aware shell while replacing one-off CSS and dead controls with token-backed, tested components.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/Radix UI, Lucide, Sonner, Vitest/Testing Library, Playwright.

---

## Execution Rules

- Preserve the existing uncommitted `frontend/src/app/globals.css` changes; do not reset or overwrite them.
- Work in the task order below because later page migrations depend on the shared primitives and shell.
- Keep route files thin and preserve current API and authorization behavior.
- Use `apply_patch` for manual edits.
- Run focused tests before each commit and the full quality gate at the end.
- Do not expose unsupported profile or notification actions as functional controls.

### Task 1: Establish dashboard tokens and shared composition primitives

**Files:**
- Create: `frontend/src/app/design-tokens.css`
- Modify: `frontend/src/app/globals.css`
- Create: `frontend/src/shared/ui/page-layout.tsx`
- Create: `frontend/src/shared/ui/page-header.tsx`
- Create: `frontend/src/shared/ui/filter-toolbar.tsx`
- Create: `frontend/src/shared/ui/stat-card.tsx`
- Create: `frontend/src/shared/ui/empty-state.tsx`
- Create: `frontend/src/shared/ui/error-state.tsx`
- Create: `frontend/src/shared/ui/form-section.tsx`
- Create: `frontend/src/shared/ui/status-badge.tsx`
- Create: `frontend/src/shared/ui/dashboard-primitives.test.tsx`

**Step 1: Write the failing primitive tests**

Cover:

```tsx
render(<PageHeader title="Obyektlar" description="Barcha obyektlar" actions={<Button>Qo‘shish</Button>} />);
expect(screen.getByRole("heading", { name: "Obyektlar" })).toBeVisible();
expect(screen.getByRole("button", { name: "Qo‘shish" })).toBeVisible();

render(<EmptyState title="Natija yo‘q" description="Filtrlarni o‘zgartiring" action={<Button>Tozalash</Button>} />);
expect(screen.getByText("Natija yo‘q")).toBeVisible();

render(<StatusBadge tone="success">Mavjud</StatusBadge>);
expect(screen.getByText("Mavjud")).toHaveAttribute("data-tone", "success");
```

Also assert that `PageLayout`, `FilterToolbar`, `StatCard`, `ErrorState`, and
`FormSection` expose semantic headings/regions and accept `className`.

**Step 2: Run the focused test and confirm failure**

Run:

```bash
cd frontend
bun --bun vitest run src/shared/ui/dashboard-primitives.test.tsx
```

Expected: FAIL because the new modules do not exist.

**Step 3: Add semantic design tokens**

Define token groups in `design-tokens.css` for:

```css
:root {
  --ds-page-gutter: clamp(1rem, 2.5vw, 2.25rem);
  --ds-page-gap: 1.25rem;
  --ds-control-height: 2.5rem;
  --ds-control-height-mobile: 2.75rem;
  --ds-surface: var(--card);
  --ds-surface-muted: var(--muted);
  --ds-border: var(--border);
  --ds-radius: 0.5rem;
  --ds-shadow-card: 0 1px 2px rgb(15 23 42 / 0.05);
}
```

Import the token file from `globals.css`. Map current dashboard classes to the
tokens before deleting duplicate literals. Preserve the previously edited
project editor padding and action-bar behavior.

**Step 4: Implement the shared compositions**

Each component must use `cn()` and existing primitives. Keep the API small:

```tsx
export function PageLayout({ children, className, workspace = false }: Props) {
  return <main className={cn("dashboard-page-layout", workspace && "is-workspace", className)}>{children}</main>;
}

export function PageHeader({ title, description, eyebrow, actions }: Props) {
  return (
    <header className="dashboard-page-header">
      <div>{eyebrow ? <p>{eyebrow}</p> : null}<h1>{title}</h1>{description ? <span>{description}</span> : null}</div>
      {actions ? <div className="dashboard-page-header-actions">{actions}</div> : null}
    </header>
  );
}
```

Use a `data-tone` API for `StatusBadge` so labels never depend on color alone.

**Step 5: Run tests and lint**

Run:

```bash
bun --bun vitest run src/shared/ui/dashboard-primitives.test.tsx
bun run lint
```

Expected: PASS.

**Step 6: Commit**

```bash
git add frontend/src/app/design-tokens.css frontend/src/app/globals.css frontend/src/shared/ui
git commit -m "feat: add dashboard design primitives"
```

### Task 2: Refactor the responsive dashboard shell

**Files:**
- Create: `frontend/src/components/ui/sheet.tsx`
- Create: `frontend/src/components/ui/tooltip.tsx`
- Modify: `frontend/package.json`
- Modify: `frontend/bun.lock`
- Modify: `frontend/src/widgets/dashboard-shell.tsx`
- Modify: `frontend/src/widgets/dashboard-shell.test.tsx`
- Modify: `frontend/src/widgets/dashboard-nav.ts`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/e2e/dashboard-sidebar.spec.ts`

**Step 1: Extend shell tests first**

Add tests that assert:

- Admin and investor receive only their allowed navigation entries.
- Mobile menu trigger opens a dialog/sheet labelled as dashboard navigation.
- Selecting a mobile navigation entry closes the sheet.
- Locale, notifications, and profile actions remain keyboard accessible.
- Page action slot renders without portal-owned layout assumptions.

**Step 2: Run the shell test and confirm failure**

```bash
cd frontend
bun --bun vitest run src/widgets/dashboard-shell.test.tsx
```

Expected: new mobile sheet and action-slot assertions fail.

**Step 3: Install and add missing shadcn primitives**

```bash
cd frontend
bun add @radix-ui/react-tooltip
```

Add shadcn-compatible `Sheet` using the existing Dialog dependency and a Radix
`Tooltip` wrapper. Both must use existing tokens and accessible titles.

**Step 4: Refactor the shell**

- Keep the desktop collapsible sidebar.
- Replace the fixed narrow mobile sidebar with a menu button and `Sheet`.
- Use one navigation renderer for desktop and mobile.
- Keep breadcrumb and page action ownership in the shell.
- Use icon buttons with accessible labels and tooltips.
- Add `workspace` support so the map can bypass normal max-width constraints.

**Step 5: Run focused tests and sidebar E2E**

```bash
bun --bun vitest run src/widgets/dashboard-shell.test.tsx
E2E_API_READY=1 bunx playwright test e2e/dashboard-sidebar.spec.ts
```

Expected: all desktop and mobile shell cases pass with no horizontal overflow.

**Step 6: Commit**

```bash
git add frontend/package.json frontend/bun.lock frontend/src/components/ui frontend/src/widgets frontend/src/app/globals.css frontend/e2e/dashboard-sidebar.spec.ts
git commit -m "feat: make dashboard shell responsive"
```

### Task 3: Split route-specific dashboard data and views

**Files:**
- Modify: `frontend/src/views/dashboard.tsx`
- Create: `frontend/src/views/dashboard/investor-overview.tsx`
- Create: `frontend/src/views/dashboard/investor-projects.tsx`
- Create: `frontend/src/views/dashboard/investor-applications.tsx`
- Create: `frontend/src/views/dashboard/investor-favorites.tsx`
- Create: `frontend/src/views/dashboard/investor-profile.tsx`
- Create: `frontend/src/views/dashboard/investor-settings.tsx`
- Create: `frontend/src/views/dashboard/dashboard-map.tsx`
- Create: `frontend/src/views/dashboard/use-dashboard-session.ts`
- Create: `frontend/src/views/dashboard/dashboard-data.test.tsx`
- Modify: `frontend/src/views/dashboard.test.tsx`

**Step 1: Add failing request-isolation tests**

Mock the API and render each active section. Assert:

```tsx
renderDashboard("settings");
expect(apiMock).not.toHaveBeenCalledWith(expect.stringContaining("/statistics"), expect.anything(), expect.anything());

renderDashboard("projects");
expect(apiMock).toHaveBeenCalledWith(expect.stringContaining("/objects"), expect.anything(), "uz");
expect(apiMock).not.toHaveBeenCalledWith("/me/favorites", expect.anything(), "uz");
```

Also verify that admin routes do not start investor requests.

**Step 2: Run and confirm failure**

```bash
bun --bun vitest run src/views/dashboard.test.tsx src/views/dashboard/dashboard-data.test.tsx
```

Expected: FAIL because the monolithic view still loads all investor resources.

**Step 3: Extract the session boundary and page views**

`DashboardView` should only resolve session/role and select the route view. Each
page view owns an abortable request for its own data. Keep API response types
near the owning page until they are reused.

**Step 4: Run tests**

```bash
bun --bun vitest run src/views/dashboard.test.tsx src/views/dashboard/dashboard-data.test.tsx
```

Expected: PASS with request isolation proven.

**Step 5: Commit**

```bash
git add frontend/src/views/dashboard.tsx frontend/src/views/dashboard frontend/src/views/dashboard.test.tsx
git commit -m "refactor: split dashboard route views"
```

### Task 4: Migrate the administrator overview

**Files:**
- Modify: `frontend/src/features/admin-objects/admin-overview.tsx`
- Create: `frontend/src/features/admin-objects/admin-overview.test.tsx`
- Modify: `frontend/src/shared/i18n/messages.ts`
- Modify: `frontend/src/app/globals.css`

**Step 1: Write failing overview tests**

Test total, published, draft, and review-needed metrics; recent objects; loading
skeleton; request failure with retry; and the new-object CTA.

**Step 2: Verify failure**

```bash
bun --bun vitest run src/features/admin-objects/admin-overview.test.tsx
```

**Step 3: Implement with shared primitives**

- Use `PageLayout`, `PageHeader`, and `StatCard`.
- Fetch object totals and review-needed application metadata in parallel.
- Render recent objects as a compact list with `StatusBadge`.
- Keep partial successful data and show a warning toast if one request fails.
- Show `ErrorState` only if the overview has no usable data.

**Step 4: Run focused tests and commit**

```bash
bun --bun vitest run src/features/admin-objects/admin-overview.test.tsx
git add frontend/src/features/admin-objects frontend/src/shared/i18n/messages.ts frontend/src/app/globals.css
git commit -m "feat: improve admin dashboard overview"
```

### Task 5: Migrate the administrator object list

**Files:**
- Modify: `frontend/src/shared/ui/list-table.tsx`
- Modify: `frontend/src/shared/ui/server-pagination.tsx`
- Create: `frontend/src/shared/ui/list-table.test.tsx`
- Modify: `frontend/src/features/admin-objects/admin-objects-list.tsx`
- Create: `frontend/src/features/admin-objects/admin-objects-list.test.tsx`
- Modify: `frontend/src/app/globals.css`

**Step 1: Add failing responsive-list tests**

Assert that the desktop table has semantic headers, the mobile alternative
contains labelled object/status/actions, loading preserves structure, and empty
state changes when filters are active.

**Step 2: Run and confirm failure**

```bash
bun --bun vitest run src/shared/ui/list-table.test.tsx src/features/admin-objects/admin-objects-list.test.tsx
```

**Step 3: Implement the list UX**

- Wrap search, status filter, and create action in `FilterToolbar`.
- Keep URL/server pagination semantics.
- Use desktop table above the mobile breakpoint and purpose-built mobile cards
  below it.
- Move edit/archive actions into an accessible dropdown on narrow layouts.
- Preserve archive confirmation and refresh behavior.
- Add retryable request error state without erasing successful old rows during a
  background refresh.

**Step 4: Run tests and commit**

```bash
bun --bun vitest run src/shared/ui/list-table.test.tsx src/features/admin-objects/admin-objects-list.test.tsx
git add frontend/src/shared/ui frontend/src/features/admin-objects frontend/src/app/globals.css
git commit -m "feat: make admin objects list responsive"
```

### Task 6: Refine the object create/edit workflow

**Files:**
- Modify: `frontend/src/features/admin-objects/object-editor.tsx`
- Modify: `frontend/src/features/admin-objects/object-editor.test.tsx`
- Modify: `frontend/src/features/admin-objects/location-picker.tsx`
- Modify: `frontend/src/features/admin-objects/lot-boundary-editor.tsx`
- Create: `frontend/src/shared/ui/stepper.tsx`
- Create: `frontend/src/shared/ui/stepper.test.tsx`
- Modify: `frontend/src/shared/i18n/messages.ts`
- Modify: `frontend/src/app/globals.css`

**Step 1: Add failing editor UX tests**

Cover accessible step navigation, blocked progression with validation summary,
save/publish disabled states, sticky actions, unsaved-change confirmation, and
mobile step labels.

**Step 2: Run focused tests and confirm failure**

```bash
bun --bun vitest run src/features/admin-objects/object-editor.test.tsx src/shared/ui/stepper.test.tsx
```

**Step 3: Implement the shared stepper and form sections**

- Replace the custom ordered-list button styling with `Stepper`.
- Group main, location, terms, media, and review controls in `FormSection`.
- Keep map and boundary domain validation untouched.
- Track dirty state after the initial form model and confirm route/window exit.
- Keep save/next/publish actions in one token-backed sticky bar.
- Scroll the first invalid control into view when progression is blocked.

**Step 4: Run all object workflow tests**

```bash
bun --bun vitest run src/features/admin-objects/object-editor.test.tsx src/features/admin-objects/location-picker.test.tsx src/features/admin-objects/lot-boundary-editor.test.tsx src/shared/ui/stepper.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/features/admin-objects frontend/src/shared/ui frontend/src/shared/i18n/messages.ts frontend/src/app/globals.css
git commit -m "feat: refine admin object editor ux"
```

### Task 7: Migrate administrator applications to responsive master-detail

**Files:**
- Modify: `frontend/src/features/admin-applications/admin-applications.tsx`
- Modify: `frontend/src/features/admin-applications/admin-applications.test.tsx`
- Modify: `frontend/src/shared/i18n/messages.ts`
- Modify: `frontend/src/app/globals.css`

**Step 1: Add failing interaction tests**

Test loading/empty/error states, status filtering, desktop selection, mobile
sheet detail, transition buttons, review-note persistence, and success/error
toasts.

**Step 2: Run and confirm failure**

```bash
bun --bun vitest run src/features/admin-applications/admin-applications.test.tsx
```

**Step 3: Implement the layout**

- Use `PageLayout`, `PageHeader`, `FilterToolbar`, `StatusBadge`, and `Sheet`.
- Keep the current desktop list/detail interaction.
- Render details in a sheet on mobile.
- Remove duplicated initial-load logic and use one abortable `load` function.
- Keep valid status transitions and backend error handling unchanged.

**Step 4: Run tests and commit**

```bash
bun --bun vitest run src/features/admin-applications/admin-applications.test.tsx
git add frontend/src/features/admin-applications frontend/src/shared/i18n/messages.ts frontend/src/app/globals.css
git commit -m "feat: improve admin application review ux"
```

### Task 8: Migrate investor overview

**Files:**
- Modify: `frontend/src/views/dashboard/investor-overview.tsx`
- Create: `frontend/src/views/dashboard/investor-overview.test.tsx`
- Modify: `frontend/src/entities/investment-object/object-card.tsx`
- Modify: `frontend/src/entities/investment-object/object-card.test.tsx`
- Modify: `frontend/src/app/globals.css`

**Step 1: Write failing overview tests**

Verify metric skeletons, partial request success, main map CTA, recent
applications, recommended objects, and empty-state actions.

**Step 2: Run and confirm failure**

```bash
bun --bun vitest run src/views/dashboard/investor-overview.test.tsx src/entities/investment-object/object-card.test.tsx
```

**Step 3: Implement the overview**

- Compose `PageHeader`, `StatCard`, shared panels, application rows, and object
  cards.
- Keep the investment guide visually secondary.
- Preserve partial data when one endpoint fails and show one warning toast.
- Use real object media with a stable fallback rather than type-color mock art.

**Step 4: Run tests and commit**

```bash
bun --bun vitest run src/views/dashboard/investor-overview.test.tsx src/entities/investment-object/object-card.test.tsx
git add frontend/src/views/dashboard frontend/src/entities/investment-object frontend/src/app/globals.css
git commit -m "feat: redesign investor dashboard overview"
```

### Task 9: Migrate investor projects, applications, and favorites

**Files:**
- Modify: `frontend/src/views/dashboard/investor-projects.tsx`
- Modify: `frontend/src/views/dashboard/investor-applications.tsx`
- Modify: `frontend/src/views/dashboard/investor-favorites.tsx`
- Create: `frontend/src/views/dashboard/investor-lists.test.tsx`
- Modify: `frontend/src/shared/i18n/messages.ts`
- Modify: `frontend/src/app/globals.css`

**Step 1: Add failing page tests**

Assert projects own a paginated request larger than the overview limit, filters
reset the page, application rows expose localized status/date, favorites can be
removed using existing behavior, and every page has loading/empty/error states.

**Step 2: Run and confirm failure**

```bash
bun --bun vitest run src/views/dashboard/investor-lists.test.tsx
```

**Step 3: Implement route-specific list pages**

- Projects use `PageHeader`, `FilterToolbar`, object grid, and
  `ServerPagination`.
- Applications use a compact responsive list and map CTA.
- Favorites use the shared object grid and map CTA.
- Do not reuse the overview's four-item project request.

**Step 4: Run tests and commit**

```bash
bun --bun vitest run src/views/dashboard/investor-lists.test.tsx
git add frontend/src/views/dashboard frontend/src/shared/i18n/messages.ts frontend/src/app/globals.css
git commit -m "feat: improve investor dashboard lists"
```

### Task 10: Make profile and settings honest and functional

**Files:**
- Modify: `frontend/src/views/dashboard/investor-profile.tsx`
- Modify: `frontend/src/views/dashboard/investor-settings.tsx`
- Create: `frontend/src/views/dashboard/investor-account-pages.test.tsx`
- Modify: `frontend/src/shared/i18n/messages.ts`
- Modify: `frontend/src/app/globals.css`

**Step 1: Write failing account-page tests**

Assert profile renders actual session data, no unsupported edit button is shown,
settings language control changes locale, profile row navigates correctly, and
no notification control appears without backend support.

**Step 2: Run and confirm failure**

```bash
bun --bun vitest run src/views/dashboard/investor-account-pages.test.tsx
```

**Step 3: Implement account pages**

- Use `PageLayout`, `PageHeader`, `Card`, and semantic list rows.
- Keep profile read-only until an update API exists.
- Use the shared shadcn locale selector.
- Use only valid support/profile destinations.
- Remove buttons that currently do nothing.

**Step 4: Run tests and commit**

```bash
bun --bun vitest run src/views/dashboard/investor-account-pages.test.tsx
git add frontend/src/views/dashboard frontend/src/shared/i18n/messages.ts frontend/src/app/globals.css
git commit -m "fix: make investor account pages functional"
```

### Task 11: Integrate the dashboard map workspace

**Files:**
- Modify: `frontend/src/views/dashboard/dashboard-map.tsx`
- Modify: `frontend/src/features/investment-map/map-page-client.tsx`
- Modify: `frontend/src/features/investment-map/map-page-client.test.tsx`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/e2e/mobile-map.spec.ts`

**Step 1: Add failing dashboard-map tests**

Verify dashboard workspace mode, mobile filter sheet, mobile result sheet,
visible map controls, loading placeholder dimensions, and filter-aware empty
results.

**Step 2: Run and confirm failure**

```bash
bun --bun vitest run src/features/investment-map/map-page-client.test.tsx
```

**Step 3: Implement workspace composition**

- Use `PageLayout workspace` around the map.
- Keep public compact/home behavior unchanged.
- Reuse the new shared `Sheet` for dashboard mobile filters/results.
- Keep map canvas dimensions stable through loading and selection changes.

**Step 4: Run focused unit and E2E tests**

```bash
bun --bun vitest run src/features/investment-map/map-page-client.test.tsx
E2E_API_READY=1 bunx playwright test e2e/mobile-map.spec.ts
```

Expected: PASS on desktop and mobile projects.

**Step 5: Commit**

```bash
git add frontend/src/views/dashboard/dashboard-map.tsx frontend/src/features/investment-map frontend/src/app/globals.css frontend/e2e/mobile-map.spec.ts
git commit -m "feat: integrate responsive dashboard map"
```

### Task 12: Add role-wide acceptance coverage and finish migration

**Files:**
- Create: `frontend/e2e/dashboard-role-pages.spec.ts`
- Create: `frontend/e2e/dashboard-role-pages.visual.spec.ts`
- Modify: `frontend/e2e/helpers/visual.ts` if shared screenshot helpers require new states
- Modify: `docs/design-system.md`
- Modify: `.agents/superpowers/specs/2026-10-03-dashboard-ui-ux-audit-design.md` only if implementation decisions materially changed

**Step 1: Add acceptance coverage**

For admin, cover overview, objects, create/edit, and applications. For investor,
cover overview, map, projects, applications, favorites, profile, and settings.
Each role must be tested at desktop and mobile viewport widths.

Key assertions:

```ts
await expect(page.locator("main")).toBeVisible();
await expect(page.locator("body")).toHaveJSProperty("scrollWidth", expectedViewportWidth);
await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
```

Also assert no dead buttons, dialogs/sheets trap and restore focus, and each
empty state has a useful next action.

**Step 2: Run role acceptance tests**

```bash
cd frontend
E2E_API_READY=1 bunx playwright test e2e/dashboard-role-pages.spec.ts e2e/dashboard-role-pages.visual.spec.ts
```

Expected: all admin/investor desktop and mobile projects pass.

**Step 3: Run the complete quality gate**

```bash
bun run lint
bun run test
bun run test:coverage
bun run build
E2E_API_READY=1 bunx playwright test e2e/dashboard-sidebar.spec.ts e2e/dashboard-role-pages.spec.ts e2e/mobile-map.spec.ts
git diff --check
```

Expected:

- Lint passes.
- All unit tests pass.
- Coverage does not regress from the current baseline.
- Production build succeeds.
- Role and map E2E tests pass on desktop and mobile.
- No whitespace errors.

**Step 4: Perform manual QA**

- Check Uzbek and Russian at 1440px, 1024px, 768px, and 390px.
- Keyboard-navigate sidebar, sheet, topbar menus, filters, tables, dialogs, and
  object editor.
- Confirm no horizontal viewport overflow.
- Confirm loading, empty, error, retry, and success states for every route.
- Confirm admin cannot submit investor applications and investor cannot open
  admin editors.

**Step 5: Update design-system documentation**

Document the new shared compositions, token ownership, responsive table/mobile
list rule, page header contract, and supported dashboard route patterns.

**Step 6: Commit**

```bash
git add frontend/e2e docs/design-system.md .agents/superpowers/specs/2026-10-03-dashboard-ui-ux-audit-design.md
git commit -m "test: verify role dashboard experience"
```

## Follow-Up: Public Page Audit

After this plan is complete, create a separate design and implementation plan
for `/uz`, `/ru`, public map, object detail, login, and registration pages. Reuse
the stabilized primitives and tokens, but preserve the more expressive public
brand presentation rather than applying dashboard density directly.
