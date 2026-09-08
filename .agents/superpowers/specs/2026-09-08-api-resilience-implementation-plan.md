# API Resilience Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Restore all API calls with the current Render URL, make loading and failure states visible, and eliminate redundant map requests while exposing backend response time.

**Architecture:** A shared frontend API-base resolver normalizes host-only values to the backend's /api contract for browser and server-side requests. Home and map requests become explicit state machines: pending work renders skeletons, failure is actionable, and map viewport requests are debounced, aborted, and versioned. Fastify emits public API processing time through Server-Timing.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest + Testing Library, Fastify 5, Sequelize, Bun test.

---

### Task 1: Normalize the API base URL

**Files:**

- Create: frontend/src/shared/api/base-url.ts
- Create: frontend/src/shared/api/base-url.test.ts
- Modify: frontend/src/shared/api/client.ts
- Modify: frontend/src/shared/lib/seo.ts

**Step 1: Write the failing test**

    import { describe, expect, test } from 'vitest';
    import { resolveApiBaseUrl } from './base-url';

    describe('resolveApiBaseUrl', () => {
      test('adds /api to a host-only URL', () => {
        expect(resolveApiBaseUrl('https://backend.example.com'))
          .toBe('https://backend.example.com/api');
      });
      test('preserves /api and removes a trailing slash', () => {
        expect(resolveApiBaseUrl('https://backend.example.com/api/'))
          .toBe('https://backend.example.com/api');
      });
    });

**Step 2: Run it to verify failure**

Run: cd frontend && bunx vitest run src/shared/api/base-url.test.ts

Expected: FAIL because the module does not exist.

**Step 3: Implement the smallest resolver**

    const fallbackApiUrl = 'http://localhost:8080/api';

    export function resolveApiBaseUrl(
      value = process.env.NEXT_PUBLIC_API_URL || fallbackApiUrl,
    ) {
      const normalized = value.trim().replace(/\/+$/, '');
      return normalized.endsWith('/api') ? normalized : normalized + '/api';
    }

    export const apiBaseUrl = resolveApiBaseUrl();

Replace the duplicated API URL constants in client.ts and seo.ts with apiBaseUrl. Keep existing path concatenation, request headers, and caching policy unchanged.

**Step 4: Run the test**

Run: cd frontend && bunx vitest run src/shared/api/base-url.test.ts

Expected: PASS.

**Step 5: Commit**

    git add frontend/src/shared/api/base-url.ts frontend/src/shared/api/base-url.test.ts frontend/src/shared/api/client.ts frontend/src/shared/lib/seo.ts
    git commit -m "fix: normalize frontend API base URL"

### Task 2: Render landing-page loading and error states

**Files:**

- Create: frontend/src/views/home.test.tsx
- Modify: frontend/src/views/home.tsx
- Modify: frontend/src/app/globals.css near reference-card-grid

**Step 1: Write the failing component tests**

Mock the API client, next/navigation, next/link, and compact map. Render HomePage without initial data, leave its API promises pending, and assert four featured-object-skeleton elements are visible. Reject one request and assert a role=alert plus retry button. Resolve the retry and assert cards replace skeletons.

**Step 2: Run it to verify failure**

Run: cd frontend && bunx vitest run src/views/home.test.tsx

Expected: FAIL because HomePage renders an empty grid and swallows the request error.

**Step 3: Implement explicit request state**

Derive initial state from SSR props. Track loading, error, and retry counter. On locale or retry change, mark loading, clear error, issue the existing Promise.all requests, set results on success, set user-facing error on failure, and clear loading in finally. Retain the existing cleanup guard to prevent stale updates.

Render four content-shaped skeleton cards only when no objects are available. Retain prior cards during refresh. When there are neither cards nor data after failure, render an accessible retry control rather than a blank section. Add scoped pulse styles and a prefers-reduced-motion override.

**Step 4: Run the test**

Run: cd frontend && bunx vitest run src/views/home.test.tsx

Expected: PASS for pending, error, retry, and fulfilled states.

**Step 5: Commit**

    git add frontend/src/views/home.tsx frontend/src/views/home.test.tsx frontend/src/app/globals.css
    git commit -m "feat: show landing API loading states"

### Task 3: Coalesce map API refreshes

**Files:**

- Create: frontend/src/features/investment-map/map-request.ts
- Create: frontend/src/features/investment-map/map-request.test.ts
- Modify: frontend/src/features/investment-map/investment-map.tsx
- Modify: frontend/src/app/globals.css near map-results

**Step 1: Write failing coordinator tests**

Use fake timers and deferred promises. Verify that starting a second request aborts the first and only the newest request id is current. Verify a burst of move events invokes the loader once after 250 ms.

    const first = coordinator.begin();
    const second = coordinator.begin();
    expect(first.signal.aborted).toBe(true);
    expect(coordinator.isCurrent(second.id)).toBe(true);
    expect(coordinator.isCurrent(first.id)).toBe(false);

**Step 2: Run it to verify failure**

Run: cd frontend && bunx vitest run src/features/investment-map/map-request.test.ts

Expected: FAIL because the coordinator does not exist.

**Step 3: Implement latest-only map loading**

Create the framework-independent coordinator around AbortController and a monotonically increasing id. In InvestmentMap, pass the signal to api; only update GeoJSON and features for the current id; ignore AbortError; and retain a non-abort error for display. Clear loading only for the current id.

Dispatch filter and locale changes immediately. Debounce moveend by 250 ms, cancel an obsolete timer on each move, and clear it on unmount. Render a non-blocking aria-live map loading overlay. Preserve old markers during a refresh. On an initial request failure show a retry control instead of calling onFeatures with an empty array.

**Step 4: Run the test**

Run: cd frontend && bunx vitest run src/features/investment-map/map-request.test.ts

Expected: PASS for cancellation, stale-result protection, and debouncing.

**Step 5: Commit**

    git add frontend/src/features/investment-map/map-request.ts frontend/src/features/investment-map/map-request.test.ts frontend/src/features/investment-map/investment-map.tsx frontend/src/app/globals.css
    git commit -m "fix: coalesce map refresh requests"

### Task 4: Expose backend processing time

**Files:**

- Modify: backend/app.js
- Modify: backend/routes/__tests__/health.test.js

**Step 1: Write the failing test**

Add an app.inject test for GET /api/filters. Assert a server-timing response header matching app;dur=<non-negative number>. Assert GET /health does not receive that header.

**Step 2: Run it to verify failure**

Run: cd backend && NODE_ENV=test bun test --isolate routes/__tests__/health.test.js

Expected: FAIL because the application emits no Server-Timing header.

**Step 3: Implement Fastify timing hooks**

In app.js, use onRequest to store process.hrtime.bigint for /api/ requests. Use onSend to calculate milliseconds and set:

    reply.header('Server-Timing', 'app;dur=' + durationMs.toFixed(1));

Do not change response bodies, status codes, or caching. Health stays outside this timing scope.

**Step 4: Run the test**

Run: cd backend && NODE_ENV=test bun test --isolate routes/__tests__/health.test.js

Expected: PASS with existing health and CORS coverage.

**Step 5: Commit**

    git add backend/app.js backend/routes/__tests__/health.test.js
    git commit -m "feat: expose API processing timing"

### Task 5: Verify the completed change

**Files:**

- Modify only if a quality gate reveals a defect.

**Step 1: Run focused tests**

    cd frontend && bunx vitest run src/shared/api/base-url.test.ts src/views/home.test.tsx src/features/investment-map/map-request.test.ts
    cd ../backend && NODE_ENV=test bun test --isolate routes/__tests__/health.test.js

Expected: all focused tests PASS.

**Step 2: Run project gates**

    cd frontend && bun test && bun run lint && bun run build
    cd ../backend && npm test && npm run lint && npm run format:check

Expected: all commands exit 0. Coverage and mutation testing are not configured as CI gates; report that gap rather than adding new tooling.

**Step 3: Run deployment-style smoke checks**

Build the frontend with NEXT_PUBLIC_API_URL set to a host-only Render URL and verify generated browser requests end in /api/objects/map. In a browser, verify skeleton, forced-error retry, a single request per map-pan burst, and the Server-Timing header.

**Step 4: Commit any verification fixes**

    git add <files-fixed-during-verification>
    git commit -m "fix: address API resilience verification findings"

