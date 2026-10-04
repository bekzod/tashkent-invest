# Dashboard Loading System Design

## Problem

The authenticated dashboard currently renders a plain `Kabinet yuklanmoqda...` line while the local session is being resolved. This removes the application shell, gives no indication of the page structure, and causes a full-page layout shift when the dashboard appears. Data-level loading states also use unrelated skeleton dimensions, so tables, cards, forms, and maps do not feel like one product.

## Design Direction

Use structural skeletons that mirror the final interface. The first dashboard render must immediately show a neutral sidebar, topbar, page heading, and a content skeleton appropriate for the requested route. Once the session is available, the real role-aware shell replaces it. Subsequent data loading keeps the shell visible and replaces only the relevant content region.

## Architecture

- `DashboardLoadingShell` owns the route-level shell placeholder. It mirrors the stable desktop and mobile dashboard geometry without exposing role-specific navigation labels before the session is known.
- `DashboardPageSkeleton` owns content presets: `overview`, `table`, `grid`, `form`, and `map`.
- Small reusable skeleton parts cover page headers, filters, metrics, rows, cards, and form fields.
- `DashboardView` maps the active section to a preset and uses the shell while `useDashboardSession` is unresolved.
- Admin guards and page-level loaders reuse the same presets instead of rendering standalone rectangles.

## Visual Rules

- Reuse the existing shadcn `Skeleton` primitive and design-system spacing tokens.
- Preserve the dashboard's compact operational density, 8px control radius, subtle borders, and neutral blue-gray palette.
- Skeleton geometry should approximate real content but must not imitate readable text.
- Avoid a full-screen spinner, logo animation, decorative gradients, or long loading copy.
- Do not animate when `prefers-reduced-motion: reduce` is active.

## Accessibility

- The loading region uses `role="status"`, `aria-live="polite"`, and localized visually hidden text.
- Decorative skeleton blocks remain `aria-hidden` through the existing primitive.
- The shell uses `aria-busy="true"` while loading.
- Skeletons are non-interactive and cannot receive focus.

## Behavior

- Initial session resolution: render the route-aware loading shell.
- Initial data request: render the matching page skeleton inside the real shell.
- Refetch caused by filters or pagination: retain stable page chrome and use local pending feedback where practical.
- Failure: stop loading and render the existing `ErrorState` with retry behavior.
- Empty result: render `EmptyState`; never leave a skeleton visible after a completed empty response.

## Verification

- Component tests cover route-to-preset mapping and accessible loading semantics.
- Existing dashboard unit tests must remain green.
- Desktop and mobile screenshots verify stable shell geometry and no horizontal overflow.
- Lint and production build validate integration.
