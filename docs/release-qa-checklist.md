# Tasks 2–9 release QA

Verified on 2026-09-28 from commit `fb76354`, before deployment. This report covers the
complete browser flow from the UI through the API and a fresh PostGIS database.

## Business-flow coverage

| Task                     | Verified flow                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2. Lot borders           | Admin rejects a self-intersecting polygon, saves a valid four-point boundary, reloads it, and the public map renders the published geometry and provenance.                       |
| 3. Localization          | Uzbek and Russian public, auth, admin translation, cookie, error, and visual states render the requested locale without mixed-language controls.                                  |
| 4. Location picking      | Admin selects, geolocates, saves, reloads, and clears a point; invalid state remains actionable.                                                                                  |
| 5. Mobile map            | The map is visible before filters, touch/keyboard selection works, filters collapse, orientation resize works, and freehand drawing can be cancelled safely.                      |
| 6. Main-page map         | Homepage filters call the bounded map API, preserve the deep-link query, and expose an accessible selected-object preview.                                                        |
| 7. Lot application       | An investor submits against an available object, an admin reviews it, and the result returns to the investor dashboard; upcoming objects do not expose the form.                  |
| 8. Investor registration | Normalization, localized validation, duplicate handling, safe `returnTo`, session creation, and the real registration API were exercised.                                         |
| 9. SEO                   | Locale canonicals, hreflang, H1, social cards, robots, manifest, `llms.txt`, one sitemap index plus UZ/RU sitemaps, legacy redirects, and private-route `noindex` were exercised. |

## Executed quality gates

- Backend: `bun run lint`, `bun run format:check`, and `bun run test:coverage` pass;
  51 tests passed with 82.45% function and 78.96% line coverage.
- Frontend: `bun run lint` and `bun run test:coverage` pass; 139 tests passed with
  61.09% statement/line, 77.77% branch, and 67% function coverage.
- Production frontend: `NEXT_PUBLIC_SITE_URL=https://toshkent-tuman-invest.uz bun run build`
  passes TypeScript and generates all 21 application routes.
- Database: all 10 migrations apply from an empty disposable `postgis/postgis:16-3.4`
  database; `bun run db:seed` and guarded `ALLOW_E2E_SEED=true bun run db:seed:e2e`
  both pass.
- Playwright desktop: 46 passed, 2 intentional mobile-only skips, 0 failed.
- Playwright mobile: 48 passed, 0 failed.
- Combined deterministic browser result: 94 passed, 2 intentional skips, 0 failed.
- Representative desktop and mobile baselines for border editing, localization, location
  picking, maps, application review, registration, and SEO social cards were inspected
  manually before accepting visual changes.

The repository has no mutation-test command and no enforced coverage threshold. Coverage is
still collected by both backend and frontend test commands.

## Deterministic E2E reset

Do not reuse a Next development cache created with another public API or site URL. Before the
verification services start, move that exact cache out of the workspace:

```bash
test ! -d frontend/.next || mv frontend/.next "/tmp/tashkent-invest-next-cache-$(date +%s)"
```

Run the frontend with `NEXT_PUBLIC_API_URL=http://localhost:8080/api`,
`NEXT_PUBLIC_SITE_URL=https://toshkent-tuman-invest.uz`, and the normal HTTPS map tile template.
Run the backend against the disposable PostGIS database. Reset fixtures immediately before
each Playwright project so auth attempts, applications, and edited geometry cannot leak between
desktop and mobile:

```bash
cd backend
DATABASE_URL="$E2E_DATABASE_URL" ALLOW_E2E_SEED=true bun run db:seed:e2e

cd ../frontend
E2E_BASE_URL=http://localhost:3000 E2E_API_URL=http://localhost:8080/api \
  E2E_API_READY=1 bunx playwright test --project=desktop-chromium

cd ../backend
DATABASE_URL="$E2E_DATABASE_URL" ALLOW_E2E_SEED=true bun run db:seed:e2e

cd ../frontend
E2E_BASE_URL=http://localhost:3000 E2E_API_URL=http://localhost:8080/api \
  E2E_API_READY=1 bunx playwright test --project=mobile-chromium
```

`E2E_DATABASE_URL` must point only to an isolated disposable database. The seed command is
intentionally blocked unless `ALLOW_E2E_SEED=true` is explicit.

## Post-deploy-only checks

- Configure `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, and
  `APP_PUBLIC_URL`; register `POST /telegram/webhook` with Telegram using the same secret.
- As the single active admin, open **Sozlamalar → Telegram xabarnomalari**, open the bot,
  press Start, then confirm the connected state in the dashboard.
- Submit a new available-object application. Confirm one escaped, emoji-led Telegram message
  appears with the `📂 Arizani kabinetda ochish` button; use it while logged out and confirm
  login returns to the exact application sheet. Re-submit the same application and confirm no
  second message is sent.
- Temporarily make the Telegram API unavailable and confirm the investor still receives the
  successful application response while the backend records a sanitised delivery failure.
- Confirm DNS, TLS, and `/`, `/map`, and legacy object redirects on the canonical host.
- Submit only `/sitemap.xml` to Google Search Console and Bing Webmaster Tools, then inspect
  representative UZ/RU home, map, and object URLs.
- Re-run Google Rich Results Test, Facebook Sharing Debugger, and an OpenSEO crawl.
- Confirm production `robots.txt` permits intended public Google, Bing, `OAI-SearchBot`, and
  `GPTBot` crawling while dashboard routes remain excluded.
- Check live third-party tiles and geolocation on at least one physical mobile device; automated
  visuals intentionally replace remote tiles with a deterministic local PNG.

No deployment or external crawler submission was performed during this verification.
