# Tashkent Invest MVP Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Build a bilingual mock-data investment portal for Tashkent with a functional OpenStreetMap/MapLibre map, protected mock investor actions, and a Yukon-style backend.

**Architecture:** `frontend/` is a Next.js 16 TypeScript client that consumes `backend/` through HTTP. `backend/` is a Bun/Fastify/Sequelize service backed by PostgreSQL; migrations and seed data define all demo content. Map requests return GeoJSON filtered by viewport, filters, and an optional polygon.

**Tech Stack:** Bun 1.3, Fastify 5, Sequelize 6, PostgreSQL/PostGIS, Next.js 16, React 19, TypeScript, Tailwind 4, MapLibre GL JS, Vitest, Playwright, Docker Compose.

---

### Task 1: Establish the workspace and runtime contract

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `docker-compose.yml`
- Create: `frontend/package.json`
- Create: `frontend/.env.example`
- Create: `backend/package.json`
- Create: `backend/.env.example`

**Step 1: Define root environment and service contracts**

Document the three local URLs and make every value configurable:

```dotenv
# frontend/.env.example
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# backend/.env.example
PORT=8080
DATABASE_URL=postgres://tashkent_invest:tashkent_invest@postgres:5432/tashkent_invest
JWT_SECRET=replace-for-local-development
FRONT_HOST_NAME=http://localhost:3000
```

**Step 2: Create Compose services**

Configure `postgres` with PostGIS, `backend`, and `frontend`; expose ports `5432`, `8080`, and `3000`; depend on a PostgreSQL healthcheck. Do not use anonymous data volumes.

**Step 3: Add script contract**

Use Bun in both applications. The frontend scripts must include `dev`, `build`, `start`, `lint`, `test`, `test:coverage`, and `test:e2e`; the backend scripts must include `start`, `test`, `test:coverage`, `lint`, `format:check`, `db:migrate`, and `db:seed`.

**Step 4: Verify the initial project shape**

Run: `find frontend backend -maxdepth 1 -type f | sort`

Expected: both independent application manifests and example environment files are present.

**Step 5: Commit**

```bash
git add README.md .gitignore docker-compose.yml frontend/package.json frontend/.env.example backend/package.json backend/.env.example
git commit -m "chore: scaffold invest portal services"
```

### Task 2: Build the Yukon-style Fastify application foundation

**Files:**
- Create: `backend/app.js`
- Create: `backend/bin/www`
- Create: `backend/utils/async-handler.js`
- Create: `backend/utils/fastify-router.js`
- Create: `backend/routes/index.js`
- Create: `backend/routes/api/index.js`
- Create: `backend/routes/health.js`
- Create: `backend/test/fastify-test-app.js`
- Test: `backend/routes/__tests__/health.test.js`

**Step 1: Write the failing health-route test**

```js
const { test, expect } = require('bun:test');
const buildApp = require('../../app');

test('GET /health returns a ready payload', async () => {
  const app = await buildApp({ logger: false });
  const response = await app.inject({ method: 'GET', url: '/health' });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ status: 'ok' });
  await app.close();
});
```

**Step 2: Run the focused test and verify it fails**

Run: `cd backend && bun test routes/__tests__/health.test.js`

Expected: FAIL because the Fastify application does not exist yet.

**Step 3: Implement the smallest app shell**

Create an async `buildApp(options)` that registers CORS for `FRONT_HOST_NAME`, JSON parsing, `/health`, and `routes/index.js`; have `bin/www` call `listen({ host: '0.0.0.0', port })`. Use Yukon’s `createRouter` / async route-wrapper pattern rather than Express middleware.

**Step 4: Run the focused test**

Run: `cd backend && bun test routes/__tests__/health.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add backend
git commit -m "feat(api): add Fastify service foundation"
```

### Task 3: Add database configuration, migrations, models, and deterministic demo seed data

**Files:**
- Create: `backend/db/config.js`
- Create: `backend/db/models/index.js`
- Create: `backend/db/models/user.js`
- Create: `backend/db/models/investment-object.js`
- Create: `backend/db/models/investment-object-translation.js`
- Create: `backend/db/models/object-media.js`
- Create: `backend/db/models/application.js`
- Create: `backend/db/models/favorite.js`
- Create: `backend/db/models/notification-subscription.js`
- Create: `backend/db/migrations/202608190001-create-investment-domain.js`
- Create: `backend/db/seeders/202608190001-seed-investment-demo.js`
- Test: `backend/db/__tests__/investment-domain.test.js`

**Step 1: Write a failing model/seed test**

Assert that the seed creates a mock investor, at least 20 objects, both `uz` and `ru` translations for every object, and every required type/status appears at least once.

```js
expect(await InvestmentObject.count()).toBeGreaterThanOrEqual(20);
expect(await User.findOne({ where: { email: 'investor@demo.uz' } })).not.toBeNull();
```

**Step 2: Run the test and verify it fails**

Run: `cd backend && bun test db/__tests__/investment-domain.test.js`

Expected: FAIL because models and seed data are absent.

**Step 3: Create migration and models**

Use UUID primary keys, underscored database columns, timestamps, unique object slugs, and decimal numeric fields for money/areas. Store coordinates as `latitude`/`longitude`; store communications, legal/construction conditions, permitted businesses, and benefits as JSONB. Add a `locale` unique pair `(investment_object_id, locale)` in translations. Create `applications`, `favorites`, and notification records with foreign keys and uniqueness where appropriate.

**Step 4: Add the seed data**

Seed 20--30 named Tashkent locations in the valid city bounding area with all five marker states, types, sectors, districts, media placeholders, a working mock auction URL, and bcrypt/argon2-hashed login credentials. Keep object data deterministic; do not fetch external services during seeds.

**Step 5: Re-run migration and test**

Run: `cd backend && bun run db:migrate && bun run db:seed && bun test db/__tests__/investment-domain.test.js`

Expected: PASS.

**Step 6: Commit**

```bash
git add backend/db
git commit -m "feat(data): add investment object demo domain"
```

### Task 4: Implement public catalog, filters, statistics, and map GeoJSON API

**Files:**
- Create: `backend/routes/api/objects.js`
- Create: `backend/routes/api/statistics.js`
- Create: `backend/routes/api/filters.js`
- Create: `backend/services/investment-object-query.js`
- Create: `backend/services/investment-object-presenter.js`
- Create: `backend/utils/geo.js`
- Modify: `backend/routes/api/index.js`
- Test: `backend/routes/api/__tests__/objects.test.js`
- Test: `backend/routes/api/__tests__/map-objects.test.js`

**Step 1: Write map-query tests before implementation**

Cover the public list, language fallback, `bbox`, a valid GeoJSON polygon, type/status/sector filters, and invalid geometry.

```js
const response = await app.inject({
  method: 'GET',
  url: '/api/objects/map?bbox=69.1,41.2,69.4,41.4&types=land&lang=ru',
});
expect(response.statusCode).toBe(200);
expect(response.json().type).toBe('FeatureCollection');
expect(response.json().features.every((feature) => feature.properties.type === 'land')).toBe(true);
```

**Step 2: Run tests and verify failure**

Run: `cd backend && bun test routes/api/__tests__/objects.test.js routes/api/__tests__/map-objects.test.js`

Expected: FAIL because public routes are absent.

**Step 3: Implement parsing, filtering, and presentation**

Only permit recognised enums and finite numeric ranges. Parse `bbox` as `[minLng,minLat,maxLng,maxLat]`; reject invalid order. Validate the polygon feature/geometry structure, close it when necessary, and use a server-side point-in-polygon helper for demo data. Return `FeatureCollection` from `/objects/map`; return paginated cards from `/objects`; return a localized full detail object from `/objects/:slug`.

Implement `GET /statistics` from the database and `GET /filters` from fixed supported values plus seeded ranges. Always fall back to Uzbek translations when the requested language is absent.

**Step 4: Run focused tests**

Run: `cd backend && bun test routes/api/__tests__/objects.test.js routes/api/__tests__/map-objects.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/routes/api backend/services backend/utils
git commit -m "feat(api): add public investment catalog and map data"
```

### Task 5: Add mock JWT authentication and investor mutations

**Files:**
- Create: `backend/middleware/ensure-auth.js`
- Create: `backend/routes/api/auth.js`
- Create: `backend/routes/api/applications.js`
- Create: `backend/routes/api/favorites.js`
- Create: `backend/routes/api/notification-subscriptions.js`
- Create: `backend/routes/api/me.js`
- Modify: `backend/routes/api/index.js`
- Test: `backend/routes/api/__tests__/auth.test.js`
- Test: `backend/routes/api/__tests__/investor-actions.test.js`

**Step 1: Write authentication and ownership tests**

Test valid and invalid seeded credentials, `GET /auth/me`, anonymous mutation rejection, application creation, duplicate-safe favourite creation/deletion, and application list ownership.

```js
expect(login.statusCode).toBe(200);
expect(login.json()).toMatchObject({ token: expect.any(String), user: { email: 'investor@demo.uz' } });
expect(anonymousApplication.statusCode).toBe(401);
```

**Step 2: Run focused tests and verify failure**

Run: `cd backend && bun test routes/api/__tests__/auth.test.js routes/api/__tests__/investor-actions.test.js`

Expected: FAIL because auth and mutation routes are missing.

**Step 3: Implement minimal secure demo behavior**

Issue an expiring JWT with the user UUID after password verification. `ensure-auth` must read only a bearer token and attach the verified user. Require `objectId`, `name`, `phone`, and `email` for an application; permit an optional comment. Store notification intent but do not queue/send a notification. Return `401`, `404`, and `409` consistently.

**Step 4: Run focused tests**

Run: `cd backend && bun test routes/api/__tests__/auth.test.js routes/api/__tests__/investor-actions.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/middleware backend/routes/api
git commit -m "feat(api): add mock investor authentication and actions"
```

### Task 6: Bootstrap the Next.js frontend foundation and local-storage localization

**Files:**
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/globals.css`
- Create: `frontend/src/app/providers.tsx`
- Create: `frontend/src/shared/i18n/config.ts`
- Create: `frontend/src/shared/i18n/messages/uz.ts`
- Create: `frontend/src/shared/i18n/messages/ru.ts`
- Create: `frontend/src/shared/i18n/language-provider.tsx`
- Create: `frontend/src/shared/i18n/use-translation.ts`
- Create: `frontend/src/features/change-language/ui/language-switcher.tsx`
- Test: `frontend/src/shared/i18n/language-provider.test.tsx`

**Step 1: Write the failing persistence test**

```tsx
it('loads and persists a selected Russian language', () => {
  window.localStorage.setItem('tashkent-invest.locale', 'ru');
  render(<LanguageProvider><LanguageProbe /></LanguageProvider>);
  expect(screen.getByTestId('locale')).toHaveTextContent('ru');
});
```

**Step 2: Run the test and verify failure**

Run: `cd frontend && bun test src/shared/i18n/language-provider.test.tsx`

Expected: FAIL because the provider does not exist.

**Step 3: Implement client language state**

Use `uz` as the SSR/default value. On mount, safely read `tashkent-invest.locale`, accept only `uz` or `ru`, and persist user selection. Supply `locale`, `setLocale`, and `t(key)` through context. Do not add `[locale]` routes or `lang` URL parameters.

**Step 4: Run the focused test**

Run: `cd frontend && bun test src/shared/i18n/language-provider.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend
git commit -m "feat(frontend): add Next application and local language state"
```

### Task 7: Add typed API, mock session, and shared object UI primitives

**Files:**
- Create: `frontend/src/shared/api/client.ts`
- Create: `frontend/src/entities/investment-object/model/types.ts`
- Create: `frontend/src/entities/investment-object/api/objects-api.ts`
- Create: `frontend/src/entities/auth/model/session.ts`
- Create: `frontend/src/entities/auth/api/auth-api.ts`
- Create: `frontend/src/shared/ui/object-status-badge.tsx`
- Create: `frontend/src/entities/investment-object/ui/object-card.tsx`
- Test: `frontend/src/shared/api/client.test.ts`
- Test: `frontend/src/entities/auth/model/session.test.ts`
- Test: `frontend/src/entities/investment-object/ui/object-card.test.tsx`

**Step 1: Write failing API/session tests**

Verify the language header/query is set, a bearer token is attached to protected requests, and a `401` clears the stored session. Test that a card has the correct localized marker-status label.

**Step 2: Run tests and verify failure**

Run: `cd frontend && bun test src/shared/api/client.test.ts src/entities/auth/model/session.test.ts src/entities/investment-object/ui/object-card.test.tsx`

Expected: FAIL because client and entities are absent.

**Step 3: Implement shared transport**

Use a single fetch wrapper. Include `Accept-Language` from the language provider and `Authorization: Bearer <token>` only when a session exists. Store only the demo session payload in localStorage; on `401`, clear it and expose a typed unauthenticated state. Keep endpoint response types aligned with backend presenters.

**Step 4: Run focused tests**

Run: `cd frontend && bun test src/shared/api/client.test.ts src/entities/auth/model/session.test.ts src/entities/investment-object/ui/object-card.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/shared frontend/src/entities
git commit -m "feat(frontend): add API session and object primitives"
```

### Task 8: Implement the MapLibre map, freehand draw, and filter state

**Files:**
- Create: `frontend/src/features/investment-map/model/map-filters.ts`
- Create: `frontend/src/features/investment-map/model/geometry.ts`
- Create: `frontend/src/features/investment-map/api/map-api.ts`
- Create: `frontend/src/features/investment-map/ui/investment-map.tsx`
- Create: `frontend/src/features/investment-map/ui/map-controls.tsx`
- Create: `frontend/src/features/investment-map/ui/map-preview-popup.tsx`
- Create: `frontend/src/features/investment-map/ui/map-filter-panel.tsx`
- Create: `frontend/src/features/investment-map/ui/map-results-panel.tsx`
- Test: `frontend/src/features/investment-map/model/geometry.test.ts`
- Test: `frontend/src/features/investment-map/model/map-filters.test.ts`

**Step 1: Write geometry and query tests**

Test conversion of a map viewport to `bbox`, polygon closure, clear behavior, and URL query serialization for multiple selected filter values.

```ts
expect(toBboxQuery([[69.1, 41.2], [69.4, 41.5]])).toBe('69.1,41.2,69.4,41.5');
expect(closePolygon([[69.2, 41.3], [69.3, 41.3], [69.3, 41.4]])).toHaveLength(4);
```

**Step 2: Run focused tests and verify failure**

Run: `cd frontend && bun test src/features/investment-map/model/geometry.test.ts src/features/investment-map/model/map-filters.test.ts`

Expected: FAIL because map helpers are absent.

**Step 3: Implement map behavior**

Render MapLibre only in a client component. Read `NEXT_PUBLIC_MAP_TILE_URL`; centre on Tashkent. Register GeoJSON marker and cluster sources/layers. Debounce viewport events, request `/objects/map`, and update the source. Implement marker hover popup and click selection synchronized with the result panel.

Implement a custom pointer-drag draw mode: collect `lngLat` points while pressed, sample enough points to avoid excess payload, close the ring on release, render it as a fill/line source, and request results with the GeoJSON polygon. Provide explicit draw, clear, zoom, and geolocate controls. On touch, use vertex-based drawing if freehand pointer events are unavailable. Never issue requests after component unmount.

**Step 4: Run focused tests**

Run: `cd frontend && bun test src/features/investment-map/model/geometry.test.ts src/features/investment-map/model/map-filters.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/features/investment-map
git commit -m "feat(map): add OpenStreetMap object discovery map"
```

### Task 9: Build public pages and object detail

**Files:**
- Create: `frontend/src/widgets/public-header/ui/public-header.tsx`
- Create: `frontend/src/widgets/landing/landing-page.tsx`
- Create: `frontend/src/app/map/page.tsx`
- Create: `frontend/src/app/objects/[slug]/page.tsx`
- Create: `frontend/src/views/object-detail/object-detail-page.tsx`
- Create: `frontend/src/views/object-detail/object-facts.tsx`
- Create: `frontend/src/features/application/ui/application-form.tsx`
- Create: `frontend/src/features/favorite/ui/favorite-button.tsx`
- Test: `frontend/src/views/object-detail/object-detail-page.test.tsx`
- Test: `frontend/src/features/application/ui/application-form.test.tsx`

**Step 1: Write failing detail/form tests**

Assert that an object page renders every required fact group, that an active-auction card renders its external link, that a signed-out application prompts for login, and that a signed-in valid form calls `POST /applications`.

**Step 2: Run tests and verify failure**

Run: `cd frontend && bun test src/views/object-detail/object-detail-page.test.tsx src/features/application/ui/application-form.test.tsx`

Expected: FAIL because pages and actions are absent.

**Step 3: Implement pages**

Build the landing layout from reusable cards and map preview, not from screenshot-specific positioning. Object detail must show identity/location/cadastre, media placeholders, dimensions, utilities, legal and building parameters, permitted business, investment conditions, jobs, benefits, authority terms, and documents. The upcoming auction CTA opens the protected application form; active auctions use a safe external link.

**Step 4: Run focused tests**

Run: `cd frontend && bun test src/views/object-detail/object-detail-page.test.tsx src/features/application/ui/application-form.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app frontend/src/widgets frontend/src/views frontend/src/features/application frontend/src/features/favorite
git commit -m "feat(frontend): add investor discovery and object pages"
```

### Task 10: Build login and investor profile flows

**Files:**
- Create: `frontend/src/app/login/page.tsx`
- Create: `frontend/src/app/profile/page.tsx`
- Create: `frontend/src/features/login/ui/login-form.tsx`
- Create: `frontend/src/views/profile/profile-page.tsx`
- Create: `frontend/src/entities/application/api/applications-api.ts`
- Test: `frontend/src/features/login/ui/login-form.test.tsx`
- Test: `frontend/src/views/profile/profile-page.test.tsx`

**Step 1: Write failing user-flow unit tests**

Test a successful login persists the returned session and redirects to the requested protected route; test failed credentials display a localized error; test profile renders applications and favourites from authenticated API data.

**Step 2: Run tests and verify failure**

Run: `cd frontend && bun test src/features/login/ui/login-form.test.tsx src/views/profile/profile-page.test.tsx`

Expected: FAIL because login/profile are absent.

**Step 3: Implement the mock auth UX**

Use no hard-coded frontend credentials. Submit credentials to the API, persist only its response, show the seed demo credentials in an explicitly labelled development hint, and protect mutation/profile UI. Clear session on logout. Ensure a `401` returns the user to `/login` after clearing session.

**Step 4: Run focused tests**

Run: `cd frontend && bun test src/features/login/ui/login-form.test.tsx src/views/profile/profile-page.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/login frontend/src/app/profile frontend/src/features/login frontend/src/views/profile frontend/src/entities/application
git commit -m "feat(frontend): add mock investor login and profile"
```

### Task 11: Add end-to-end coverage and accessibility/error states

**Files:**
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/investor-journey.spec.ts`
- Create: `frontend/e2e/map-filtering.spec.ts`
- Modify: `frontend/src/features/investment-map/ui/investment-map.tsx`
- Modify: `frontend/src/features/application/ui/application-form.tsx`
- Test: `frontend/e2e/investor-journey.spec.ts`

**Step 1: Write the investor journey**

Implement the following Playwright scenario:

```ts
test('investor can sign in, inspect an object, and submit an application', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('investor@demo.uz');
  await page.getByLabel(/password/i).fill(process.env.E2E_DEMO_PASSWORD!);
  await page.getByRole('button', { name: /sign in|kirish/i }).click();
  await page.goto('/map');
  await page.getByTestId('map-result-card').first().click();
  await page.getByRole('button', { name: /interest|qiziqish/i }).click();
  await page.getByRole('button', { name: /submit|yuborish/i }).click();
  await expect(page.getByText(/received|qabul qilindi/i)).toBeVisible();
});
```

**Step 2: Run it and verify it fails**

Run: `cd frontend && bun run test:e2e -- e2e/investor-journey.spec.ts`

Expected: FAIL until the frontend/backend local test services and selectors exist.

**Step 3: Add stable selectors and states**

Use semantic labels first and `data-testid` only for dynamic MapLibre/result elements. Add loading, empty, unavailable-map, and mutation-error states with retry buttons. Ensure controls have keyboard labels and sufficient colour-independent status text.

**Step 4: Run e2e tests**

Run: `cd frontend && bun run test:e2e`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/e2e frontend/src
git commit -m "test: cover investor and map discovery journeys"
```

### Task 12: Run the full quality gates and document operating instructions

**Files:**
- Modify: `README.md`
- Modify: `frontend/README.md`
- Modify: `backend/README.md`

**Step 1: Document local development**

Describe environment setup, migrations/seeds, demo login source, OSM tile configuration, service URLs, every check command, and clear separation of mock-only behavior from production requirements.

**Step 2: Run backend quality gates**

Run:

```bash
cd backend
bun run lint
bun run format:check
bun run test:coverage
```

Expected: all commands exit `0`.

**Step 3: Run frontend quality gates**

Run:

```bash
cd frontend
bun run lint
bun run test:coverage
bun run build
bun run test:e2e
```

Expected: all commands exit `0`.

**Step 4: Run Compose smoke test**

Run:

```bash
docker compose up --build -d
curl --fail http://localhost:8080/health
curl --fail 'http://localhost:8080/api/objects/map?bbox=69.1,41.2,69.4,41.4'
docker compose down
```

Expected: health returns `{\"status\":\"ok\"}` and map returns a GeoJSON FeatureCollection.

**Step 5: Commit**

```bash
git add README.md frontend/README.md backend/README.md
git commit -m "docs: add local operation and verification guide"
```
