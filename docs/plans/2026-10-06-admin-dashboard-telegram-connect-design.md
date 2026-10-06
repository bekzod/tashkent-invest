# Admin dashboard Telegram connect — design

## Goal

Make the existing secure Telegram linking flow immediately accessible from the
admin dashboard home page.

## Design

The dashboard header will show a `Telegram botni ulash` secondary action beside
`Yangi obyekt` while no Telegram chat is linked. It uses the existing protected
`POST /api/admin/telegram/link` endpoint to create a one-use, ten-minute Telegram
start payload and opens the returned `t.me` URL in a separate protected tab.

The backend webhook remains the authority: after the administrator presses Start,
it validates the payload, the webhook secret, active account, and `admin` role,
then saves the chat ID in `users.telegram_chat_id`. Once linked, the dashboard
action changes to `Telegram ulangan` and opens Telegram settings rather than
creating another token.

## Verification

Add a component test for both unlinked and linked header states, the protected
link request, and the safe Telegram window open. Run focused frontend tests,
lint, coverage, and production build.
