# Lot boundary editor design

## Goal

Make the admin lot-boundary workflow understandable, reliable, and equally
usable with a mouse or touch. An object's latitude and longitude identify its
location marker; they must never be treated as a complete boundary. A boundary
is an administrator-drawn polygon with at least three vertices.

## Confirmed product decisions

- Do not infer or save an approximate polygon from a single location point.
- A valid object location is shown immediately as a marker and the boundary map
  centres on it.
- Administrators draw the real boundary directly on the map by click or tap.
- Precise coordinate entry remains available as a secondary path.
- The existing MapLibre editor and GeoJSON/server validation contract remain in
  use; no drawing-library dependency is added.

## Root cause to fix

`Number("")` evaluates to `0`. The current boundary editor therefore treats an
empty latitude/longitude pair as the valid point `[0, 0]`, opens at high zoom
over the Gulf of Guinea, and never responds to later location edits. Vertices
entered for Tashkent exist off-screen, which appears as an empty map and a
missing shape.

## User journey

1. The location step shows the district outline, an object-location marker when
   coordinates are valid, and a usable map state: loading, ready, or retryable
   error.
2. The lot-boundary map uses the object marker as its initial focus. Before a
   location is selected, it opens over Tashkent district and explains that a
   location is needed to validate the boundary.
3. Selecting **Chegarani chizish** enables drawing and exposes a compact map
   overlay with the current step, for example `1 / 3 nuqta`.
4. Each click or tap adds a numbered draggable vertex. One vertex shows a point,
   two show a line, and three or more show the closing, translucent polygon in
   real time.
5. The user may drag a vertex, undo the last vertex, or cancel to restore the
   saved boundary. The final action is enabled at three vertices and validates
   before it changes the object form.
6. An expandable precise-coordinate section accepts longitude and latitude,
   inserts the vertex, and moves the map so the new point is visible.
7. Clearing a boundary is a destructive, confirmable action. It removes the
   saved geometry only after confirmation.

## Components and state

- `LotBoundaryEditor` owns map lifecycle and coordinates the interaction.
- A focused boundary-draft helper owns immutable vertex operations, draft
  GeoJSON generation, and user-facing progress state so it can be unit-tested.
- MapLibre layers are explicit and ordered: raster base, district boundary,
  object marker, draft fill, draft line, and numbered vertex points.
- Map state is modelled as `loading`, `ready`, or `error`; editing state is
  separate as `idle`, `drawing`, or `validating`.
- The editor reacts to the current latitude/longitude props instead of only the
  values from its first render. Empty strings and incomplete pairs are not
  coordinates.

## Validation and recovery

- Retain server-compatible validation for invalid coordinates, fewer than three
  points, self-intersection, non-positive area, district containment, and
  object-marker containment.
- Explain each invalid state next to the relevant action and use the shared
  toaster for final error or success feedback.
- Report tile/style load failures in the map itself with a retry action. Do not
  leave a blank or solid-colour map that looks successful.
- Preserve a previously saved geometry while a new draft is being edited;
  cancelling must restore it exactly.

## Media input group

The media type selector, URL field, and remove action form one reusable
shadcn-style input group instead of three visually independent controls. The
group owns the outer border, radius, and focus ring; its children are divided
only by internal separators. The URL input remains the flexible-width control,
the type selector has a stable width, and the remove action is a 44px icon
button with an accessible label and tooltip.

On narrow screens the controls may wrap into two connected rows, but they must
continue to read as one field group. URL validation is rendered immediately
below the group. The separate **Media qo'shish** button remains a secondary
action. Implement the shell as a shared UI primitive so future select-input-
action combinations reuse the same layout, focus, disabled, and error states.

## Test plan

- Unit tests cover empty coordinates, reactive map focus, draft stages,
  coordinate insertion, vertex moving, undo, cancel, clear, and every boundary
  validation code.
- Desktop and mobile Playwright flows create a new object, set its location,
  draw by map click/tap, drag a vertex, add a coordinate vertex, validate
  failures, save, reload, and confirm the public map renders the saved boundary.
- Map failure coverage verifies the user sees a retryable error instead of an
  empty map.
- Visual tests capture the idle editor, one/two/three-point drawing stages,
  completed polygon, and the mobile layout. Real tile availability is checked
  separately from deterministic visual-tile snapshots.
- Media tests cover type selection, URL editing and validation, adding and
  removing rows, keyboard focus order, and the connected desktop/mobile
  layout.

## Acceptance criteria

- A blank object location never centres a map on `[0, 0]`.
- A valid location marker and all added vertices are visible without manual
  searching for the map area.
- Map drawing works with mouse and touch; each state has clear progress and an
  obvious next action.
- A valid boundary can be saved, re-opened, and viewed on the public map.
- Every media row presents its selector, URL, and remove action as one
  accessible input group on desktop and mobile.
- All relevant unit, end-to-end, mobile, and visual checks pass.
