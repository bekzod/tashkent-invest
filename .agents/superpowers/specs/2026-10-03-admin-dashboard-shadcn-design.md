# Admin Dashboard shadcn Migration Design

## Goal

Replace the admin dashboard's native form controls and hand-built interactive
surfaces with reusable shadcn-style components, while preserving routes,
business behavior, localization, and the established desktop/mobile layout.

## Scope

The migration covers the admin dashboard shell and all admin routes:

- `DashboardShell`: locale selector, notification panel, profile menu, icon
  actions, and navigation controls.
- `AdminOverview`: metric and onboarding surfaces.
- `AdminObjectsList`: search, status filter, object actions, table, archive
  confirmation, and server pagination.
- `AdminApplications`: status filter, application selection, review note, and
  status transition actions.
- `ObjectEditor`, `LocationPicker`, and `LotBoundaryEditor`: selects, text
  inputs, textareas, checkboxes, form actions, and editing controls.

MapLibre canvases and their map interactions remain domain-specific; only their
surrounding controls migrate to the shared UI layer.

## Architecture

`src/components/ui` remains the only primitive layer. Add the missing
shadcn-style primitives there: `Select`, `DropdownMenu`, `Popover`, `Dialog`,
`Card`, `Table`, and `Separator`. Existing `Button`, `Input`, `Textarea`,
`Label`, `Checkbox`, `Badge`, and `Skeleton` remain the base controls.

`src/shared/ui` composes those primitives into domain-neutral patterns:

- `DataTable` for reusable admin tables and loading/empty states.
- `Pagination` for server-backed pagination.
- dashboard header/action helpers where that removes repeated accessibility and
  interaction code.

Feature components own data fetching, local state, localization, and API calls.
They select variants from the shared layer rather than introducing per-screen
button, select, menu, or dialog implementations.

## Interaction and Feedback

- Locale and profile actions use accessible menus, with keyboard navigation and
  Escape/outside-close semantics supplied by Radix primitives.
- Notification content uses a popover rather than a manually positioned dialog.
- Archiving uses a confirmation dialog; transitions and API failures continue
  using the existing Sonner feedback service.
- Empty, loading, disabled, and destructive states use standard component
  variants. Field-level validation remains near its associated control.

## Styling

Retain the dashboard page geometry and semantic color tokens. Remove CSS that
only exists to imitate primitive interaction states, and style variants through
the shared components. Tables remain horizontally scrollable on narrow screens;
all touch targets preserve a minimum 44px height.

## Verification

- Add focused tests for locale selection, profile and notification menus,
  archive confirmation, select filters, pagination, and editor controls.
- Run the full frontend test suite, lint, and production build.
- Perform browser checks across admin overview, objects, applications, and the
  new/edit object workflow at desktop and mobile widths.
