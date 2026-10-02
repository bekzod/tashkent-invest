# Design System Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Add a Tailwind CSS and shadcn/ui foundation, then move transient
feedback to localized global toasts without changing business workflows.

**Architecture:** Tailwind semantic tokens are defined globally, shadcn
primitives live in `src/components/ui`, and product-level compositions live in
`src/shared/ui`. Features call a typed feedback adapter; validation stays inline.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
with Radix, Sonner, Vitest, Testing Library, Playwright.

---

### Task 1: Establish Tailwind and shadcn Configuration

**Files:**
- Create: `frontend/components.json`
- Create: `frontend/postcss.config.mjs`
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/src/lib/utils.test.ts`
- Modify: `frontend/package.json`
- Modify: `frontend/src/app/globals.css`

**Step 1: Write a failing `cn()` import and token smoke test.**

**Step 2: Run:** `cd frontend && bun --bun vitest run src/lib/utils.test.ts`

Expected: FAIL because the utility and Tailwind setup do not exist.

**Step 3: Implement:** Install Tailwind v4/PostCSS and initialize shadcn
non-interactively with Radix. Configure aliases and map semantic Tailwind tokens
to the existing brand colors. Do not remove existing layout CSS yet.

**Step 4: Verify:** rerun the focused test and `bun run lint`.

**Step 5: Commit:** `feat: establish Tailwind design tokens`.

### Task 2: Add shadcn Primitives

**Files:**
- Create: `frontend/src/components/ui/{button,input,textarea,checkbox,select,label,badge,skeleton,tooltip,dialog,sheet}.tsx`
- Test: `frontend/src/components/ui/*.test.tsx`

**Step 1: Write failing contracts for button variants, forwarded input props, and
decorative skeleton accessibility.**

**Step 2: Run:** `cd frontend && bun --bun vitest run src/components/ui`

Expected: FAIL until primitives are installed.

**Step 3: Implement:** add only these shadcn components through the CLI. Keep
component source in the repository and bind it to the semantic tokens.

**Step 4: Verify:** `bun --bun vitest run src/components/ui && bun run lint`.

**Step 5: Commit:** `feat: add shadcn UI primitives`.

### Task 3: Add the Global Toast Service

**Files:**
- Create: `frontend/src/components/ui/sonner.tsx`
- Create: `frontend/src/shared/ui/feedback.ts`
- Create: `frontend/src/shared/ui/feedback.test.ts`
- Modify: `frontend/src/app/layout.tsx`

**Step 1: Write failing tests for typed success/error/warning/info notifications.**

**Step 2: Run:** `cd frontend && bun --bun vitest run src/shared/ui/feedback.test.ts`

Expected: FAIL because the adapter does not exist.

**Step 3: Implement:** add Sonner, render one Toaster in the root layout, and
provide `notify` as the only feature-facing feedback API.

**Step 4: Verify:** run the unit test and mocked registration Playwright test.

**Step 5: Commit:** `feat: add global toast feedback`.

### Task 4: Migrate Authentication and Registration

**Files:**
- Modify/Test: `frontend/src/views/login.{tsx,test.tsx}`
- Modify/Test: `frontend/src/views/register.{tsx,test.tsx}`

**Step 1: Update tests to require `notify.error` for login failures and
`notify.success` for completed registration.**

**Step 2: Run:** `cd frontend && bun --bun vitest run src/views/login.test.tsx src/views/register.test.tsx`

Expected: FAIL until feedback is migrated.

**Step 3: Implement:** use Button/Input/Label/Checkbox primitives, remove
general transient form banners, retain accessible inline validation and safe
return behaviour.

**Step 4: Verify:** rerun focused tests and
`E2E_BASE_URL=http://127.0.0.1:3000 bunx playwright test e2e/investor-registration.spec.ts --project=desktop-chromium`.

**Step 5: Commit:** `refactor: migrate auth feedback to toasts`.

### Task 5: Migrate Application and Admin Mutation Feedback

**Files:**
- Modify/Test: `frontend/src/features/application/application-form.{tsx,test.tsx}`
- Modify/Test: `frontend/src/features/admin-applications/admin-applications.{tsx,test.tsx}`
- Modify/Test: `frontend/src/features/admin-objects/object-editor.{tsx,test.tsx}`

**Step 1: Write failing toast assertions for submit, duplicate, save, review,
approval, rejection, and request failure flows.**

**Step 2: Run focused feature tests and confirm failure.**

**Step 3: Implement:** replace general success/error panels with `notify`, but
keep input errors, disabled-submit behaviour, status history, and API mappings.

**Step 4: Verify:** focused Vitest suites; run `application-lifecycle` and
`admin-object-location` Playwright tests only against the isolated seeded DB.

**Step 5: Commit:** `refactor: centralize mutation feedback`.

### Task 6: Migrate Map and Dashboard Feedback

**Files:**
- Modify/Test: `frontend/src/features/investment-map/investment-map.tsx`
- Modify/Test: `frontend/src/features/investment-map/map-page-client.tsx`
- Modify/Test: `frontend/src/views/home.tsx`
- Modify/Test: `frontend/src/views/dashboard.tsx`

**Step 1: Write failing tests that request failures produce one toast while map
overlays, skeletons, and partial-data displays remain contextual.**

**Step 2: Run focused map/dashboard tests and confirm failure.**

**Step 3: Implement:** migrate actionable request errors and confirmations to
`notify`; retain progress UI in its current visual context.

**Step 4: Verify:** focused tests, then mobile map/home Playwright specs using
the isolated seeded API.

**Step 5: Commit:** `refactor: unify map and dashboard feedback`.

### Task 7: Enforce Boundaries and Complete Verification

**Files:**
- Modify: `frontend/eslint.config.*`
- Create/Test: `frontend/src/components/ui/design-system.test.tsx`
- Modify: `README.md`

**Step 1: Add a failing architectural import-boundary check.**

**Step 2: Implement:** document primitive ownership and prevent direct
cross-feature UI imports; shared UI is imported only from `components/ui` or
`shared/ui`.

**Step 3: Verify:**
`cd frontend && bun run lint && bun run test:coverage && bun run build`.

Also run localization, registration, and SEO browser tests. Run API-backed E2E
only with the disposable Docker/PostGIS setup in `docs/release-qa-checklist.md`.

**Step 4: Commit:** `docs: define UI architecture rules`.
