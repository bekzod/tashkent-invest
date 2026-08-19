# Landing Visual System Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Polish the Invest Tuman landing page into a consistent, accessible visual system while preserving all existing landing-map interactions.

**Architecture:** Keep page structure and map components unchanged. Consolidate landing styles in `frontend/src/app/globals.css` with reusable CSS custom properties, then update only semantic class usage where required. The hero map remains a client map component; visual changes must not alter map data, marker loading, or filter state.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, MapLibre GL, CSS, Vitest, Playwright.

---

### Task 1: Capture the current visual baseline

**Files:**
- Modify: `frontend/e2e/investor-journey.spec.ts`
- Create: `frontend/test-results/landing-baseline.png` (generated, do not commit)

**Step 1: Write the failing visual/layout assertion**

Add a desktop navigation to `/` and assertions for visible hero heading, right-aligned filter and four project cards.

```ts
await expect(page.getByRole('heading', { name: /tuman kelajagiga/i })).toBeVisible();
await expect(page.locator('.reference-filter')).toBeVisible();
await expect(page.locator('.reference-card-grid .object-card')).toHaveCount(4);
```

**Step 2: Run the test to verify its baseline behavior**

Run: `bun run test:e2e -- investor-journey.spec.ts`

Expected: the existing user journey passes; record its screenshot before style changes.

**Step 3: Add the visual capture**

```ts
await page.setViewportSize({ width: 1440, height: 1050 });
await page.goto('/');
await expect(page).toHaveScreenshot('landing-desktop.png', { fullPage: true });
```

**Step 4: Re-run test**

Run: `bun run test:e2e -- investor-journey.spec.ts`

Expected: snapshot is created or approved after visual review.

**Step 5: Commit**

```bash
git add frontend/e2e/investor-journey.spec.ts frontend/e2e/*-snapshots
git commit -m "test: capture landing visual baseline"
```

### Task 2: Establish global typography, spacing and interaction tokens

**Files:**
- Modify: `frontend/src/app/globals.css:1-22, 40-46`
- Test: `frontend/e2e/investor-journey.spec.ts`

**Step 1: Write the failing responsive layout test**

Add an explicit mobile check that the header remains visible and the hero/filter have no horizontal overflow.

```ts
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('/');
await expect(page.locator('.site-header')).toBeVisible();
expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
```

**Step 2: Run it to verify the current issue**

Run: `bun run test:e2e -- investor-journey.spec.ts`

Expected: FAIL if the current dimensions create overflow, otherwise passes as a regression test.

**Step 3: Implement minimal system tokens**

At the end of the root design tokens, define `--space-*`, `--radius-*`, focus-ring, controlled shadow and the font stack. Apply a 16px body base with 1.5 line-height; keep supporting labels at 12px minimum and card/action text at 14px minimum. Add `:focus-visible`, hover/active, and `prefers-reduced-motion` rules.

```css
:root {
  --space-1: .25rem;
  --space-2: .5rem;
  --space-3: .75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --radius-control: .5rem;
  --radius-card: .75rem;
  --focus-ring: 0 0 0 3px rgb(11 94 200 / .22);
}
```

**Step 4: Run checks**

Run: `bun run lint && bun run test`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/globals.css frontend/e2e/investor-journey.spec.ts
git commit -m "style: establish landing design tokens"
```

### Task 3: Refine header and hero layout without changing map behavior

**Files:**
- Modify: `frontend/src/app/globals.css:20-29, 40-42`
- Modify: `frontend/src/widgets/public-header.tsx` only if a semantic class is needed
- Test: `frontend/e2e/investor-journey.spec.ts`

**Step 1: Write the failing desktop geometry test**

Use browser evaluation to ensure filter is placed on the right of the hero copy and is within the hero bounds.

```ts
const geometry = await page.locator('.reference-filter').evaluate((filter) => {
  const filterBox = filter.getBoundingClientRect();
  const heroBox = document.querySelector('.reference-hero')!.getBoundingClientRect();
  return { inside: filterBox.right <= heroBox.right + 1, rightHalf: filterBox.left > heroBox.left + heroBox.width / 2 };
});
expect(geometry).toEqual({ inside: true, rightHalf: true });
```

**Step 2: Run it**

Run: `bun run test:e2e -- investor-journey.spec.ts`

Expected: PASS after implementation; use it to catch future filter drift.

**Step 3: Implement layout correction**

Make the desktop hero approximately 480px high, give the left copy a predictable readable width, constrain the h1 so it forms balanced lines, and position the map as an absolute full hero background. Keep the left-to-right white-to-transparent overlay; do not create a visible hard boundary between map and copy. Keep the filter in the third grid column, aligned to the right edge and above the map at all desktop widths.

Do not modify `MapPageClient`, `InvestmentMap`, map source, map tile settings or map controls.

**Step 4: Verify interaction regression**

Run: `bun run test:e2e -- investor-journey.spec.ts`

Expected: PASS; test the hero map zoom controls manually at 1440px.

**Step 5: Commit**

```bash
git add frontend/src/app/globals.css frontend/src/widgets/public-header.tsx frontend/e2e/investor-journey.spec.ts
git commit -m "style: refine landing header and hero"
```

### Task 4: Normalize cards, content grid and subscription section

**Files:**
- Modify: `frontend/src/app/globals.css:30-34, 43-44`
- Modify: `frontend/src/entities/investment-object/object-card.tsx` only if presentation classes are needed
- Test: `frontend/e2e/investor-journey.spec.ts`

**Step 1: Write the failing card readability assertion**

```ts
const card = page.locator('.reference-card-grid .object-card').first();
await expect(card.getByRole('heading')).toBeVisible();
await expect(card.locator('.object-card-meta strong')).toBeVisible();
```

**Step 2: Run test**

Run: `bun run test:e2e -- investor-journey.spec.ts`

Expected: PASS initially or document any card data/API dependency separately.

**Step 3: Implement consistent component rhythm**

Use 16px card body padding, 12px status badges, 15–16px titles and 14px supporting text. Align four cards to equal height at desktop; retain responsive 2/1-column layouts. Establish matching radii, borders and restrained hover shadows for cards, categories, process sidebar and subscription form.

**Step 4: Run checks**

Run: `bun run lint && bun run test && bun run test:e2e -- investor-journey.spec.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/globals.css frontend/src/entities/investment-object/object-card.tsx frontend/e2e/investor-journey.spec.ts
git commit -m "style: polish landing content components"
```

### Task 5: Validate responsive behavior and map controls

**Files:**
- Modify: `frontend/src/app/globals.css:35-36, 46`
- Test: `frontend/e2e/investor-journey.spec.ts`

**Step 1: Write mobile and tablet tests**

```ts
for (const viewport of [{ width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  await page.setViewportSize(viewport);
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('.reference-filter')).toBeVisible();
}
```

**Step 2: Run test to confirm state**

Run: `bun run test:e2e -- investor-journey.spec.ts`

Expected: PASS after CSS adjustments.

**Step 3: Apply responsive refinements**

Keep hero map behind the copy on tablet/mobile, stack the filter below it without clipping, maintain 44px action controls and prevent horizontal overflow. Adjust only media queries; preserve desktop geometry.

**Step 4: Final verification**

Run: `bun run lint && bun run test && bun run test:e2e`

Expected: all checks PASS. Capture 1440px, 768px and 390px screenshots for visual sign-off, and manually confirm hero-map zoom-in/zoom-out works.

**Step 5: Commit**

```bash
git add frontend/src/app/globals.css frontend/e2e/investor-journey.spec.ts
git commit -m "style: complete responsive landing polish"
```
