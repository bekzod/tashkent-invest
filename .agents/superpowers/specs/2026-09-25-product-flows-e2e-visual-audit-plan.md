# Product Flows E2E and Visual Verification Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Make tasks 2–9 business-complete and verify each independently with focused tests, seeded end-to-end flows, and deterministic desktop/mobile visual checks.

**Architecture:** Each numbered product requirement is owned by a separate subagent and lands as an isolated commit. Shared foundations use typed domain helpers and stable API error codes; a single seeded Docker stack and deterministic Playwright fixtures exercise the integrated flows. Dynamic map tiles, timestamps, and remote media are replaced or masked only in visual tests, while functional assertions inspect actual state and API persistence.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, MapLibre GL JS, Fastify, Sequelize/PostgreSQL/PostGIS, Bun/Vitest, Playwright Chromium, OpenSEO.

---

### Task 0: Establish deterministic acceptance and visual-test infrastructure

**Files:**
- Modify: `frontend/playwright.config.ts`
- Create: `frontend/e2e/fixtures/test-data.ts`
- Create: `frontend/e2e/fixtures/map-tile.svg`
- Create: `frontend/e2e/helpers/visual.ts`
- Modify: `docker-compose.yml`
- Modify: `README.md`

**Step 1: Add a failing Playwright configuration test or config assertion**

Assert desktop Chromium and mobile Chromium (`390x844`, touch, reduced motion) are defined, screenshots are retained on failure, and dynamic animations are disabled through a helper.

**Step 2: Add deterministic fixtures**

Create fixed users, one available land object, one upcoming object, one auction object, and one stable local tile asset. Provide safe cleanup scoped only to `e2e-*` records.

**Step 3: Install and verify Chromium**

Run:

```bash
cd frontend
bunx playwright install chromium
bunx playwright test --list
```

Expected: both desktop and mobile projects list tests without a missing executable.

**Step 4: Commit**

```bash
git add frontend/playwright.config.ts frontend/e2e docker-compose.yml README.md
git commit -m "test: add deterministic e2e visual infrastructure"
```

---

### Task 3: Complete Uzbek/Russian localization end-to-end

**Files:**
- Modify: `frontend/src/features/admin-objects/object-editor.tsx`
- Modify: `frontend/src/shared/i18n/language-provider.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/dashboard/layout.tsx`
- Modify: `frontend/src/shared/lib/dashboard.ts`
- Modify: `frontend/src/views/dashboard.tsx`
- Modify: `frontend/src/views/profile.tsx`
- Modify: `frontend/src/shared/i18n/messages.ts`
- Modify: `backend/services/investment-object-query.js`
- Modify: `backend/services/investment-object-presenter.js`
- Modify: `backend/routes/api/objects.js`
- Modify: `backend/db/seed.js`
- Create: `frontend/e2e/localization.spec.ts`
- Create: `frontend/e2e/localization.visual.spec.ts`

**Step 1: Write failing focused tests**

Cover full Russian admin translation fields, locale-aware search independent of translation order, locale cookie SSR, stale-request suppression, Russian plural forms, localized units, 404/error copy, and JSON-LD language.

**Step 2: Implement the locale contract**

Persist locale in a server-readable cookie and local storage; prefix public URLs while leaving private routes unprefixed. Add complete Uzbek/Russian translation inputs. Search all relevant translations or explicitly search the requested locale. Abort or sequence locale-dependent requests.

**Step 3: Run focused and full checks**

```bash
cd backend
bun test services/__tests__/investment-object-query.test.js services/__tests__/admin-object-payload.test.js
cd ../frontend
bun run test -- src/shared/i18n src/views src/features/admin-objects
bun run lint
bun run build
```

**Step 4: Run localized E2E and visual checks**

Verify `/uz` and `/ru` across home, map, object detail, login, dashboard, admin editor, and 404 at `1440x900` and `390x844`. Mask only tiles and remote photos.

**Step 5: Commit**

```bash
git commit -am "fix: complete Uzbek and Russian business flows"
```

---

### Task 8: Implement investor registration and safe return-to flow

**Files:**
- Modify: `backend/routes/api/auth.js`
- Modify: `backend/db/models/user.js`
- Create: `backend/services/registration.js`
- Create: `backend/services/__tests__/registration.test.js`
- Create: `backend/routes/__tests__/auth.test.js`
- Create: `backend/db/migrations/202609250001-add-investor-registration.js`
- Create: `frontend/src/app/[locale]/register/page.tsx`
- Create: `frontend/src/views/register.tsx`
- Create: `frontend/src/views/register.test.tsx`
- Create: `frontend/src/shared/auth/return-to.ts`
- Create: `frontend/src/shared/auth/return-to.test.ts`
- Modify: `frontend/src/views/login.tsx`
- Modify: `frontend/src/widgets/public-header.tsx`
- Modify: `frontend/src/shared/api/client.ts`
- Modify: `frontend/src/shared/i18n/messages.ts`
- Create: `frontend/e2e/investor-registration.spec.ts`
- Create: `frontend/e2e/investor-registration.visual.spec.ts`

**Step 1: Write failing registration and security tests**

Cover trimmed/lowercased email, case-insensitive uniqueness, name/password boundaries, mandatory policy consent, forced investor role, duplicate `409 ACCOUNT_EXISTS`, password hashing, safe internal `returnTo`, double-submit prevention, and localized errors.

**Step 2: Add database and API boundaries**

Add consent timestamp/version/locale and case-insensitive email uniqueness. Registration always creates an investor and never accepts a role. Return stable error codes without database messages. Add reasonable login/register throttling using the repository's lightest compatible mechanism.

**Step 3: Add localized registration UX**

Create `/uz/register` and `/ru/register`, reciprocal Login/Register links, a real mobile menu button, field-level validation, accessible status/error regions, and safe return to the selected public object. Remove public demo passwords from production UI; keep development-only hints behind an environment check.

**Step 4: Verify**

Run backend tests, frontend focused tests, lint/build, then desktop/mobile E2E snapshots for empty, validation, duplicate, success, and first dashboard state.

**Step 5: Commit**

```bash
git commit -am "feat: add secure investor registration"
```

---

### Task 4: Make admin map location picking reliable

**Files:**
- Modify: `frontend/src/features/admin-objects/location-picker.tsx`
- Modify: `frontend/src/features/admin-objects/object-editor.tsx`
- Modify: `frontend/src/features/admin-objects/types.ts`
- Create: `frontend/src/features/admin-objects/location-validation.ts`
- Create: `frontend/src/features/admin-objects/location-validation.test.ts`
- Create: `frontend/src/features/admin-objects/location-picker.test.tsx`
- Modify: `backend/services/admin-object-payload.js`
- Modify: `backend/services/__tests__/admin-object-payload.test.js`
- Modify: `frontend/src/app/globals.css`
- Create: `frontend/e2e/admin-object-location.spec.ts`
- Create: `frontend/e2e/admin-object-location.visual.spec.ts`

**Step 1: Write failing parsing/lifecycle tests**

Blank values produce no marker; valid coordinates do not recreate the map on parent rerender; click/drag updates once; out-of-range or outside-district values show localized errors; both coordinates are required together.

**Step 2: Stabilize the picker**

Use callback refs, a reusable draggable marker, the canonical Toshkent district center/boundary, environment tile URL, loading/error/status UI, clear/reset/current-location controls, reduced-motion-safe movement, and 44px controls.

**Step 3: Align backend validation**

Use coordinate-specific finite/range parsing, allow explicit clearing, and reject a publish outside the configured district. Moving the point must clear or invalidate stale lot geometry.

**Step 4: Verify persistence and visuals**

Save/reload coordinates, test keyboard and mocked geolocation, assert no mobile horizontal overflow, and snapshot empty/selected/error states on desktop/mobile.

**Step 5: Commit**

```bash
git commit -am "fix: make object location picking reliable"
```

---

### Task 2: Implement truthful lot-boundary drawing and display

**Files:**
- Modify: `frontend/src/features/admin-objects/types.ts`
- Create: `frontend/src/features/admin-objects/lot-boundary-editor.tsx`
- Create: `frontend/src/features/admin-objects/lot-boundary-editor.test.tsx`
- Modify: `frontend/src/features/admin-objects/object-editor.tsx`
- Modify: `frontend/src/features/investment-map/investment-map.tsx`
- Modify: `frontend/src/features/investment-map/map-utils.ts`
- Modify: `frontend/src/features/investment-map/map-utils.test.ts`
- Modify: `backend/services/admin-object-payload.js`
- Modify: `backend/utils/geo.js`
- Create: `backend/db/migrations/202609250002-add-geometry-provenance.js`
- Modify: `backend/db/models/investment-object.js`
- Modify: `backend/db/sync-osm-footprints.js`
- Create: `frontend/e2e/lot-boundary.spec.ts`
- Create: `frontend/e2e/lot-boundary.visual.spec.ts`

**Step 1: Write failing geometry-domain tests**

Reject open, zero-area, repeated-only, self-intersecting, out-of-range, oversized and point-outside polygons. Accept a valid concave closed ring. Define and test Polygon-only behavior explicitly.

**Step 2: Add truthful provenance**

Store `surveyed`, `cadastral`, `admin_drawn`, `estimated`, or `demo`. Never expose nearest OSM building geometry as an exact lot boundary. Estimated outlines are visibly dashed/labeled or omitted.

**Step 3: Build the admin editor**

Use click-to-add vertices with Close, Undo, Clear and Cancel; show vertex count and calculated area; preserve edit/reload state. Add localized instructions, keyboard fallback, live status, and 44px controls.

**Step 4: Render public boundaries safely**

Create polygon fill/line sources for valid real boundaries, selected emphasis, defensive bounds, and safe tooltip DOM using `textContent` rather than `setHTML`.

**Step 5: Verify E2E and visuals**

Admin draws/saves/reloads/edits/publishes a known polygon; public map renders and selects it; invalid polygon never calls save. Verify desktop, mobile touch/keyboard and snapshots.

**Step 6: Commit**

```bash
git commit -am "feat: add verified lot boundary workflow"
```

---

### Task 5: Make the full map usable on mobile

**Files:**
- Modify: `frontend/src/features/investment-map/map-page-client.tsx`
- Modify: `frontend/src/features/investment-map/investment-map.tsx`
- Modify: `frontend/src/entities/investment-object/object-card.tsx`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/playwright.config.ts`
- Create: `frontend/e2e/mobile-map.spec.ts`
- Create: `frontend/e2e/mobile-map.visual.spec.ts`

**Step 1: Write failing responsive acceptance tests**

At `390x844`, at least half of the map intersects the initial viewport, no horizontal overflow exists, controls are 44px, result count does not create an unbounded page, and an object can be selected by touch and keyboard.

**Step 2: Implement mobile-first layout**

Place the map before a collapsed filter drawer, use a bounded bottom sheet/paginated list, enable cooperative gestures, translate MapLibre control labels, and make result cards keyboard-operable.

**Step 3: Implement pointer-safe drawing**

Replace mouse-only handlers with pointer capture and explicit cancel/finish behavior. Verify pointer-up outside the map cannot leave drawing mode stuck.

**Step 4: Verify**

Test filtering, selection, drawing, orientation change, scrolling, and map resize on the mobile Playwright project. Snapshot initial, filtered and selected states.

**Step 5: Commit**

```bash
git commit -am "fix: make investment map usable on mobile"
```

---

### Task 6: Complete the map discovery flow on the main page

**Files:**
- Modify: `frontend/src/views/home.tsx`
- Modify: `frontend/src/views/home.test.tsx`
- Modify: `frontend/src/features/investment-map/map-page-client.tsx`
- Modify: `frontend/src/features/investment-map/map-utils.ts`
- Modify: `frontend/src/app/[locale]/map/page.tsx`
- Modify: `backend/services/investment-object-query.js`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/e2e/landing-layout.spec.ts`
- Create: `frontend/e2e/home-map.visual.spec.ts`

**Step 1: Extract and test landing-filter serialization**

Search, types, status, sector and area range must all reach the localized map URL. Clear resets every filter. Russian search matches Russian translations regardless of association ordering.

**Step 2: Synchronize the compact map**

Feed the same filters to the embedded map. A marker click must open an accessible compact preview with localized Details CTA or navigate directly to the localized object. Add meaningful loading/error/retry fallback.

**Step 3: Repair responsive layout and payload**

On mobile, stack a dedicated map block of at least 280px above collapsible filters without overlay. Limit/deterministically order preview features server-side rather than downloading everything to sample client-side.

**Step 4: Verify E2E and visuals**

Assert filters affect both map request and target URL, clear-all works, marker-to-detail works, API retry works, and no mobile overlap exists. Snapshot UZ desktop, RU tablet, mobile, selected and error states.

**Step 5: Commit**

```bash
git commit -am "fix: complete landing map discovery flow"
```

---

### Task 7: Complete the lot application lifecycle

**Files:**
- Modify: `backend/routes/api/investor-actions.js`
- Modify: `backend/db/models/application.js`
- Create: `backend/services/application-workflow.js`
- Create: `backend/services/__tests__/application-workflow.test.js`
- Create: `backend/routes/__tests__/applications.test.js`
- Create: `backend/db/migrations/202609250003-complete-application-workflow.js`
- Modify: `frontend/src/features/application/application-form.tsx`
- Create: `frontend/src/features/application/application-form.test.tsx`
- Modify: `frontend/src/views/object-detail.tsx`
- Modify: `frontend/src/views/dashboard.tsx`
- Modify: `frontend/src/widgets/dashboard-nav.ts`
- Modify: `frontend/src/shared/lib/dashboard.ts`
- Modify: `frontend/src/shared/i18n/messages.ts`
- Modify: `frontend/e2e/investor-journey.spec.ts`
- Create: `frontend/e2e/application-workflow.visual.spec.ts`

**Step 1: Write failing workflow tests**

Only an active investor may apply to an `available` object. A user/object pair has one active application. Validate UUID, email, phone, lengths and amount. Stable codes distinguish duplicate, ineligible, validation and expired-session cases.

**Step 2: Add persistence and state transitions**

Enforce a unique constraint and idempotent concurrent creation. Implement `received -> in_review -> approved|rejected`, reviewer/timestamp/note and paginated investor/admin list/detail/update endpoints with authorization.

**Step 3: Complete frontend flows**

Guest CTA preserves safe return-to; registration/login returns to the lot. Prefill session fields, add field errors and accessible pending/success receipt, disable duplicate submission, map all statuses, and add admin application inbox/review UI.

**Step 4: Verify E2E and visuals**

Available lot succeeds once; double click creates one row; upcoming/auction/draft/archived are blocked; investor isolation holds; admin reviews and investor sees localized status. Snapshot guest, form, errors, submitting, receipt, investor list and admin inbox on desktop/mobile.

**Step 5: Commit**

```bash
git commit -am "feat: complete investor application workflow"
```

---

### Task 9: Finish localized technical SEO and live-discovery surfaces

**Files:**
- Continue: `frontend/src/shared/ui/social-card.test.tsx`
- Create: `frontend/src/shared/ui/social-card.tsx`
- Create: localized Open Graph image routes, icon and manifest
- Create: `frontend/src/shared/lib/structured-data.ts`
- Modify: backend presenter and frontend SEO fetching for truthful `updatedAt`
- Replace: `frontend/src/app/sitemap.ts` with sitemap index and per-language XML route handlers
- Modify: `frontend/src/app/robots.ts`
- Create: `frontend/src/app/llms.txt/route.ts`
- Create/modify: SEO focused tests and `frontend/e2e/seo-discovery.spec.ts`
- Modify: `README.md`
- Create: `docs/seo-release-checklist.md`
- Modify: `backend/Dockerfile`
- Modify: `backend/db/seed.js`
- Create: `backend/db/seed-e2e.js`

**Step 1: Resume the approved SEO implementation plan**

Continue Tasks 6–12 of `2026-09-25-localized-seo-implementation.md`. Preserve already committed locale routing/navigation/metadata work.

**Step 2: Separate production inventory from demo fixtures**

Stop unconditional demo seeding during production startup. Move numbered mock objects, Picsum images and example documents into an explicit local/E2E seed. Only verified publishable records with truthful source/media/status/update information may be indexable or included in sitemaps. Add regression coverage proving production startup cannot create demo inventory.

**Step 3: Incorporate OpenSEO crawl findings**

Eliminate the wrong `invest-tuman.uz` canonical, thin route shells, missing H1s, incomplete first-page sitemap and production 404s for `/uz`, `/ru`, locale sitemaps, manifest and `llms.txt`.

**Step 4: Verify locally and through Playwright**

Check redirects, canonical/hreflang, JSON-LD, social image content type/dimensions, sitemap index and all object URLs, robots/AI crawler rules, `llms.txt`, manifest, H1/title/description, UZ/RU desktop/mobile cards.

**Step 5: Run OpenSEO follow-up crawl after deployment is available**

Document that rankings, AI citations and social preview selection are external outcomes, not guarantees. Save the OpenSEO report and release checklist.

**Step 6: Commit**

```bash
git commit -am "feat: complete localized SEO discovery"
```

---

### Task 10: Cross-feature release verification

**Files:**
- Modify: `docs/seo-release-checklist.md`
- Create: `docs/product-release-checklist.md`

**Step 1: Run all quality gates**

```bash
cd backend
bun run lint
bun run format:check
bun run test:coverage
cd ../frontend
bun run lint
bun run test:coverage
bun run build
E2E_API_READY=1 bun run test:e2e
```

**Step 2: Perform visual review with `agent-browser`**

Check meaningful content, no framework overlay, no console errors, key interactions, desktop/mobile screenshots, focus order, and localized routes. Compare Playwright snapshots without updating baselines.

**Step 3: Inspect final repository state**

```bash
git diff --check
git status --short
git log --oneline --decorate -20
```

**Step 4: Commit release documentation**

```bash
git add docs README.md
git commit -m "docs: add product release verification checklist"
```
