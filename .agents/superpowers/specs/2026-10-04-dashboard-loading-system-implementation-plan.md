# Dashboard Loading System Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Replace plain and inconsistent dashboard loading states with an accessible, route-aware structural skeleton system.

**Architecture:** Add one shell-level loader and one composable page skeleton with route-specific presets. Keep the authenticated shell stable after session resolution and reuse the same presets in admin and investor data loaders.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui Skeleton, Vitest, Testing Library, Playwright.

---

### Task 1: Define route-aware loading presets

**Files:**
- Create: `frontend/src/shared/ui/dashboard-loading.tsx`
- Test: `frontend/src/shared/ui/dashboard-loading.test.tsx`

**Step 1: Write the failing component tests**

Test that the shell exposes a localized status, sets `aria-busy`, renders stable sidebar/topbar regions, and emits distinct markers for `overview`, `table`, `grid`, `form`, and `map` presets.

**Step 2: Run the focused test**

Run: `bun run test -- src/shared/ui/dashboard-loading.test.tsx`

Expected: FAIL because the loading components do not exist.

**Step 3: Implement the shared components**

Build `DashboardLoadingShell` and `DashboardPageSkeleton` from the existing `Skeleton` primitive. Use small internal components for heading, metrics, rows, cards, fields, and the map workspace.

**Step 4: Run the focused test**

Run: `bun run test -- src/shared/ui/dashboard-loading.test.tsx`

Expected: PASS.

### Task 2: Replace the route-level loading line

**Files:**
- Modify: `frontend/src/views/dashboard.tsx`
- Modify: `frontend/src/views/dashboard.test.tsx`

**Step 1: Add a failing loading-state test**

Mock an unresolved dashboard session and assert that the route renders the accessible loading shell with the preset matching `activeSection`.

**Step 2: Run the focused test**

Run: `bun run test -- src/views/dashboard.test.tsx`

Expected: FAIL because the view still renders plain text.

**Step 3: Map sections to presets**

Use `overview` for the root, `map` for the map, `table` for applications, and `grid` for projects/favorites. Profile and settings use `form`.

**Step 4: Run the focused test**

Run: `bun run test -- src/views/dashboard.test.tsx`

Expected: PASS.

### Task 3: Unify page-level loading states

**Files:**
- Modify: `frontend/src/features/admin-objects/admin-dashboard-guard.tsx`
- Modify: `frontend/src/app/dashboard/projects/[id]/edit/page.tsx`
- Modify: `frontend/src/features/admin-applications/admin-applications.tsx`
- Modify: `frontend/src/views/dashboard/investor-applications.tsx`
- Modify: `frontend/src/views/dashboard/object-grid.tsx`

**Step 1: Replace generic rectangles and repeated rows**

Use the appropriate shared preset for admin guard, object editor, application lists, and object grids. Preserve existing error and empty-state branches.

**Step 2: Run affected component tests**

Run: `bun run test -- src/features/admin-applications/admin-applications.test.tsx src/views/dashboard.test.tsx src/features/admin-objects/object-editor.test.tsx`

Expected: PASS.

### Task 4: Add reduced-motion and responsive polish

**Files:**
- Modify only if needed: `frontend/src/app/globals.css`
- Test: `frontend/e2e/dashboard-loading.spec.ts`

**Step 1: Add desktop and mobile assertions**

Delay session resolution in a deterministic test, assert that the loading shell fits the viewport, has no horizontal overflow, and retains the correct preset.

**Step 2: Add minimal CSS only when utilities cannot express the behavior**

Ensure skeleton pulse animation is disabled under reduced motion and mobile geometry follows the existing dashboard breakpoints. Do not alter unrelated pending styles in `globals.css`.

**Step 3: Run E2E**

Run: `bunx playwright test dashboard-loading.spec.ts`

Expected: PASS for desktop and mobile projects.

### Task 5: Run quality gates

**Files:**
- Verify all changed files.

**Step 1: Run unit tests**

Run: `bun run test`

Expected: all tests pass.

**Step 2: Run coverage**

Run: `bun run test:coverage`

Expected: coverage command passes without reducing relevant component coverage.

**Step 3: Run lint and build**

Run: `bun run lint`

Run: `bun run build`

Expected: both commands pass.

**Step 4: Review the final diff**

Run: `git diff --check`

Expected: no whitespace errors and no unrelated changes included.
