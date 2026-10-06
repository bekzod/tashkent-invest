# Telegram Admin Application Notifications Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Let the authenticated active administrator securely link one Telegram chat and receive a polished, actionable notification for every new investor application.

**Architecture:** The backend stores one active admin Telegram chat binding and a short-lived, hashed one-use connection token. A protected admin endpoint generates the `t.me` start URL; an unauthenticated-but-secret-verified Telegram webhook consumes the token and binds the chat. After the application transaction commits, the investor route sends a best-effort notification with an authenticated dashboard deep link; frontend query handling opens the existing application detail sheet.

**Tech Stack:** Fastify, Sequelize/PostgreSQL migrations, Node `crypto` and native `fetch`, Telegram Bot API, Next.js App Router, React/Vitest, Bun.

---

### Task 1: Add safe Telegram binding persistence

**Files:**
- Create: `backend/db/migrations/202610060001-add-admin-telegram-binding.js`
- Modify: `backend/db/models/user.js`
- Test: `backend/db/__tests__/admin-telegram-binding-migration.test.js`

**Step 1: Write the failing migration/model test**

Assert that the migration adds nullable `telegram_chat_id`, `telegram_link_token_hash`, `telegram_link_expires_at`, and `telegram_linked_at` fields, applies a unique index to `telegram_chat_id`, and removes them in reverse order. Assert the User model maps the same camel-case attributes to the snake-case fields.

**Step 2: Run the focused test to verify it fails**

Run: `cd backend && bun test db/__tests__/admin-telegram-binding-migration.test.js`

Expected: FAIL because migration/model fields do not exist.

**Step 3: Implement the minimal migration and model fields**

Use `Sequelize.STRING` for the chat ID and token hash, and `Sequelize.DATE` for expiry/link time. Make the chat-ID unique index partial or otherwise permit multiple `NULL` values. Do not expose these fields from `/auth/me`.

**Step 4: Run the focused test to verify it passes**

Run: `cd backend && bun test db/__tests__/admin-telegram-binding-migration.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/db/migrations/202610060001-add-admin-telegram-binding.js backend/db/models/user.js backend/db/__tests__/admin-telegram-binding-migration.test.js
git commit -m "feat: persist admin Telegram bindings"
```

### Task 2: Build and test Telegram message delivery

**Files:**
- Create: `backend/services/telegram-notifier.js`
- Create: `backend/services/__tests__/telegram-notifier.test.js`
- Modify: `backend/app.js`
- Modify: `backend/.env.example`
- Modify: `README.md`

**Step 1: Write failing notifier tests**

Cover `escapeHtml`, optional-field omission, Uzbek money/date output, 4,096-character-safe truncation, one URL button labelled `📂 Arizani kabinetda ochish`, and a `sendMessage` request with `parse_mode: 'HTML'` and `disable_web_page_preview: true`. Test disabled configuration, no linked active admin, non-OK Telegram response, and injected `fetch` failure without logging a bot token or message body.

**Step 2: Run the focused test to verify it fails**

Run: `cd backend && bun test services/__tests__/telegram-notifier.test.js`

Expected: FAIL because the notifier is absent.

**Step 3: Implement the notifier**

Export a factory accepting `db`, `fetch`, configuration, and logger. Query the one active admin with a bound chat ID, load the application with its object/translations, format escaped HTML, and POST to `https://api.telegram.org/bot<TOKEN>/sendMessage`. Build the URL from `APP_PUBLIC_URL` and append `application=<UUID>`; never include a login token or applicant PII in the URL. Decorate Fastify with an injectable notifier in `backend/app.js` for route tests.

**Step 4: Document configuration**

Add server-only `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, and `APP_PUBLIC_URL` to `backend/.env.example` and deployment guidance in `README.md`, including Telegram webhook setup and the fact that secrets must not be exposed to the frontend.

**Step 5: Run focused tests and static checks**

Run: `cd backend && bun test services/__tests__/telegram-notifier.test.js && bun run lint && bun run format:check`

Expected: PASS.

**Step 6: Commit**

```bash
git add backend/services/telegram-notifier.js backend/services/__tests__/telegram-notifier.test.js backend/app.js backend/.env.example README.md
git commit -m "feat: format and send Telegram application alerts"
```

### Task 3: Add secure admin linking and Telegram webhook routes

**Files:**
- Create: `backend/routes/api/admin-telegram.js`
- Create: `backend/routes/telegram-webhook.js`
- Create: `backend/routes/__tests__/admin-telegram.test.js`
- Modify: `backend/routes/api/index.js`
- Modify: `backend/routes/index.js`

**Step 1: Write failing route tests**

Test that an admin can request a connection link, a non-admin receives 403, and the generated opaque token is stored only as a hash with a short expiry. For the webhook, test missing/wrong `X-Telegram-Bot-Api-Secret-Token`, malformed updates, expired/unknown/reused tokens, investor tokens, and inactive admins are rejected or ignored without binding a chat. Test valid `/start <token>` clears the token, links the chat, and removes any earlier linked admin chat so only one recipient remains.

**Step 2: Run the focused tests to verify they fail**

Run: `cd backend && bun test routes/__tests__/admin-telegram.test.js`

Expected: FAIL because no routes exist.

**Step 3: Implement minimal secure routes**

`POST /api/admin/telegram/link` uses `ensureAuth('admin')`, generates 32 random bytes, stores its SHA-256 hash with a ten-minute expiry, and returns `https://t.me/<TELEGRAM_BOT_USERNAME>?start=<token>`. `POST /telegram/webhook` verifies the exact secret with timing-safe comparison, accepts only `/start <token>`, resolves an active admin with an unexpired matching hash, clears every other admin binding in the transaction, stores the incoming chat ID and link time, then clears token fields. Reply 200 for benign Telegram retries; do not echo tokens.

**Step 4: Run focused tests and lint**

Run: `cd backend && bun test routes/__tests__/admin-telegram.test.js && bun run lint`

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/routes/api/admin-telegram.js backend/routes/telegram-webhook.js backend/routes/__tests__/admin-telegram.test.js backend/routes/api/index.js backend/routes/index.js
git commit -m "feat: link authorised admin Telegram chat"
```

### Task 4: Notify only after a new application commits

**Files:**
- Modify: `backend/routes/api/investor-actions.js`
- Modify: `backend/routes/__tests__/applications.test.js`

**Step 1: Extend the route tests first**

Inject a fake notifier and assert it receives the new application ID exactly once after a 201 response path, is not called for the idempotent duplicate 200 path, and a rejected notifier promise still leaves the API result as 201 with the expected body.

**Step 2: Run the focused test to verify it fails**

Run: `cd backend && bun test routes/__tests__/applications.test.js`

Expected: FAIL until the route calls the notifier.

**Step 3: Implement post-commit notification**

After `submitApplication` resolves, if `created` is true call the decorated notifier without awaiting it in the transaction. Catch and log a sanitised error; return the existing API contract unchanged. The notifier must never run for a duplicate or an unsuccessful submission.

**Step 4: Verify focused behavior**

Run: `cd backend && bun test routes/__tests__/applications.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/routes/api/investor-actions.js backend/routes/__tests__/applications.test.js
git commit -m "feat: alert admin about new applications"
```

### Task 5: Add the admin Telegram connection UI

**Files:**
- Create: `frontend/src/features/admin-telegram/admin-telegram-settings.tsx`
- Create: `frontend/src/features/admin-telegram/admin-telegram-settings.test.tsx`
- Modify: `frontend/src/views/dashboard.tsx`
- Modify: `frontend/src/widgets/dashboard-nav.ts`
- Modify: `frontend/src/widgets/dashboard-shell.tsx`
- Modify: `frontend/src/shared/i18n/messages.ts`

**Step 1: Write failing component/navigation tests**

Test the admin-only settings screen’s unlinked and linked states, the primary button calling `/admin/telegram/link`, the returned bot URL opening safely in a new tab, and errors producing the existing toast pattern. Test admin navigation exposes Settings while investor navigation stays unchanged.

**Step 2: Run the focused test to verify it fails**

Run: `cd frontend && bun test src/features/admin-telegram/admin-telegram-settings.test.tsx src/widgets/dashboard-nav.test.ts`

Expected: FAIL because the feature is absent.

**Step 3: Implement the UI**

Render a compact card using existing `Card`, `Button`, badge, and `Link2`/`Send` icons. Clearly explain the two steps: generate the link and press Start in Telegram. Use Uzbek and Russian messages for headings, linked/unlinked state, reconnect action, and error/success feedback. Route `settings` to this component for admin users and display its navigation entry in the existing settings area.

**Step 4: Run focused tests**

Run: `cd frontend && bun test src/features/admin-telegram/admin-telegram-settings.test.tsx src/widgets/dashboard-nav.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/features/admin-telegram frontend/src/views/dashboard.tsx frontend/src/widgets/dashboard-nav.ts frontend/src/widgets/dashboard-shell.tsx frontend/src/shared/i18n/messages.ts
git commit -m "feat: let admins link Telegram notifications"
```

### Task 6: Make the Telegram dashboard link open the exact application

**Files:**
- Modify: `frontend/src/app/dashboard/applications/page.tsx`
- Modify: `frontend/src/views/dashboard.tsx`
- Modify: `frontend/src/features/admin-applications/admin-applications.tsx`
- Modify: `frontend/src/features/admin-applications/admin-applications.test.tsx`
- Modify: `frontend/src/views/dashboard/use-dashboard-session.ts`
- Modify: `frontend/src/views/dashboard/use-dashboard-session.test.ts`

**Step 1: Add failing deep-link and auth-return tests**

Render the applications feature with a valid initial ID and mock a list that excludes it; assert it performs `GET /admin/applications/<id>` and opens the existing Sheet with that response. Test invalid/missing IDs do not request data. Test unauthenticated dashboard access redirects to localized login with the full `/dashboard/applications?application=<id>` `returnTo` value.

**Step 2: Run focused tests to verify they fail**

Run: `cd frontend && bun test src/features/admin-applications/admin-applications.test.tsx src/views/dashboard/use-dashboard-session.test.ts`

Expected: FAIL because query selection and return preservation are missing.

**Step 3: Implement the deep-link path**

Read `application` from the page’s `searchParams`, validate it before passing it through `DashboardView`, and let `AdminApplications` fetch the existing admin-only detail endpoint independently of pagination/filtering. Preserve a selected off-page result when the list refreshes. In `useDashboardSession`, use `withReturnTo` with pathname, search, and hash before redirecting to login; retain `safeReturnTo` as the open-redirect control.

**Step 4: Run focused tests**

Run: `cd frontend && bun test src/features/admin-applications/admin-applications.test.tsx src/views/dashboard/use-dashboard-session.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/dashboard/applications/page.tsx frontend/src/views/dashboard.tsx frontend/src/features/admin-applications/admin-applications.tsx frontend/src/features/admin-applications/admin-applications.test.tsx frontend/src/views/dashboard/use-dashboard-session.ts frontend/src/views/dashboard/use-dashboard-session.test.ts
git commit -m "feat: open Telegram-linked admin applications"
```

### Task 7: Full quality gate and manual Telegram verification

**Files:**
- Modify: `docs/release-qa-checklist.md`

**Step 1: Add release verification steps**

Document: configure secrets, set the Telegram webhook secret URL, link the single admin from Settings, submit an available-object application, confirm one polished message and secure dashboard open, submit the duplicate again, and verify no second alert. Include an unavailable bot scenario that confirms the investor still receives application success.

**Step 2: Run backend quality gates**

Run: `cd backend && bun run lint && bun run format:check && bun run test:coverage`

Expected: PASS with existing coverage thresholds.

**Step 3: Run frontend quality gates**

Run: `cd frontend && bun run lint && bun run test:coverage && bun run build`

Expected: PASS.

**Step 4: Run relevant E2E after Docker is healthy**

Run: `docker compose up --build --wait && cd frontend && E2E_API_READY=1 bunx playwright test e2e/investor-journey.spec.ts e2e/application-lifecycle.visual.spec.ts --project=desktop-chromium`

Expected: PASS; record any inability to exercise live Telegram as configuration-dependent.

**Step 5: Commit documentation**

```bash
git add docs/release-qa-checklist.md
git commit -m "docs: verify Telegram application notifications"
```
