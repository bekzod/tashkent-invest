# API resilience and loading-state design

## Context

The deployed frontend requests the Render backend without its required `/api`
prefix, so `/objects/map` responds with 404 while `/api/objects/map` succeeds.
The home page and map silently replace failed API responses with empty content,
which leaves blank space rather than a loading or error state. Map refreshes are
also triggered by load, viewport movement, and filters without cancellation or
debouncing, adding avoidable latency.

## Chosen approach

Implement a code-only resilience layer. It must work with the currently
deployed API base URL and must not require a Vercel environment-variable
change.

### API URL contract

Create one shared API-base resolver used by browser requests and server-side
SEO requests. It trims the configured URL and appends `/api` when the URL is a
host origin without that prefix. Existing URLs that already end in `/api`
remain unchanged. The resolver becomes the only source of endpoint assembly.

### Loading and failure experience

The landing page receives explicit request state for its statistics and
featured objects. While a request is pending it renders content-shaped
skeletons; on failure it shows an actionable error state and retry control
instead of silently rendering empty sections.

The map has an independent loading overlay and an accessible failure state.
Previously loaded features stay visible while a newer request is pending, so a
pan or filter change does not blank the map.

### Map request lifecycle

Debounce viewport-driven requests, abort an obsolete request before dispatching
a replacement, and ignore late responses using a request identity. Filter and
locale changes use the same lifecycle. This preserves the latest viewport as
the only authoritative result and reduces unnecessary backend/DB work.

### Performance observability

Add a lightweight server-timing measurement for public API requests so the
browser can distinguish backend/DB time from network time. This will confirm
whether any remaining latency is caused by the currently separate Render
service and PostgreSQL regions. Co-locating those services is an
infrastructure follow-up, outside this code-only change.

## Verification

- Unit-test API-base normalization with URLs both with and without `/api`.
- Test home and map pending, error, retry, cancellation, and latest-response
  behavior.
- Keep existing API route tests green and add a timing-header assertion.
- Run the relevant frontend/backend test suites, lint, type/build checks, and
  manually verify the deployed-style API URL against the map endpoint.
