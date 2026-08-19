# Admin Investment Objects Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Build a role-protected desktop admin workspace for drafting, mapping,
publishing, editing, and archiving investment objects, including URL-based media
and a first 360° panorama viewer.

**Architecture:** Extend the Postgres domain with admin access, workflow statuses,
and optional object geometry. Add a transactional Fastify admin resource and an
admin-only Next.js dashboard that reuses the current map and dashboard visual
system. Media URLs stay in `object_media`; a client-only panorama viewer renders
the `virtual_tour` record.

**Tech Stack:** Next.js 16 / React 19 / TypeScript, Fastify 5, Sequelize 6,
PostgreSQL, MapLibre GL, Pannellum, Bun, Vitest, Playwright.

---

### Task 1: Model the admin role and object lifecycle

**Files:**
- Create: `backend/db/migrations/202608190004-add-admin-object-workflow.js`
- Modify: `backend/db/models/user.js`
- Modify: `backend/db/models/investment-object.js`
- Modify: `backend/db/seed.js`
- Test: `backend/services/__tests__/admin-object-validation.test.js`

**Step 1: Write failing tests** for `draft`, `archived`, and normalized geometry
and status validation.

**Step 2: Run** `bun test services/__tests__/admin-object-validation.test.js`.
Expected: FAIL because the normalizer does not exist.

**Step 3: Add migration** that creates `admin` in the `users_role` enum, adds
`draft` and `archived` to the object status enum, and adds nullable `geometry`
JSONB. Update Sequelize models and seed `admin@demo.uz / admin2026`.

**Step 4: Re-run focused test**, then `bun run db:migrate` against local Postgres.

**Step 5: Commit** model and migration changes.

### Task 2: Add admin authorization and payload validation

**Files:**
- Modify: `backend/middleware/ensure-auth.js`
- Create: `backend/services/admin-object-payload.js`
- Test: `backend/services/__tests__/admin-object-payload.test.js`

**Step 1: Write failing tests** for draft tolerance, publish-required fields,
coordinate bounds, polygon closure, safe HTTPS media URLs, and media limits.

**Step 2: Run** `bun test services/__tests__/admin-object-payload.test.js`.
Expected: FAIL because the module is absent.

**Step 3: Implement** `ensureAuth('admin')` and a small payload normalizer.
Require title, cadastral, district, type, coordinates, investment amount, area,
and a sector only for publish; drafts may omit these fields.

**Step 4: Run** the focused test and `bun run lint`.

**Step 5: Commit** authorization and validation.

### Task 3: Build transactional admin object APIs

**Files:**
- Create: `backend/routes/api/admin-objects.js`
- Modify: `backend/routes/api/index.js`
- Modify: `backend/routes/api/objects.js`
- Test: `backend/routes/__tests__/admin-objects.test.js`

**Step 1: Write failing API tests** for 401 without token, 403 for investor,
admin draft create, publish, update, list, and archive. Include a public-list
assertion that draft/archived objects are not returned.

**Step 2: Run** `bun test routes/__tests__/admin-objects.test.js`.
Expected: FAIL because routes do not exist.

**Step 3: Implement** `/api/admin/objects` list/create and
`/api/admin/objects/:id` read/update/archive routes. Persist object, Uzbek/Russian
translations, and media inside a Sequelize transaction.

**Step 4: Update public queries** so only `available`, `auction`, and `upcoming`
are public.

**Step 5: Run** backend lint, tests, coverage, formatting, and migration.

### Task 4: Add shared admin types and API client

**Files:**
- Create: `frontend/src/entities/admin-investment-object/types.ts`
- Create: `frontend/src/features/admin-objects/api.ts`
- Test: `frontend/src/features/admin-objects/api.test.ts`

**Step 1: Write failing tests** for payload serialization, especially decimal
fields, translations, map geometry, and media rows.

**Step 2: Run** `bun run test -- src/features/admin-objects/api.test.ts`.
Expected: FAIL because the API client is absent.

**Step 3: Implement** typed admin API requests using the existing authenticated
API client and locale header.

**Step 4: Run** focused frontend test and lint.

### Task 5: Create the admin shell and inventory route

**Files:**
- Create: `frontend/src/app/admin/layout.tsx`
- Create: `frontend/src/app/admin/page.tsx`
- Create: `frontend/src/app/admin/objects/page.tsx`
- Create: `frontend/src/features/admin-objects/admin-objects-list.tsx`
- Modify: `frontend/src/app/globals.css`
- Test: `frontend/src/features/admin-objects/admin-objects-list.test.tsx`

**Step 1: Write failing tests** for unauthenticated redirect, investor rejection,
admin list rendering, and status/type/search filters.

**Step 2: Run** the focused Vitest test. Expected: FAIL.

**Step 3: Implement** a Yukon-inspired desktop shell with breadcrumb, compact
sidebar, page actions, dense table, status badges, and clear empty/error states.
Do not introduce a mobile-specific design.

**Step 4: Run** tests, lint, and a browser screenshot at 1440px width.

### Task 6: Implement the five-step object form

**Files:**
- Create: `frontend/src/app/admin/objects/new/page.tsx`
- Create: `frontend/src/app/admin/objects/[id]/edit/page.tsx`
- Create: `frontend/src/features/admin-objects/object-editor.tsx`
- Create: `frontend/src/features/admin-objects/object-location-step.tsx`
- Create: `frontend/src/features/admin-objects/object-media-step.tsx`
- Test: `frontend/src/features/admin-objects/object-editor.test.tsx`
- Modify: `frontend/src/app/globals.css`

**Step 1: Write failing tests** for step navigation, inline publish validation,
draft save, review summary, and map coordinate selection.

**Step 2: Run** focused tests. Expected: FAIL.

**Step 3: Implement** five labelled sections with a persistent progress state.
Reuse MapLibre to set a point / polygon. Keep the primary CTA fixed and disable
publish only when the review reports missing required fields.

**Step 4: Run** tests, lint, and manual desktop keyboard navigation check.

### Task 7: Add media preview and 360° panorama display

**Files:**
- Create: `frontend/src/features/virtual-tour/panorama-viewer.tsx`
- Modify: `frontend/src/views/object-detail.tsx`
- Modify: `frontend/src/features/admin-objects/object-media-step.tsx`
- Test: `frontend/src/features/virtual-tour/panorama-viewer.test.tsx`
- Modify: `frontend/package.json`

**Step 1: Write failing tests** for non-HTTPS URL rejection, one tour limit, and
client-only viewer fallback.

**Step 2: Install** the smallest maintained panorama dependency only after tests
state the needed interface; use Pannellum unless the package fails the test or
Next.js client-only constraints.

**Step 3: Implement** URL preview cards, image/document/video links, and a
dynamic panorama viewer for `virtual_tour`. Offer an accessible fallback link.

**Step 4: Run** frontend test/build and verify a sample equirectangular URL.

### Task 8: End-to-end QA and documentation

**Files:**
- Create: `frontend/tests/e2e/admin-object-crud.spec.ts`
- Modify: `README.md` or `backend/.env.example` only if admin credentials/config
  need documenting

**Step 1: Add e2e flow**: admin login, draft save, map placement, media URL,
publish, public map visibility, archive, public map exclusion.

**Step 2: Run** `bun run test:e2e`, `bun run test:coverage`, backend coverage,
lint, format, and production frontend build.

**Step 3: Manually inspect** the 1440px admin create/edit screen for hierarchy,
focus states, labels, error messages, and non-destructive archive confirmation.

**Step 4: Commit** final implementation and document any unavailable upload or
notification-provider integrations.
