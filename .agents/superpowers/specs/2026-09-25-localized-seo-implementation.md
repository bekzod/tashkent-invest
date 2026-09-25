# Localized SEO and Discovery Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Build crawlable Uzbek and Russian public routes, complete search/social metadata, dynamic preview banners, structured data, and a sitemap index with complete per-language sitemaps for `https://toshkent-tuman-invest.uz`.

**Architecture:** A small locale-routing module is shared by Next.js proxy redirects, server metadata, navigation, and sitemap generation. Public pages move under a validated `[locale]` segment and render localized data on the server; private dashboard routes remain unprefixed and `noindex`. Explicit XML route handlers produce one sitemap index and two locale sitemaps, while generated `ImageResponse` routes supply localized social cards.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Testing Library, Playwright, Fastify/Bun backend, JSON-LD, Open Graph, XML sitemaps.

---

### Task 1: Establish a clean localization baseline

**Files:**
- Verify: `frontend/src/shared/i18n/messages.ts`
- Verify: `frontend/src/shared/i18n/messages.test.ts`
- Verify: all currently modified frontend localization files

**Step 1: Run the completed localization checks**

Run:

```bash
cd frontend
bun run lint
bun run test
bun run build
```

Expected: lint passes, 22 or more tests pass, and the production build succeeds.

**Step 2: Inspect the pending patch**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the completed localization patch and this planning work are pending.

**Step 3: Commit the localization baseline separately**

```bash
git add frontend/src
git commit -m "feat: complete Uzbek and Russian localization"
```

Expected: SEO work starts from a reviewable localization commit and does not mix unrelated changes.

---

### Task 2: Add tested locale and canonical URL primitives

**Files:**
- Create: `frontend/src/shared/i18n/routing.ts`
- Create: `frontend/src/shared/i18n/routing.test.ts`
- Modify: `frontend/src/shared/i18n/language-provider.tsx`
- Modify: `frontend/src/shared/i18n/language-provider.test.tsx`

**Step 1: Write failing locale-routing tests**

Cover:

```ts
expect(isLocale('uz')).toBe(true);
expect(isLocale('ru')).toBe(true);
expect(isLocale('en')).toBe(false);
expect(localizedPath('ru', '/map?q=land')).toBe('/ru/map?q=land');
expect(localizedPath('uz', '/objects/example')).toBe('/uz/objects/example');
expect(switchPathLocale('/uz/objects/example?from=map', 'ru'))
  .toBe('/ru/objects/example?from=map');
expect(localeFromPath('/ru/map')).toBe('ru');
expect(localeFromPath('/dashboard')).toBeUndefined();
```

Add a provider test proving `initialLocale="ru"` renders Russian on the first render and writes `<html lang="ru">`.

**Step 2: Run tests to verify failure**

Run:

```bash
cd frontend
bun run test -- src/shared/i18n/routing.test.ts src/shared/i18n/language-provider.test.tsx
```

Expected: FAIL because routing helpers and `initialLocale` do not exist.

**Step 3: Implement minimal routing primitives**

Use a fixed locale tuple and reject arbitrary path segments:

```ts
export const locales = ['uz', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'uz';

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localeFromPath(pathname: string): Locale | undefined {
  const segment = pathname.split('/')[1];
  return isLocale(segment) ? segment : undefined;
}

export function localizedPath(locale: Locale, href: string): string {
  const url = new URL(href, 'https://local.invalid');
  const stripped = url.pathname.replace(/^\/(?:uz|ru)(?=\/|$)/, '') || '/';
  return `/${locale}${stripped === '/' ? '' : stripped}${url.search}${url.hash}`;
}
```

Update `LanguageProvider` to accept `initialLocale?: Locale`, use it for the initial state, and keep saved-locale behavior only for unprefixed private routes.

**Step 4: Run focused tests**

Expected: all routing/provider tests pass.

**Step 5: Commit**

```bash
git add frontend/src/shared/i18n
git commit -m "feat: add locale-aware public routing primitives"
```

---

### Task 3: Add server-visible locale routing and legacy redirects

**Files:**
- Create: `frontend/src/proxy.ts`
- Create: `frontend/src/proxy.test.ts`
- Modify: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/[locale]/layout.tsx`
- Create: `frontend/src/app/[locale]/page.tsx`
- Create: `frontend/src/app/[locale]/map/page.tsx`
- Create: `frontend/src/app/[locale]/objects/[slug]/page.tsx`
- Create: `frontend/src/app/[locale]/login/page.tsx`
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/map/page.tsx`
- Modify: `frontend/src/app/objects/[slug]/page.tsx`
- Modify: `frontend/src/app/login/page.tsx`

**Step 1: Write failing proxy tests**

Call `proxy()` with `NextRequest` values and assert:

- `/` redirects with status 308 to `/uz` and preserves query parameters;
- `/map?types=land` redirects to `/uz/map?types=land`;
- `/objects/demo` redirects to `/uz/objects/demo`;
- `/login` redirects to `/uz/login`;
- `/ru/map` continues and carries `x-invest-locale: ru` in the forwarded request headers;
- `/dashboard` continues without a public redirect;
- static assets, API paths, sitemap routes, and robots bypass locale redirects.

**Step 2: Run the proxy test and verify failure**

Run:

```bash
cd frontend
bun run test -- src/proxy.test.ts
```

Expected: FAIL because `src/proxy.ts` is absent.

**Step 3: Implement the Next.js 16 proxy**

Use `NextResponse.redirect(url, 308)` for legacy public paths. For localized paths, clone request headers, set `x-invest-locale`, and return `NextResponse.next({ request: { headers } })`. Export a matcher that excludes `/_next`, images, icons, and direct XML/text metadata routes.

**Step 4: Make the root layout server-aware**

Read `x-invest-locale` through `headers()` and render:

```tsx
const locale = normalizeLocale((await headers()).get('x-invest-locale'));
return (
  <html lang={locale}>
    <body className={manrope.variable}>
      <LanguageProvider initialLocale={locale}>
        <AppFrame>{children}</AppFrame>
      </LanguageProvider>
    </body>
  </html>
);
```

Keep all layout metadata generic; page-level metadata becomes locale-aware in Task 5.

**Step 5: Create localized routes and safe legacy fallbacks**

Move the real public page implementations under `[locale]`. Validate `params.locale` with `isLocale`; call `notFound()` for unknown locales. Legacy pages use permanent redirects as a fallback if proxy is bypassed. Preserve map query parameters.

**Step 6: Run routing tests and build**

Run:

```bash
cd frontend
bun run test -- src/proxy.test.ts src/shared/i18n/routing.test.ts
bun run build
```

Expected: tests pass; build lists `/[locale]`, `/[locale]/map`, `/[locale]/objects/[slug]`, and `/[locale]/login`.

**Step 7: Commit**

```bash
git add frontend/src/proxy.ts frontend/src/proxy.test.ts frontend/src/app frontend/src/shared/i18n
git commit -m "feat: add crawlable locale routes"
```

---

### Task 4: Make every public navigation path locale-safe

**Files:**
- Modify: `frontend/src/widgets/public-header.tsx`
- Modify: `frontend/src/widgets/app-frame.tsx`
- Modify: `frontend/src/views/home.tsx`
- Modify: `frontend/src/views/login.tsx`
- Modify: `frontend/src/views/object-detail.tsx`
- Modify: `frontend/src/views/profile.tsx`
- Modify: `frontend/src/entities/investment-object/object-card.tsx`
- Modify: `frontend/src/features/application/application-form.tsx`
- Modify: `frontend/src/features/investment-map/map-page-client.tsx`
- Modify: `frontend/src/views/home.test.tsx`
- Create: `frontend/src/widgets/public-header.test.tsx`

**Step 1: Write failing link tests**

Render the header and representative cards under `initialLocale="ru"`. Assert links use `/ru/map`, `/ru`, `/ru/objects/:slug`, and `/ru/login`. Change the language selector and assert it navigates to the equivalent `/uz/...` path rather than only mutating local storage.

**Step 2: Run tests to verify failure**

Expected: current links point to unprefixed routes.

**Step 3: Replace hard-coded public href values**

Use `localizedPath(locale, href)` at every public boundary. Preserve dashboard URLs as unprefixed. In the language selector, compute the counterpart with `switchPathLocale()` and navigate with the Next router while persisting the selection.

**Step 4: Run focused tests**

Expected: header, home, and object-card tests pass in both locales.

**Step 5: Commit**

```bash
git add frontend/src/widgets frontend/src/views frontend/src/entities frontend/src/features
git commit -m "fix: preserve locale across public navigation"
```

---

### Task 5: Centralize locale-aware metadata and canonical alternates

**Files:**
- Modify: `frontend/src/shared/lib/seo.ts`
- Create: `frontend/src/shared/lib/seo.test.ts`
- Modify: `frontend/src/app/[locale]/page.tsx`
- Modify: `frontend/src/app/[locale]/map/page.tsx`
- Modify: `frontend/src/app/[locale]/objects/[slug]/page.tsx`
- Modify: `frontend/src/app/[locale]/login/page.tsx`
- Modify: `frontend/src/app/layout.tsx`

**Step 1: Write failing metadata tests**

Verify:

```ts
expect(site.url).toBe('https://toshkent-tuman-invest.uz');
expect(page.alternates?.canonical).toBe('https://toshkent-tuman-invest.uz/ru/map');
expect(page.alternates?.languages).toEqual({
  uz: 'https://toshkent-tuman-invest.uz/uz/map',
  ru: 'https://toshkent-tuman-invest.uz/ru/map',
  'x-default': 'https://toshkent-tuman-invest.uz/uz/map',
});
expect(page.openGraph?.locale).toBe('ru_RU');
expect(page.openGraph?.images?.[0]).toMatchObject({ width: 1200, height: 630 });
```

Also test object metadata in Uzbek and Russian, canonical slug URLs, image alt text, `robots: noindex` on login, and compact description limits.

**Step 2: Run tests to verify failure**

Expected: old fallback domain and unprefixed canonicals fail.

**Step 3: Implement a localized metadata catalog**

Add locale-specific site title, description, home/map/login copy, Open Graph locale, and image-alt functions. Replace the fallback origin with `https://toshkent-tuman-invest.uz` while continuing to respect `NEXT_PUBLIC_SITE_URL` for preview environments.

Change `publicPageMetadata` to require `locale` and a locale-neutral path, then create prefixed canonical/alternate URLs through the routing helper. Represent Open Graph images as objects containing URL, width, height, and localized alt text.

**Step 4: Implement route-level `generateMetadata`**

Each `[locale]` page validates the locale and calls the centralized helper. Object metadata fetches the object using the same locale as the page. Login remains `noindex, nofollow`.

**Step 5: Run tests and build**

Expected: metadata tests and Next type-check pass.

**Step 6: Commit**

```bash
git add frontend/src/shared/lib/seo.ts frontend/src/shared/lib/seo.test.ts frontend/src/app
git commit -m "feat: add localized canonical and social metadata"
```

---

### Task 6: Add localized social banners and brand assets

**Files:**
- Create: `frontend/src/shared/ui/social-card.tsx`
- Create: `frontend/src/shared/ui/social-card.test.tsx`
- Create: `frontend/src/app/icon.tsx`
- Create: `frontend/src/app/manifest.ts`
- Create: `frontend/src/app/[locale]/opengraph-image.tsx`
- Create: `frontend/src/app/[locale]/map/opengraph-image.tsx`
- Create: `frontend/src/app/[locale]/objects/[slug]/opengraph-image.tsx`

**Step 1: Write failing social-card tests**

Test the pure card model builder rather than snapshotting binary PNG data. Verify localized title, status, area, investment amount, safe fallback image behavior, and 1200 by 630 dimensions.

**Step 2: Run the focused test and verify failure**

Expected: social-card module is missing.

**Step 3: Build a reusable social card**

Use `ImageResponse` with inline styles only. Keep a high-contrast brand panel, map-inspired decorative geometry, localized text, and a bottom domain label. Do not depend on a remote font. Object images are optional background enhancement; the card must render when image loading fails.

**Step 4: Add page image routes**

The home and map routes read `params.locale`. The object route fetches localized object data and returns a branded fallback for unknown/missing optional media while preserving a 404 for a missing object.

**Step 5: Add icon and manifest**

Generate a crawlable 512 by 512 icon with a readable Invest Tuman mark. The localized manifest uses the canonical origin, consistent colors, and correct icon URLs.

**Step 6: Run tests and build**

Expected: generated image routes compile and card model tests pass.

**Step 7: Commit**

```bash
git add frontend/src/shared/ui/social-card* frontend/src/app/icon.tsx frontend/src/app/manifest.ts frontend/src/app/[locale]
git commit -m "feat: generate localized social preview banners"
```

---

### Task 7: Strengthen structured data with verifiable entities

**Files:**
- Create: `frontend/src/shared/lib/structured-data.ts`
- Create: `frontend/src/shared/lib/structured-data.test.ts`
- Modify: `frontend/src/app/[locale]/page.tsx`
- Modify: `frontend/src/app/[locale]/map/page.tsx`
- Modify: `frontend/src/app/[locale]/objects/[slug]/page.tsx`

**Step 1: Write failing schema tests**

Assert home graph contains `Organization` and `WebSite`, uses the canonical domain/logo, and has no invented `sameAs`, phone, or address. Assert map schema contains `CollectionPage` and `ItemList`. Assert object schema contains `Place`, `Offer`, and `BreadcrumbList`, with localized text and valid coordinates only when both numbers exist.

**Step 2: Run tests to verify failure**

Expected: centralized schema builders do not exist.

**Step 3: Implement schema builders**

Return `@graph` objects with stable `@id` values such as `${origin}/#organization`, `${canonical}#place`, and `${canonical}#offer`. Include only truthy, user-visible properties. Set `inLanguage` to `uz` or `ru`, and reuse the exact page canonical/image values.

Remove the obsolete home `SearchAction`. Keep `structuredData()` escaping `<` before insertion.

**Step 4: Render schema on localized pages**

Fetch the map item list server-side with a conservative visible limit. Use the same localized records for HTML and schema where practical.

**Step 5: Run schema tests and build**

Expected: JSON parses, contains no `undefined`, and build succeeds.

**Step 6: Commit**

```bash
git add frontend/src/shared/lib/structured-data* frontend/src/app/[locale]
git commit -m "feat: add localized investment structured data"
```

---

### Task 8: Expose truthful update timestamps and fetch every sitemap object

**Files:**
- Modify: `backend/services/investment-object-presenter.js`
- Modify: `backend/services/__tests__/investment-object-query.test.js` or create `backend/services/__tests__/investment-object-presenter.test.js`
- Modify: `frontend/src/entities/investment-object/types.ts`
- Modify: `frontend/src/shared/lib/seo.ts`
- Modify: `frontend/src/shared/lib/seo.test.ts`

**Step 1: Write failing presenter and pagination tests**

Assert `preview()` exposes an ISO `updatedAt`. Mock paginated `/objects` responses and assert `fetchAllPublicObjects('ru')` requests every page until `meta.total` is reached, deduplicates by slug, and sends `Accept-Language: ru`.

**Step 2: Run tests to verify failure**

Run:

```bash
cd backend && bun run test -- services/__tests__/investment-object-presenter.test.js
cd ../frontend && bun run test -- src/shared/lib/seo.test.ts
```

Expected: timestamp and complete pagination behavior are missing.

**Step 3: Extend the public representation**

Add:

```js
updatedAt: object.updatedAt instanceof Date
  ? object.updatedAt.toISOString()
  : object.updatedAt,
```

Update the frontend type with `updatedAt?: string`.

**Step 4: Implement complete paginated fetching**

Retain `meta` in the fetch response. Fetch pages sequentially with `limit=48`, stop when accumulated items reach `meta.total` or a page is empty, and cap the loop defensively to avoid an infinite upstream response.

**Step 5: Run backend and frontend tests**

Expected: timestamp and pagination tests pass.

**Step 6: Commit**

```bash
git add backend/services frontend/src/entities frontend/src/shared/lib/seo*
git commit -m "feat: expose object updates for complete sitemaps"
```

---

### Task 9: Build the sitemap index and locale XML sitemaps

**Files:**
- Delete: `frontend/src/app/sitemap.ts`
- Create: `frontend/src/shared/lib/sitemap.ts`
- Create: `frontend/src/shared/lib/sitemap.test.ts`
- Create: `frontend/src/app/sitemap.xml/route.ts`
- Create: `frontend/src/app/sitemap-uz.xml/route.ts`
- Create: `frontend/src/app/sitemap-ru.xml/route.ts`

**Step 1: Write failing XML tests**

Verify the index has exactly the two locale sitemap `<loc>` entries. Verify each locale sitemap:

- uses the sitemap and XHTML namespaces;
- contains localized home, map, and every object URL;
- adds reciprocal `uz`, `ru`, and `x-default` links for every URL;
- uses real valid `updatedAt` values and no request-time `now` value;
- escapes `&`, `<`, `>`, quotes, and apostrophes;
- contains no login, dashboard, profile, query-filter, or API URL.

**Step 2: Run tests to verify failure**

Expected: current metadata sitemap returns a single incomplete URL set.

**Step 3: Implement pure XML builders**

Create `escapeXml`, `buildSitemapIndex`, and `buildLocaleSitemap`. XML route handlers return:

```ts
return new Response(xml, {
  headers: {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  },
});
```

Use `/uz` as `x-default` for every alternate cluster.

**Step 4: Fetch all localized objects in each locale route**

Call `fetchAllPublicObjects(locale)`. On backend failure, return a valid sitemap containing static localized routes instead of a 500 response.

**Step 5: Run XML tests and build**

Expected: XML tests pass and Next accepts dot-suffixed route folders.

**Step 6: Commit**

```bash
git add frontend/src/app/sitemap* frontend/src/shared/lib/sitemap*
git commit -m "feat: add locale sitemap index and XML feeds"
```

---

### Task 10: Configure robots and supplemental AI discovery

**Files:**
- Modify: `frontend/src/app/robots.ts`
- Create: `frontend/src/app/llms.txt/route.ts`
- Create: `frontend/src/app/robots.test.ts`
- Create: `frontend/src/app/llms.test.ts`

**Step 1: Write failing crawler-policy tests**

Assert the generated robots policy:

- references only `https://toshkent-tuman-invest.uz/sitemap.xml`;
- allows `/uz/`, `/ru/`, and object/map pages;
- disallows `/dashboard`, `/profile`, `/uz/login`, `/ru/login`, and `/api`;
- includes an explicit `OAI-SearchBot` allow rule;
- leaves `GPTBot` explicitly allowed as the approved policy.

Assert `llms.txt` has `text/plain; charset=utf-8`, names both languages, and points only to canonical public URLs and sitemaps.

**Step 2: Run tests to verify failure**

Expected: crawler-specific and `llms.txt` behavior is missing.

**Step 3: Implement robots policy**

Use `MetadataRoute.Robots` with separate `*`, `OAI-SearchBot`, and `GPTBot` rules. Keep private exclusions consistent across all rules.

**Step 4: Implement `/llms.txt`**

Return a short bilingual directory, not a marketing keyword dump. State the portal purpose, canonical origin, localized home/map routes, sitemap index, and contact limitation. Do not claim that this file is a ranking mechanism.

**Step 5: Run tests and commit**

```bash
git add frontend/src/app/robots* frontend/src/app/llms*
git commit -m "feat: configure search and AI crawler discovery"
```

---

### Task 11: Add acceptance coverage for localized SEO surfaces

**Files:**
- Modify: `frontend/e2e/landing-layout.spec.ts`
- Modify: `frontend/e2e/map-object-focus.spec.ts`
- Modify: `frontend/e2e/investor-journey.spec.ts`
- Create: `frontend/e2e/seo-discovery.spec.ts`

**Step 1: Update public paths in existing tests**

Use `/uz`, `/uz/map`, and `/uz/objects/:slug`. Keep private dashboard paths unchanged.

**Step 2: Add SEO HTTP assertions**

Without requiring the seeded API, verify:

- `/` returns a permanent redirect to `/uz`;
- `/uz` and `/ru` return 200 with matching `<html lang>`;
- canonical and alternate links are reciprocal;
- `og:image` resolves with an image content type;
- `/sitemap.xml` resolves as XML and references locale sitemaps;
- `/robots.txt` and `/llms.txt` are public;
- dashboard metadata remains `noindex`.

Conditionally add object-level checks when `E2E_API_READY=1`.

**Step 3: Run browser tests**

Run:

```bash
cd frontend
bunx playwright install chromium
bun run test:e2e
```

Expected: static SEO tests pass; API-backed tests skip unless the seeded backend is enabled. Installing Chromium is an environment prerequisite and should not modify repository files.

**Step 4: Commit**

```bash
git add frontend/e2e
git commit -m "test: cover localized SEO discovery routes"
```

---

### Task 12: Run final quality gates and document deployment checks

**Files:**
- Modify: `README.md`
- Create: `docs/seo-release-checklist.md`

**Step 1: Document production requirements**

Document:

- `NEXT_PUBLIC_SITE_URL=https://toshkent-tuman-invest.uz`;
- DNS and HTTPS must resolve the canonical host;
- submit only `/sitemap.xml` to Google Search Console and Bing Webmaster Tools;
- inspect deployed URLs with Google Rich Results Test, URL Inspection, Facebook Sharing Debugger, and a direct OAI-SearchBot-permitted robots check;
- social platforms may cache old cards and require a rescrape;
- rankings, AI citations, and preview selection are external outcomes, not release guarantees.

**Step 2: Run all repository gates**

Run:

```bash
cd backend
bun run lint
bun run format:check
bun run test:coverage

cd ../frontend
bun run lint
bun run test:coverage
bun run build
bun run test:e2e
```

Expected: lint, formatting, coverage, and build pass. E2E results explicitly distinguish environment skips from assertion failures.

**Step 3: Inspect generated endpoints locally**

Run the app and verify response headers/body for:

```text
/uz
/ru
/uz/map
/ru/map
/sitemap.xml
/sitemap-uz.xml
/sitemap-ru.xml
/robots.txt
/llms.txt
/uz/opengraph-image
/ru/opengraph-image
```

Expected: correct status, content type, canonical host, localized content, and no private URLs.

**Step 4: Check the final patch**

```bash
git diff --check
git status --short
git log --oneline --decorate -12
```

Expected: no whitespace issues or unrelated generated files.

**Step 5: Commit documentation**

```bash
git add README.md docs/seo-release-checklist.md
git commit -m "docs: add SEO deployment verification checklist"
```
