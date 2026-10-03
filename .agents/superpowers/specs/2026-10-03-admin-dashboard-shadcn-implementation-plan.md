# Admin Dashboard shadcn Migration Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Move every interactive admin-dashboard surface to reusable shadcn-style primitives without changing its routes or business behavior.

**Architecture:** Build missing primitives in `frontend/src/components/ui`, then replace hand-built controls in the dashboard shell, reusable admin list utilities, and admin feature screens. Feature components keep API state and translations; UI primitives own accessibility, keyboard behavior, variants, and focus styles.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Radix UI, CVA, Vitest, Testing Library, Playwright.

---

### Task 1: Add shadcn-style dashboard primitives

**Files:**
- Create: `frontend/src/components/ui/select.tsx`
- Create: `frontend/src/components/ui/dropdown-menu.tsx`
- Create: `frontend/src/components/ui/popover.tsx`
- Create: `frontend/src/components/ui/dialog.tsx`
- Create: `frontend/src/components/ui/card.tsx`
- Create: `frontend/src/components/ui/table.tsx`
- Create: `frontend/src/components/ui/separator.tsx`
- Modify: `frontend/package.json`
- Modify: `frontend/bun.lock`

**Step 1: Add the Radix packages required by the primitives.**

Run: `bun add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-separator`

**Step 2: Implement each primitive using `cn`, CVA where variants are needed, and the existing semantic design tokens.**

Use controlled and uncontrolled Radix APIs, expose standard shadcn exports, and keep a 44px minimum target for interactive triggers.

**Step 3: Add a compact primitive smoke test.**

Create `frontend/src/components/ui/dashboard-primitives.test.tsx` that verifies select keyboard labels, dropdown menu actions, dialog focusable actions, and table semantics.

**Step 4: Run the focused test.**

Run: `bun --bun vitest run src/components/ui/dashboard-primitives.test.tsx`

Expected: PASS.

**Step 5: Commit the primitive layer.**

```bash
git add frontend/package.json frontend/bun.lock frontend/src/components/ui
git commit -m "feat: add dashboard shadcn primitives"
```

### Task 2: Refactor the dashboard shell controls

**Files:**
- Modify: `frontend/src/widgets/dashboard-shell.tsx`
- Modify: `frontend/src/widgets/dashboard-shell.test.tsx`
- Modify: `frontend/src/app/globals.css`

**Step 1: Extend the shell test with locale, notification, and account-menu interactions.**

Cover opening the locale menu, changing locale, opening/closing notifications, keyboard Escape behavior, profile menu navigation, and logout.

**Step 2: Run the focused test to record current failures.**

Run: `bun --bun vitest run src/widgets/dashboard-shell.test.tsx`

**Step 3: Replace the native language select with `Select`, notification markup with `Popover`, and profile markup with `DropdownMenu`.**

Convert icon actions to `Button` with the `icon` size. Preserve current aria labels and localized text.

**Step 4: Remove only shell CSS made redundant by the new primitive interaction states.**

Keep desktop and collapsed/sidebar geometry intact.

**Step 5: Run focused tests and commit.**

```bash
bun --bun vitest run src/widgets/dashboard-shell.test.tsx
git add frontend/src/widgets/dashboard-shell.tsx frontend/src/widgets/dashboard-shell.test.tsx frontend/src/app/globals.css
git commit -m "refactor: use shadcn controls in dashboard shell"
```

### Task 3: Standardize shared admin table and pagination UI

**Files:**
- Create: `frontend/src/shared/ui/data-table.tsx`
- Create: `frontend/src/shared/ui/pagination.tsx`
- Modify: `frontend/src/shared/ui/list-table.tsx`
- Modify: `frontend/src/shared/ui/server-pagination.tsx`
- Add or modify tests adjacent to the shared components

**Step 1: Write tests for table loading, empty state, icon actions, page-size select, and disabled pagination controls.**

**Step 2: Run the shared UI tests and confirm they fail for the new public API.**

**Step 3: Compose shadcn `Card`, `Table`, `Select`, `Button`, and `Skeleton` into the shared utilities.**

Keep their present API stable where practical so admin consumers have minimal churn.

**Step 4: Run the shared UI tests and commit.**

```bash
bun --bun vitest run src/shared/ui
git add frontend/src/shared/ui
git commit -m "refactor: standardize admin data controls"
```

### Task 4: Migrate the object overview and object list

**Files:**
- Modify: `frontend/src/features/admin-objects/admin-overview.tsx`
- Modify: `frontend/src/features/admin-objects/admin-objects-list.tsx`
- Modify: `frontend/src/features/admin-objects/admin-objects-list.test.tsx` or create it
- Modify: `frontend/src/app/globals.css`

**Step 1: Add tests for the status select, search, archive confirmation, create action, and pagination.**

Mock `adminObjectsApi`; assert that archive requires confirmation before the API call.

**Step 2: Replace overview cards and actions with `Card` and `Button`; replace list filters with `Input` and `Select`.**

Use `Dialog` rather than `window.confirm` for archive confirmation. Use `Badge` for statuses and shared `DataTable`/`Pagination` for the list.

**Step 3: Run the focused admin object tests and commit.**

```bash
bun --bun vitest run src/features/admin-objects
git add frontend/src/features/admin-objects frontend/src/app/globals.css
git commit -m "refactor: migrate admin object management controls"
```

### Task 5: Migrate application review controls

**Files:**
- Modify: `frontend/src/features/admin-applications/admin-applications.tsx`
- Modify: `frontend/src/features/admin-applications/admin-applications.test.tsx`
- Modify: `frontend/src/app/globals.css`

**Step 1: Add failing tests for status filtering, application selection, review note input, approve/reject actions, and pagination button states.**

**Step 2: Replace native select, textarea, list buttons, status badges, and review actions with shared primitives.**

Use `Select`, `Textarea`, `Button`, `Card`, and `Badge`; preserve the current API transition behavior and Sonner feedback.

**Step 3: Run the focused test and commit.**

```bash
bun --bun vitest run src/features/admin-applications/admin-applications.test.tsx
git add frontend/src/features/admin-applications frontend/src/app/globals.css
git commit -m "refactor: migrate application review controls"
```

### Task 6: Migrate the object editor and map-adjacent controls

**Files:**
- Modify: `frontend/src/features/admin-objects/object-editor.tsx`
- Modify: `frontend/src/features/admin-objects/object-editor.test.tsx`
- Modify: `frontend/src/features/admin-objects/location-picker.tsx`
- Modify: `frontend/src/features/admin-objects/location-picker.test.tsx`
- Modify: `frontend/src/features/admin-objects/lot-boundary-editor.tsx`
- Modify: `frontend/src/features/admin-objects/lot-boundary-editor.test.tsx`
- Modify: `frontend/src/app/globals.css`

**Step 1: Expand focused tests for step navigation, form fields, type/status selects, location actions, boundary actions, and disabled save behavior.**

**Step 2: Replace each native input, select, textarea, checkbox, and action button with its primitive counterpart.**

Keep MapLibre canvas markup and its interaction model unchanged. Use `Card` for the form steps and map control groups where it improves hierarchy, not as nested decoration.

**Step 3: Run focused editor/map tests and commit.**

```bash
bun --bun vitest run src/features/admin-objects/object-editor.test.tsx src/features/admin-objects/location-picker.test.tsx src/features/admin-objects/lot-boundary-editor.test.tsx
git add frontend/src/features/admin-objects frontend/src/app/globals.css
git commit -m "refactor: migrate admin editor controls"
```

### Task 7: Verify all dashboard routes and responsive behavior

**Files:**
- Modify as needed: `frontend/e2e/dashboard*.spec.ts`
- Modify as needed: dashboard visual snapshots

**Step 1: Add or update browser coverage for `/dashboard`, `/dashboard/projects`, `/dashboard/applications`, and `/dashboard/projects/new`.**

Cover locale selection, profile and notification menus, filters, archive confirmation, application transitions, and the editor’s first step.

**Step 2: Run quality gates.**

```bash
cd frontend
bun run lint
bun run test
bun run build
bunx playwright test e2e/dashboard*.spec.ts
```

**Step 3: Perform manual browser QA at desktop and mobile widths.**

Verify no clipped controls, keyboard focus, dialog close behavior, and no remaining native select styles in admin dashboard surfaces.

**Step 4: Commit verification adjustments.**

```bash
git add frontend
git commit -m "test: cover dashboard shadcn migration"
```
