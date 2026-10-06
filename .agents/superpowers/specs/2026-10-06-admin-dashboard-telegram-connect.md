# Admin Dashboard Telegram Connect Implementation Plan

> **For AGENTS:** REQUIRED SUB-SKILL: Use executing-plans skill to implement this plan task-by-task.

**Goal:** Put a secure, state-aware Telegram connection action in the admin dashboard header.

**Architecture:** Reuse the existing `/api/admin/telegram` status and `/api/admin/telegram/link` endpoints; do not duplicate payload or webhook logic. A client header action loads the connection state, creates a Telegram start URL only while unlinked, and routes a linked admin to Settings.

**Tech Stack:** Next.js, React, TypeScript, Vitest, existing UI components and API client.

---

### Task 1: Test and add the reusable dashboard action

**Files:**
- Create: `frontend/src/features/admin-telegram/admin-telegram-connect-action.tsx`
- Create: `frontend/src/features/admin-telegram/admin-telegram-connect-action.test.tsx`
- Modify: `frontend/src/features/admin-objects/admin-overview.tsx`

**Step 1: Write the failing component tests**

Mock `GET /admin/telegram` and `POST /admin/telegram/link`. Assert an unlinked admin sees `Telegram botni ulash`, opens only a returned `https://t.me` URL with `noopener,noreferrer`, and a linked admin sees `Telegram ulangan` leading to `/dashboard/settings`.

**Step 2: Run the focused test**

Run: `cd frontend && bunx vitest run src/features/admin-telegram/admin-telegram-connect-action.test.tsx`

Expected: FAIL because the action does not exist.

**Step 3: Implement the minimum component and wire it into the page header**

Use the established API client and language messages. Render it beside the existing New Object action in `AdminOverview`; preserve the existing Settings page for the longer guided flow.

**Step 4: Run focused tests, lint, and build**

Run: `cd frontend && bunx vitest run src/features/admin-telegram/admin-telegram-connect-action.test.tsx && bun run lint && bun run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/features/admin-telegram/admin-telegram-connect-action.tsx frontend/src/features/admin-telegram/admin-telegram-connect-action.test.tsx frontend/src/features/admin-objects/admin-overview.tsx
git commit -m "feat: add Telegram connect action to admin dashboard"
```
