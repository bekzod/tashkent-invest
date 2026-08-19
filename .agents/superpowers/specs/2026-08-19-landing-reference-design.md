# Landing Reference Alignment Design

## Goal

Make the desktop landing page closely follow the supplied Invest Tuman reference while preserving the existing Next.js routes, API contracts, bilingual local-storage language state, and responsive layout.

## Reference composition

At desktop width, the page uses a compact 52px header, a three-column hero (copy/statistics, interactive map, floating filter card), a content row with four popular-object cards and a process sidebar, a horizontal category strip, and a blue email-notification banner.

The page is aligned to a centred 1160--1200px content area. The visual hierarchy prioritises the investment headline, search, map, and primary map CTA. The screenshot is a layout and visual direction reference; real object content remains backed by the local mock API.

## Map fix

MapLibre currently requests `https://{s}.tile.openstreetmap.org/...`, which fails because MapLibre does not expand the `{s}` hostname placeholder in this raster source. Use `https://tile.openstreetmap.org/{z}/{x}/{y}.png` as the safe default and local environment value. The API/map object source remains unchanged.

## Responsive behavior

Desktop uses the reference hierarchy. Below 900px, filters collapse above the map and the popular-object grid / process sidebar stack vertically. The map remains functional and the existing full map page stays separate.

## Verification

Use a Playwright screenshot and console network inspection to confirm successful OSM tile responses, a non-empty canvas, marker display, and visual alignment at a 1280px desktop viewport. Run frontend lint, unit tests, and production build.
