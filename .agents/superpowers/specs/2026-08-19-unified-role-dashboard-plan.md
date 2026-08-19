# Unified Role Dashboard Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Render investor and admin workspaces in one Yukon CRM-style dashboard shell, with navigation and route access determined by `session.user.role`.

**Architecture:** Extract the visual shell and role-aware navigation from the investor dashboard into reusable dashboard UI. All authenticated pages use `/dashboard/*`; the session role determines which navigation and content render at the same URL. Admin object CRUD uses `/dashboard/projects`, `/dashboard/projects/new`, and `/dashboard/projects/[id]/edit`.

**Tech Stack:** Next.js App Router, React, TypeScript, Lucide icons, Vitest, Playwright.

---

### Task 1: Define role-aware dashboard navigation

**Files:**
- Modify: `frontend/src/widgets/dashboard-nav.ts`
- Create: `frontend/src/widgets/dashboard-nav.test.ts`

**Step 1: Write the failing test**

```ts
it('returns only investor navigation for investors and management navigation for admins', () => {
  expect(getDashboardNavigation('investor').map((entry) => entry.href)).toContain('/dashboard/map');
  expect(getDashboardNavigation('admin').map((entry) => entry.href)).toEqual(['/admin', '/admin/objects']);
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test -- src/widgets/dashboard-nav.test.ts`

Expected: FAIL because `getDashboardNavigation` does not exist.

**Step 3: Write minimal implementation**

- Add `DashboardRole` and a role-specific navigation map.
- Add `getDashboardNavigation(role)` and role-specific primary action configuration.
- Preserve the existing investor entries and add the admin overview/object entries.

**Step 4: Run test to verify it passes**

Run: `bun run test -- src/widgets/dashboard-nav.test.ts`

Expected: PASS.

### Task 2: Extract a shared dashboard shell

**Files:**
- Create: `frontend/src/widgets/dashboard-shell.tsx`
- Modify: `frontend/src/views/dashboard.tsx`
- Create: `frontend/src/features/admin-objects/admin-dashboard-guard.tsx`
- Delete: `frontend/src/features/admin-objects/admin-guard.tsx`
- Delete: `frontend/src/features/admin-objects/admin-shell.tsx`

**Step 1: Write the failing test**

Add a component test that renders `DashboardShell` with an admin session and asserts the common `.invest-dashboard` root plus `Obyektlar` navigation is present; repeat for an investor session and assert investor routes are present while admin routes are absent.

**Step 2: Run test to verify it fails**

Run: `bun run test -- src/widgets/dashboard-shell.test.tsx`

Expected: FAIL because the shared shell does not exist.

**Step 3: Write minimal implementation**

- Move shared sidebar, topbar, account menu, collapse handling, and breadcrumb rendering into `DashboardShell`.
- Accept `role`, active navigation item, breadcrumb label, optional primary action and `children`.
- Make `DashboardView` render its current investor content inside the new shell.
- Make `AdminDashboardGuard` render `DashboardShell` for authenticated admins; it must not import `AdminShell`.
- Send an investor requesting an admin-only CRUD URL back to `/dashboard`.

**Step 4: Run focused tests**

Run: `bun run test -- src/widgets/dashboard-shell.test.tsx src/widgets/dashboard-nav.test.ts`

Expected: PASS.

### Task 3: Move admin routes to the shared shell

**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx`
- Modify: `frontend/src/app/dashboard/projects/page.tsx`
- Create: `frontend/src/app/dashboard/projects/new/page.tsx`
- Create: `frontend/src/app/dashboard/projects/[id]/edit/page.tsx`
- Delete: `frontend/src/app/admin/`
- Modify: `frontend/src/features/admin-objects/admin-overview.tsx`
- Modify: `frontend/src/features/admin-objects/admin-objects-list.tsx`
- Modify: `frontend/src/features/admin-objects/object-editor.tsx`

**Step 1: Write the failing E2E assertion**

Update `frontend/e2e/admin-object-crud.spec.ts` to assert the admin root is `.invest-dashboard`, uses the standard sidebar class, has `Obyektlar` and `Yangi obyekt`, and does not include `.admin-shell`.

**Step 2: Run E2E test to verify it fails**

Run: `E2E_API_READY=1 bun run test:e2e -- e2e/admin-object-crud.spec.ts`

Expected: FAIL while the dark admin shell is still present.

**Step 3: Write minimal implementation**

- Give each admin route its active shared-navigation item and breadcrumb through the common shell.
- Render investor or admin content at the same `/dashboard` and `/dashboard/projects` URLs from the session role.
- Ensure admin create action points to `/dashboard/projects/new`.
- Remove duplicate page title/description chrome if the shared breadcrumb already represents the page context.

**Step 4: Run E2E test to verify it passes**

Run: `E2E_API_READY=1 bun run test:e2e -- e2e/admin-object-crud.spec.ts`

Expected: PASS.

### Task 4: Remove obsolete admin-only styles

**Files:**
- Modify: `frontend/src/app/globals.css`

**Step 1: Verify unused selectors**

Run: `rg -n 'admin-shell|admin-sidebar|admin-brand|admin-stage|admin-loading' frontend/src`

Expected: only obsolete CSS selector definitions remain after Task 2/3.

**Step 2: Remove implementation**

- Delete `.admin-shell`, `.admin-sidebar`, `.admin-*` structural CSS.
- Reuse only the existing dashboard class system for admin pages.
- Keep content-level admin form/table styles that are not shell styling.

**Step 3: Run lint and production build**

Run: `bun run lint && bun run build`

Expected: PASS.

### Task 5: Validate role isolation and all flows

**Files:**
- Modify: `frontend/e2e/admin-object-crud.spec.ts`
- Modify: `frontend/e2e/investor-journey.spec.ts` only if selectors changed

**Step 1: Run full test suite**

Run: `bun run test && E2E_API_READY=1 bun run test:e2e`

Expected: all unit and browser tests PASS.

**Step 2: Check browser output**

Run: `bunx playwright screenshot --viewport-size='1440,1000' http://localhost:3000/admin /tmp/admin-dashboard.png`

Expected: admin page has the same light Yukon CRM dashboard hierarchy as investor dashboard, with only role-appropriate navigation.
