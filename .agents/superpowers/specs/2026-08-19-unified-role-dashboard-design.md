# Unified role dashboard design

## Goal

Use one Yukon CRM-derived dashboard visual system for every authenticated role.
The visible navigation and accessible pages differ by role, but the sidebar,
topbar, breadcrumbs, layout density, and responsive behaviour do not.

## Scope

- Use a single `/dashboard/*` route tree for every authenticated user.
- Replace the separate `AdminShell` with the existing dashboard shell.
- Keep admin-only authorization checks around `/admin/*`.
- Show investor navigation for investors and management/object navigation for
  admins.
- Remove the dark, admin-specific shell styles once unused.

## Architecture

1. Extract the shared structural markup from `DashboardView` into a reusable
   shell that receives the role, active navigation item, breadcrumbs, and
   page content.
2. Investor pages continue to provide their current content to the shell.
3. The same `/dashboard` URL resolves to investor or admin content according
   to `session.user.role`.
4. Admin object CRUD stays within the shared route tree:
   `/dashboard/projects`, `/dashboard/projects/new`, and
   `/dashboard/projects/[id]/edit`.

## Navigation

Investor:

- Overview, map, projects, applications, favourites, profile, settings.

Admin (the same `/dashboard/*` paths):

- Overview, objects, create object.

The shared shell always has the same brand row, collapse control, topbar,
breadcrumb treatment and account/logout controls. Role-specific items are
derived from the authenticated session and never rendered for the wrong role.

## Validation

- Unit test role-based navigation selection.
- Update Playwright admin/investor tests to assert a common dashboard shell,
  common `/dashboard` URLs, and role-specific navigation.
- Run frontend lint, unit tests, E2E, and production build.
