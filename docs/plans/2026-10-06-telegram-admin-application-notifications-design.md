# Telegram admin application notifications — design

## Goal

Send each newly created investor application to the one authorised administrator's
Telegram chat, with a secure dashboard link that opens the exact application.

## Decisions

- The Telegram recipient is linked to an existing, active user with the `admin`
  role. A chat ID is never taken from the applicant's `telegram` field or trusted
  merely because it is configured in a request.
- The administrator starts the connection from the authenticated dashboard. The
  server issues a short-lived, one-use token; the bot receives `/start <token>`
  through a webhook and binds the chat only after validating the token, role,
  active status, and Telegram webhook secret.
- A successful application is committed before any Telegram request. The API
  returns its normal success response even if Telegram is unavailable, while the
  server records a sanitised delivery failure in its log. Duplicate submissions do
  not generate another notification.
- The inline keyboard uses a normal URL button rather than a Telegram callback.
  It opens `/dashboard/applications?application=<uuid>`, which stays protected by
  existing dashboard authentication and the admin role check.

## Data model and configuration

Add nullable, unique Telegram binding fields to `users` for the recipient chat
and its binding time. The bot configuration remains server-only:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `APP_PUBLIC_URL` — the one canonical public frontend URL used in Telegram links

No Telegram secret, webhook secret, or bot token is sent to the browser.

## Application flow

1. An investor submits an application as today.
2. After the application transaction commits and only when it was newly created,
   the API asks the notifier to deliver it to the linked active admin.
3. The notifier fetches the object title, formats an HTML-escaped and
   Telegram-length-safe Uzbek message, and calls Telegram `sendMessage` with
   `disable_web_page_preview` and one inline URL button.
4. The administrator taps `📂 Arizani kabinetda ochish`. If not signed in, the
   dashboard preserves the full deep link through login; after authentication the
   existing application detail sheet opens from an admin-only API request.

## Message design

The notification begins with `🔔 Yangi investor arizasi` and presents the object,
applicant, organisation and country when present, investment amount, contact
details, project description, comment, creation time, and `📌 Qabul qilindi`
status. Optional empty fields are omitted, untrusted content is HTML-escaped, and
long text is truncated so Telegram's 4,096-character message limit is respected.

## Error handling and scope

Bot interaction is limited to the connection `/start` command; the button does
not change application status. Invalid or expired link tokens, non-admin users,
and webhook requests without the configured secret are rejected. Telegram
delivery errors are isolated from investor submission and logged without secrets
or applicant message contents. A persistent retry queue is intentionally out of
scope for this first integration because the application has no job runner; it can
be added later if delivery guarantees become a product requirement.

## Verification

Backend tests cover link-token and webhook authorisation, message formatting and
escaping, one notification for one new application, no notification for a
duplicate, and non-blocking delivery failures. Frontend tests cover the deep link
opening an off-page application and preserving it through login. Run the existing
backend/frontend lint, formatting, coverage, build, and relevant E2E quality
gates.
