# Tashkent Invest MVP Design

## Goal

Build a bilingual (`uz`, `ru`) investment-object portal for Tashkent. Investors must be able to find mock investment opportunities on an interactive map, filter them, review a detailed object page, and submit a protected interest application.

## Architecture

The repository is a modular monolith:

```text
tashkent-invest/
├── frontend/          Next.js App Router application
├── backend/           Bun, Fastify, Sequelize API
├── docker-compose.yml PostgreSQL and both applications
└── README.md
```

The frontend and backend remain independently runnable services. The frontend consumes the backend API for all object, statistic, authentication, and application data. PostgreSQL holds seeded mock data so that real data imports can replace it later without changing client contracts.

The frontend follows the relevant Yukon CRM frontend stack: Next.js 16, TypeScript, Tailwind 4, Vitest, and Playwright. The backend follows Yukon CRM's Bun, Fastify, Sequelize, migration, router, and Bun test conventions. Yukon business-domain models are not reused.

## Internationalization

The initial UI languages are Uzbek Latin and Russian. The default is Uzbek. A client-side language provider writes the selected language to `localStorage` under `tashkent-invest.locale`; URLs do not contain locale segments or query parameters. UI translations are dictionaries and object content is returned in the selected language using the request language value. The first server render is Uzbek and the saved client preference is applied after hydration.

## User-facing routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page: hero, search, statistics, map preview, popular objects, categories, process explainer, subscription CTA. |
| `/map` | Full map with result list, filters, search, draw/clear controls, and object preview. |
| `/objects/[slug]` | Object detail with gallery placeholders, map position, properties, conditions, media/document placeholders, and conversion CTAs. |
| `/login` | Mock investor login. |
| `/profile` | Authenticated investor's submitted applications and favourites. |

The supplied screenshots define the product direction, not pixel-for-pixel implementation.

## Map design

MapLibre GL JS renders the Tashkent map. An OpenStreetMap-compatible tile URL is configured with an environment variable, allowing a production provider to be substituted without code changes.

Object markers are a GeoJSON source and layer. Marker colours represent the required object class or status:

- green: land;
- blue: completed building;
- yellow: investment proposal;
- red: auction active;
- purple: upcoming auction.

The map supports pan, zoom, mobile touch, marker hover preview, marker click selection, result-card highlighting, clustering, freehand polygon drawing, and removing the drawn boundary. After map movement settles, a request is made using the current bounding box. Search, filters, and a drawn polygon are included in the same request; returned objects update both markers and cards.

The map endpoint returns a GeoJSON `FeatureCollection` whose feature properties include the object ID, title, type, status, preview fields, and marker metadata.

## Data model

- `users`: seeded mock investor and password hash.
- `investment_objects`: stable/shared object fields: slug, coordinates, type, status, district, cadastral number, areas, investment amount, auction URL/timing, and structured technical/legal information.
- `investment_object_translations`: per-language title, descriptions, address, and business-sector text.
- `object_media`: mock image, video, virtual-tour, and document URLs.
- `applications`: authenticated investor's interest/application record.
- `favorites`: object-to-investor follows.
- `notification_subscriptions`: persisted future-auction notification intention, with no outbound delivery in this release.

Seeds include at least 20--30 varied Tashkent objects across districts, object types, statuses, and business sectors.

## API surface

```text
GET  /api/statistics
GET  /api/filters
GET  /api/objects
GET  /api/objects/map
GET  /api/objects/:slug
POST /api/auth/login
GET  /api/auth/me
POST /api/applications
GET  /api/me/applications
POST /api/favorites/:objectId
DELETE /api/favorites/:objectId
POST /api/notification-subscriptions
```

The map endpoint accepts `bbox`, `types`, `statuses`, `sectors`, area/investment bounds, a search query, and a GeoJSON polygon. It only returns objects in the viewport and, when supplied, inside the polygon. Public object endpoints require no token; mutation/profile endpoints require the mock JWT.

Validation is limited to structural correctness: valid enum values, numeric ranges, valid GeoJSON, required application fields, and ownership checks. It deliberately avoids excessive form validation.

## Mock authentication

The backend exposes a login endpoint for a seeded investor. It verifies the seeded password hash and returns a short-lived JWT. The frontend stores the session in localStorage for the demo. A failed or expired token clears the local session and redirects protected actions to login. Real registration, recovery, SMS, OAuth, and production session security are explicitly future work.

## Failure behavior

- API loading and mutation failures show a localized retryable state without breaking layout.
- Invalid filters or polygons return a structured `400`; a missing object returns `404`.
- Tile failures do not hide the object list/cards.
- The map and form have loading, empty, and retry states.

## Quality gates

- Backend Bun tests cover mock login, public lists/details, map bbox/polygon filtering, and application/favourite authorization.
- Frontend Vitest covers language persistence, API client behavior, filters, and key forms/cards.
- Playwright covers login, selecting a map marker, opening an object, and submitting an application.
- Final checks run frontend lint/build/test, backend lint/format/test, and a Docker Compose smoke test.

## Out of scope for this MVP

- Real auction bidding or direct auction-system integration.
- Outbound email, push, or Telegram notifications.
- Real authentication, registration, password recovery, OAuth, or SMS.
- Admin CMS, cadastral integration, and production data import.
- Producing real drone, 360-degree, video, or document assets; placeholders are supported.
