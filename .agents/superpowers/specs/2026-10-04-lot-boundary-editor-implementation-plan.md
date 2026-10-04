# Lot Boundary Editor Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Make lot-boundary drawing reliable, clear, and usable with a mouse or touch while preserving the existing GeoJSON and backend validation contract.

**Architecture:** Keep LotBoundaryEditor as the MapLibre lifecycle owner, extract deterministic draft-geometry operations into a small helper, and make map focus reactive to current form coordinates. Render the district, object marker, draft line/fill, and numbered draggable vertices as named MapLibre layers. Use existing shadcn-style primitives and the existing Dialog primitive for destructive confirmation.

**Tech Stack:** Next.js 16, React 19, TypeScript, MapLibre GL, Tailwind CSS 4, Radix Dialog, Vitest, React Testing Library, Playwright.

---

### Task 1: Make location points and draft geometry deterministic

**Files:**
- Create: frontend/src/features/admin-objects/lot-boundary-draft.ts
- Create: frontend/src/features/admin-objects/lot-boundary-draft.test.ts
- Modify: frontend/src/features/admin-objects/lot-boundary-editor.tsx:54-87

**Step 1: Write the failing test**

Cover these contracts: empty latitude or longitude produces undefined; a valid pair produces [longitude, latitude]; one vertex produces a Point, two vertices produce a LineString, and three or more produce a closed Polygon. Also test append, replace, and remove-last operations.

~~~ts
expect(parseLocationPoint("", "")).toBeUndefined();
expect(parseLocationPoint("41.4", "69.2")).toEqual([69.2, 41.4]);
expect(buildBoundaryDraft([[69.2, 41.4]])).toMatchObject({
  features: [{ properties: { index: 1 }, geometry: { type: "Point" } }],
});
~~~

**Step 2: Run the test and verify it fails**

Run: cd frontend && bunx vitest run src/features/admin-objects/lot-boundary-draft.test.ts

Expected: FAIL because the helper module does not exist.

**Step 3: Implement the minimal helper**

Export a Vertex tuple, parseLocationPoint, buildBoundaryDraft, appendVertex, replaceVertex, and removeLastVertex. Parsing must reject blank strings before number conversion, reject non-finite values, and enforce valid latitude and longitude ranges. Keep polygon validation in shared/lib/lot-boundary.ts so rules are not duplicated.

**Step 4: Run the focused test**

Run: cd frontend && bunx vitest run src/features/admin-objects/lot-boundary-draft.test.ts

Expected: PASS.

**Step 5: Commit**

~~~bash
git add frontend/src/features/admin-objects/lot-boundary-draft.ts frontend/src/features/admin-objects/lot-boundary-draft.test.ts frontend/src/features/admin-objects/lot-boundary-editor.tsx
git commit -m "fix: make lot boundary coordinates explicit"
~~~

### Task 2: Repair MapLibre lifecycle and reactive focus

**Files:**
- Modify: frontend/src/features/admin-objects/lot-boundary-editor.tsx:89-213
- Modify: frontend/src/features/admin-objects/lot-boundary-editor.test.tsx:6-84
- Modify: frontend/src/shared/i18n/messages.ts:335-364,717-746

**Step 1: Write failing editor tests**

Extend the MapLibre mock with easeTo, jumpTo, addSource, addLayer, and event handlers. Assert that empty inputs initialise at TASHKENT_DISTRICT_CENTER with zoom 10, valid inputs initialise at the object point, rerendering with valid coordinates updates focus, an error before load shows a retryable map error, and retry creates a new map instance.

**Step 2: Run the focused test**

Run: cd frontend && bunx vitest run src/features/admin-objects/lot-boundary-editor.test.tsx

Expected: FAIL because the current editor captures initial coordinates, interprets blank strings as zero, and has no map error state.

**Step 3: Implement map state**

Add mapStatus with loading, ready, and error values plus a retry key. Build the map from parseLocationPoint and use the district centre when no valid point exists. Add sources/layers in this order:

1. lot-boundary-district fill and line after the areas request resolves.
2. lot-boundary-object-location as a visible marker made with two circle layers.
3. lot-boundary-draft fill, line, vertex circle, and vertex-number symbol layers.

React to latitude/longitude prop changes by updating the marker and using reduced-motion-safe jumpTo or easeTo. Register error before map load. Show a loading overlay, a retryable in-map error, and a non-blocking warning if district data is unavailable.

**Step 4: Add translations**

Add Uzbek and Russian messages for loading, map unavailable, retry, drawing progress, object marker, precise coordinates, vertex adjustment, and clear confirmation.

**Step 5: Verify and commit**

Run: cd frontend && bunx vitest run src/features/admin-objects/lot-boundary-editor.test.tsx

Run: cd frontend && bun run lint

Expected: PASS.

~~~bash
git add frontend/src/features/admin-objects/lot-boundary-editor.tsx frontend/src/features/admin-objects/lot-boundary-editor.test.tsx frontend/src/shared/i18n/messages.ts
git commit -m "fix: show reliable lot boundary map states"
~~~

### Task 3: Implement guided drawing and safe editing actions

**Files:**
- Modify: frontend/src/features/admin-objects/lot-boundary-editor.tsx:215-345
- Modify: frontend/src/features/admin-objects/lot-boundary-editor.test.tsx
- Modify: frontend/src/components/ui/dialog.tsx only if an existing export is missing

**Step 1: Write failing interaction tests**

Test the visible progress after drawing starts, map-click vertex insertion, vertex movement, coordinate insertion moving the map, cancel restoring saved geometry, and clear requiring confirmation.

~~~ts
fireEvent.click(screen.getByRole("button", { name: /chegarani chizish/i }));
expect(screen.getByText(/1.*3.*nuqta/i)).toBeVisible();

act(() => map.handlers.click({ lngLat: { lng: 69.2, lat: 41.4 } }));
expect(screen.getByText(/nuqtalar soni:/i)).toHaveTextContent("1");
~~~

**Step 2: Run the focused test**

Run: cd frontend && bunx vitest run src/features/admin-objects/lot-boundary-editor.test.tsx

Expected: FAIL because no guided progress, drag behaviour, or confirmation exists.

**Step 3: Implement interaction contract**

When idle, show one primary start button. When drawing, show a compact map overlay with progress and the next action. Click or tap adds vertices; one shows a point, two a line, and three a live polygon. Query the vertex layer on pointer/touch start, suspend pan during movement, replace that vertex on movement, and restore pan/cursor on end. Finish remains disabled until three points and retains server-compatible validation.

Use ActionIconButton for undo/cancel only with accessible labels and tooltips. Use a Dialog confirmation before clearing draft or persisted geometry. Place precise longitude/latitude entry in a concise disclosure during drawing. Adding a coordinate clears inputs, updates layers, and moves the map to that point. Cancel restores the saved boundary exactly.

**Step 4: Verify and commit**

Run: cd frontend && bunx vitest run src/features/admin-objects/lot-boundary-editor.test.tsx src/features/admin-objects/lot-boundary-draft.test.ts

Expected: PASS.

~~~bash
git add frontend/src/features/admin-objects/lot-boundary-editor.tsx frontend/src/features/admin-objects/lot-boundary-editor.test.tsx frontend/src/components/ui/dialog.tsx
git commit -m "feat: guide admin lot boundary drawing"
~~~

### Task 4: Polish desktop and mobile visual system

**Files:**
- Modify: frontend/src/app/globals.css:6051-6491
- Modify: frontend/src/features/admin-objects/lot-boundary-editor.tsx
- Modify: frontend/e2e/lot-boundary.visual.spec.ts
- Update: frontend/e2e/__screenshots__/ through Playwright snapshot review

**Step 1: Add visual assertions**

Capture idle, one-point, ready-polygon, and mobile states. Assert no horizontal overflow and minimum 44px targets on mobile.

**Step 2: Establish expected failures**

Run: cd frontend && E2E_API_READY=1 bunx playwright test e2e/lot-boundary.visual.spec.ts --project=desktop-chromium --project=mobile-chromium

Expected: visual test needs new snapshots or fails before CSS is updated.

**Step 3: Implement CSS**

Use a bounded map surface, layered loading/error/progress overlays, and compact controls. Use existing tokens, blue only for primary actions, red only for destructive clear, and no decorative gradients. Ensure controls do not cover attribution. Maintain an adequate map height and touch targets on mobile.

**Step 4: Verify and commit**

Run: cd frontend && E2E_API_READY=1 bunx playwright test e2e/lot-boundary.visual.spec.ts --project=desktop-chromium --project=mobile-chromium --update-snapshots

Review the generated snapshots, then run the same command without --update-snapshots. Expected: PASS.

~~~bash
git add frontend/src/app/globals.css frontend/src/features/admin-objects/lot-boundary-editor.tsx frontend/e2e/lot-boundary.visual.spec.ts frontend/e2e/__screenshots__
git commit -m "style: refine lot boundary editor UX"
~~~

### Task 5: Cover real end-to-end journeys and map failure recovery

**Files:**
- Modify: frontend/e2e/lot-boundary.spec.ts
- Modify: frontend/e2e/lot-boundary.visual.spec.ts
- Create: frontend/e2e/lot-boundary-mobile.spec.ts
- Modify: frontend/e2e/helpers/visual.ts only to keep visual mocks separate from network tests

**Step 1: Write desktop functional E2E coverage**

Without deterministic tile routing, open a seeded object with valid coordinates. Verify its editor map focuses on the object marker rather than [0, 0], draw a boundary by four canvas clicks, insert a coordinate vertex, reject a self-intersection, cancel a draft, save a valid boundary, reload, and confirm public-map rendering.

**Step 2: Add mobile interaction coverage**

Reuse the touch dispatch approach in mobile-map.spec.ts. Tap three or four points, drag a vertex, finish, verify 44px actions, and confirm no horizontal overflow.

**Step 3: Add tile-failure coverage**

Route raster tile requests to failure before navigation. Assert that the editor presents the localised map error and retry action. Remove the route and verify retry returns to loading or ready, never a silently blank map.

**Step 4: Run focused acceptance tests**

Run: cd frontend && E2E_API_READY=1 bunx playwright test e2e/lot-boundary.spec.ts e2e/lot-boundary-mobile.spec.ts e2e/lot-boundary.visual.spec.ts --project=desktop-chromium --project=mobile-chromium

Expected: PASS on both projects.

**Step 5: Commit**

~~~bash
git add frontend/e2e/lot-boundary.spec.ts frontend/e2e/lot-boundary-mobile.spec.ts frontend/e2e/lot-boundary.visual.spec.ts frontend/e2e/helpers/visual.ts frontend/e2e/__screenshots__
git commit -m "test: cover lot boundary drawing journeys"
~~~

### Task 6: Run all quality gates and perform a human-path check

**Files:**
- No production changes expected.

**Step 1: Run static and unit checks**

Run: cd frontend && bun run lint

Run: cd frontend && bun run test

Run: cd frontend && bun run test:coverage

Expected: PASS. Record coverage output. The repository has no mutation-testing or dedicated cyclomatic-complexity gate.

**Step 2: Run full end-to-end coverage**

Run: cd frontend && E2E_API_READY=1 bun run test:e2e

Expected: PASS. Separate unrelated existing failures from this feature before changing any code.

**Step 3: Perform a human-path smoke test**

In a local browser, sign in as the demo admin, create or open an object, set its location, draw a boundary with click/tap, adjust one point, save, reload, and view it on the public map. Inspect desktop and mobile screenshots for visible tiles, marker, numbered vertices, legible progress, and coherent action hierarchy.

**Step 4: Commit only final required fixes**

~~~bash
git add <verified-fix-files>
git commit -m "fix: complete lot boundary quality checks"
~~~
