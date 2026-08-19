# Admin investment objects design

## Goal

Give hokimlik administrators a clear, desktop-first workspace to create, edit,
publish, archive, and map investment objects without exposing incomplete drafts
to investors.

## Confirmed decisions

- The first media version stores HTTPS media URLs, not uploaded files.
- A virtual tour is a publicly reachable equirectangular 360° panorama URL.
- An object is created as a draft and becomes investor-visible only after an
  explicit publish action.
- The existing OSM / MapLibre map is reused for marker placement and polygon
  drawing.
- The investor dashboard remains separate from `/admin`; every admin API route
  requires an `admin` JWT role.

## UX

`/admin/objects` is an inventory table with search, status/type filters,
preview counts, and a persistent “Yangi obyekt” action. A row opens the edit
workspace.

The create and edit workspace is a five-step desktop wizard. It has a visible
progress indicator, a single primary action, validation next to the relevant
field, and a non-destructive “Qoralama saqlash” action.

1. **Asosiy** — Uzbek/Russian titles, descriptions, district, cadastral number,
   object type, and sector.
2. **Joylashuv** — marker is placed by clicking the map; an optional exact
   boundary is drawn as a polygon. Coordinates and area are shown as readable
   values before continuing.
3. **Shartlar** — land/building/usable area, investment amount, jobs,
   utilities, legal/construction details, benefits, allowed business and
   auction details.
4. **Media** — repeatable URL cards for images, drone video, document, and a
   single virtual tour. Each card previews its URL and describes the allowed
   format. A virtual-tour card accepts a 2:1 equirectangular JPG/WebP URL.
5. **Ko‘rib chiqish** — a compact investor-card preview, validation summary,
   and “Nashr qilish” confirmation.

## Architecture

The `users.role` enum grows from `investor` to `investor | admin`. A reusable
`ensureAuth('admin')` guard protects a new `/api/admin/objects` resource.
The server validates and writes all object, translation, media, and optional
geometry data in a transaction. Public object endpoints exclude `draft` and
`archived` records.

Media remains in `object_media`. The existing `virtual_tour` kind stores a
panorama URL. The object detail page renders it through a client-only
Pannellum viewer. Pannellum supports equirectangular panoramas directly, while
its later multiresolution configuration gives us a no-schema-change upgrade
path for large imagery.

No media binary is accepted in this phase. When an upload provider is chosen,
the URL card will be replaced by a signed-upload action; the API will retain
the same persisted media URL shape.

## Data and validation

- Add statuses `draft` and `archived` alongside `available`, `auction`, and
  `upcoming`.
- Add `geometry` JSONB to `investment_objects`; point coordinates remain the
  canonical marker location.
- Require Uzbek title, district, cadastral number, type, status, coordinates,
  land or building area, investment amount, and at least one selected sector
  to publish. Drafts may be incomplete.
- Require a valid `https:` URL for media; cap each object at 20 media records,
  10 images, one virtual tour, and one auction URL.
- Do not trust a browser file-type filter as security. This phase has no binary
  uploads; later uploads will validate extension, MIME, content, size, naming,
  and storage isolation server-side.

## Testing and acceptance criteria

- Unit tests cover admin payload normalization, draft/publish rules, public
  visibility filtering, and media URL validation.
- API tests cover unauthenticated and investor rejection, admin create/update,
  archive, and public exclusion of drafts/archived objects.
- Frontend tests cover wizard step validation, review summary, and role guard.
- Manual smoke test: login as seeded admin, save an incomplete draft, position
  an object on the map, add a panorama URL, publish it, verify it appears on
  `/map`, and archive it to verify removal.

## External research used

- Pannellum accepts an equirectangular panorama URL and supports equirectangular,
  cubemap, and multiresolution formats. For first release, a 2:1 JPG/WebP URL
  keeps the admin workflow simple. [Pannellum overview](https://pannellum.org/documentation/overview/)
  and [reference](https://pannellum.org/documentation/reference/).
- Photo Sphere Viewer offers a future virtual-tour plugin path for linked
  panoramas and hotspots. [Plugin overview](https://www.mintlify.com/mistic100/Photo-Sphere-Viewer/plugins/overview).
- File pickers' `accept` attribute only guides the user; server-side validation
  is required for a future upload flow. [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept)
  and [OWASP file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
