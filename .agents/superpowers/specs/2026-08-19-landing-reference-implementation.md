# Landing Reference Alignment Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Align the main landing page with the supplied Invest Tuman reference and repair MapLibre tile loading.

**Architecture:** Recompose the existing landing-only React components around the current public object and statistics APIs. Keep the full map route intact; use a lightweight non-interactive map preview in the landing hero and make the full map route the place for advanced filters/drawing.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, MapLibre GL JS, Playwright.

---

### Task 1: Repair OpenStreetMap raster tiles

**Files:**
- Modify: `frontend/.env.example`
- Modify: `frontend/src/features/investment-map/investment-map.tsx`
- Test: `frontend/src/features/investment-map/map-utils.test.ts`

**Step 1:** Replace the `{s}` tile hostname with `https://tile.openstreetmap.org/{z}/{x}/{y}.png` in both default and example configuration.

**Step 2:** Run the frontend and capture browser failed requests; expect no request containing `{s}.tile`.

### Task 2: Rebuild the landing hero and filter card

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/features/investment-map/map-page-client.tsx`
- Modify: `frontend/src/app/globals.css`

**Step 1:** Implement compact reference header/hero hierarchy: headline, search field, stats, CTAs, map canvas, and right floating filter card.

**Step 2:** Keep filters functional by routing controls to `/map` with supported query state or linking to the full map page.

### Task 3: Add reference content sections

**Files:**
- Create: `frontend/src/widgets/landing/popular-objects.tsx`
- Create: `frontend/src/widgets/landing/process-card.tsx`
- Create: `frontend/src/widgets/landing/categories.tsx`
- Create: `frontend/src/widgets/landing/notification-banner.tsx`
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/globals.css`

**Step 1:** Use current API mock objects to render four object cards.

**Step 2:** Add the process sidebar, category strip, and notification banner with accessible labels and responsive fallbacks.

### Task 4: Verify visual/runtime behavior

**Files:**
- Modify: `frontend/e2e/investor-journey.spec.ts`

**Step 1:** Capture a 1280px screenshot and inspect browser console/network errors for tiles.

**Step 2:** Run `bun run lint`, `bun run test`, and `bun run build` from `frontend/`.
