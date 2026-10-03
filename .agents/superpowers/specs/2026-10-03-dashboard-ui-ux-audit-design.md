# Dashboard UI/UX Audit and Refactor Design

## Goal

Create one coherent, compact, accessible dashboard experience for the two
authenticated roles: investor and administrator. The work covers every
role-protected `/dashboard/**` route. Public pages will be audited in a separate
follow-up phase so the dashboard can reach a stable design contract first.

The refactor preserves business rules and API contracts. It improves page
composition, responsive behavior, loading and error states, navigation,
accessibility, and the reuse of design-system components.

## Reference Systems

Three existing repositories define the target quality bar:

- `yukon-crm`: token-first design decisions, strict shared UI ownership,
  compact dashboard density, page headers, form sections, and role-neutral
  shell architecture.
- `pharmacy-front`: responsive data tables, mobile list alternatives, filter
  toolbars, empty and loading states, and practical dashboard composition.
- `smeta`: simple form composition, restrained abstractions, and centralized
  mutation feedback.

The project will adopt their shared principles, not copy product-specific
visuals or business components.

## Current Audit

### Structural issues

- Investor dashboard routes are composed in one large `dashboard.tsx` module.
- Every investor route loads statistics, projects, applications, and favorites,
  even when the active page does not need them.
- Page headings, actions, toolbars, cards, and state handling are inconsistent.
- Some profile and settings actions are visible but have no behavior.
- The global stylesheet contains repeated dashboard-specific typography,
  spacing, color, and surface decisions.
- Admin pages use denser patterns than investor pages, so the two roles do not
  feel like one product.

### UX issues

- Several pages lack a clear title and primary action.
- Loading is sometimes represented by plain text or punctuation instead of a
  layout-preserving skeleton.
- Empty states do not consistently explain the next useful action.
- Desktop tables do not have an explicit mobile list model.
- Map filters and results compete for limited mobile space.
- Settings and profile pages contain dead-end controls.
- The admin overview has little operational value beyond three totals.

### Baseline assessment

The dashboard is functional but visually and behaviorally fragmented. Its
starting UI/UX score is 5.5/10. The refactor target is a consistent operational
dashboard where every route has a clear purpose, reliable state handling, and
an intentional mobile layout.

## Design Direction

The dashboard is quiet, compact, and work-focused:

- Neutral application background and white working surfaces.
- Existing brand blue as the single primary accent for both roles.
- Role differences are communicated through navigation and permissions, not a
  separate color theme.
- Borders provide most grouping; shadows are subtle and limited.
- Card radius is no more than 8px unless an existing primitive requires it.
- Normal controls are 40-44px high with consistent icon sizing.
- Page content uses a stable width and spacing scale. Map pages may opt into a
  full-width workspace.
- Typography stays compact: page title, section title, card title, body, and
  caption are reusable roles rather than per-page decisions.

## Design-System Architecture

### Primitive layer

`src/components/ui` remains the shadcn/Radix primitive layer. Buttons, inputs,
selects, dialogs, dropdowns, popovers, cards, tables, checkboxes, textareas,
skeletons, separators, and toasts must come from this layer.

### Product UI layer

Reusable dashboard compositions live in `src/shared/ui`:

- `PageLayout`
- `PageHeader`
- `FilterToolbar`
- `StatCard`
- `DataTable`
- `MobileCardList`
- `EmptyState`
- `ErrorState`
- `LoadingState`
- `FormSection`
- `StatusBadge`
- `ServerPagination`

These components own shared density, typography, responsive behavior, and
accessibility. Feature modules supply business data and actions.

### Page ownership

Route files remain thin. Investor and administrator page views are split by
workflow so each route owns only the data and state it needs. The common
`DashboardShell` owns role navigation, breadcrumbs, language selection,
notifications, profile actions, and responsive navigation.

### Tokens

Dashboard colors, spacing, typography, control sizes, radii, borders, and
elevation become documented semantic variables consumed by primitives and
shared compositions. Product pages must not introduce one-off raw visual
values when an existing semantic role applies.

## Shell and Navigation

### Desktop

- Collapsible sidebar with role-filtered navigation.
- Compact top bar with breadcrumb, page action slot, language selector,
  notifications, and profile menu.
- Keyboard-visible focus states and accessible labels for every icon action.
- Stable page gutter and content width; map routes use a full workspace mode.

### Mobile

- Compact top bar with menu trigger, current page title, and essential actions.
- Navigation opens in a shadcn `Sheet`.
- Tables switch to task-oriented mobile cards rather than horizontal scrolling.
- Primary actions remain reachable without covering content.

## Administrator Pages

### Overview

- Shared page header with `Yangi obyekt` primary action.
- Metrics for total, published, draft, and applications requiring review.
- Recent objects section with status, location, and edit action.
- Operational empty state when no objects exist.

### Objects

- Search, status filter, and create action in one responsive toolbar.
- Dense desktop table with object, location, status, media count, and row menu.
- Mobile cards expose the same essential information and actions.
- Loading skeleton, filtered empty state, request error state, and server
  pagination use shared components.
- Archive remains protected by a confirmation dialog.

### Object Create/Edit

- Compact page header with back navigation and save state.
- Five-step navigation remains visible and keyboard accessible.
- Inputs are grouped into reusable form sections.
- Validation is shown at field level and summarized when progression is blocked.
- Map location and lot boundary tools retain their existing domain behavior.
- Save, previous, next, and publish actions use a stable sticky action bar.
- Navigating away with unsaved changes requires confirmation.

### Applications

- Status filter and workload summary in the page header/toolbar.
- Desktop master-detail layout: application inbox on the left, detail and
  review actions on the right.
- Mobile layout opens the selected application in a `Sheet`.
- Status, applicant contact details, project information, notes, and available
  transitions have clear hierarchy.
- Loading, empty, selection, save, and failure states are explicit.

## Investor Pages

### Overview

- Compact metrics for available objects, submitted applications, auction lots,
  and investment volume.
- Primary action directs the investor to find an object.
- Recent applications and recommended objects use shared list/card patterns.
- Guidance remains secondary and concise.

### Map

- Uses the maximum available dashboard workspace.
- Desktop keeps filters/results alongside the map without hiding map controls.
- Mobile uses separate filter and results sheets.
- Loading placeholder preserves map dimensions; empty results appear only
  after a meaningful filter/search state.

### Projects

- Owns its own paginated object request instead of reusing the four-item
  overview request.
- Search and filters remain visible and URL-compatible where possible.
- Responsive object grid with loading skeleton and actionable empty/error
  states.

### Applications

- Compact list with object name, submission date, and localized status.
- Selecting an item opens the corresponding object or available detail.
- Empty state directs the investor to the map.

### Favorites

- Responsive project grid with a consistent bookmark/removal action.
- Empty state explains how to add favorites and links to the map.

### Profile

- Displays real account details in a clear information layout.
- Dead actions are removed. Editing is shown only when supported by an existing
  API or a separately approved backend change.

### Settings

- Contains only functional language, profile, and support destinations.
- Unsupported notification preferences are not presented as working controls.
- Rows use shared button/link patterns and accessible descriptions.

## Data and State Flow

- Authentication and role resolution remain centralized in the dashboard
  guard/shell boundary.
- Every route loads only its own data.
- Abortable requests prevent stale updates after navigation.
- Mutations provide toaster success/error feedback.
- Persistent loading, empty, permission, and service errors render inline with
  stable layout.
- Retry actions repeat only the failed page request.
- No API or database contract changes are required for the UI refactor. A
  missing backend capability is surfaced as unavailable rather than simulated.

## Accessibility

- Interactive targets are at least 40px, with 44px preferred on mobile.
- Icon-only actions have accessible names and shared tooltips where needed.
- Focus order follows visual order and focus rings remain visible.
- Status is never communicated by color alone.
- Dialogs, sheets, selects, menus, and popovers use Radix/shadcn behavior.
- Tables keep semantic headers on desktop; mobile cards retain equivalent labels.
- Loading and mutation states use appropriate `aria-busy`, `aria-live`, and
  disabled behavior.

## Responsive Rules

- Desktop: sidebar, page header actions, dense tables, and master-detail layouts.
- Tablet: reduced gutters, wrapped toolbars, constrained split panes.
- Mobile: sheet navigation, stacked forms, mobile cards, and bottom-safe sticky
  actions.
- No page may rely on horizontal viewport scrolling.
- Map and editor canvases receive explicit responsive dimensions.

## Verification

### Automated

- Unit tests for shared UI behavior and role-specific page states.
- Existing feature tests remain green.
- Focused tests for loading, empty, error, filtering, pagination, dialogs, and
  responsive alternatives.
- Playwright flows for every administrator and investor route.
- Desktop and mobile screenshots for representative page states.
- Lint, production build, full unit suite, and available coverage checks.

### Manual

- Keyboard navigation through shell, menus, filters, tables, forms, and dialogs.
- Uzbek and Russian text fit and layout checks.
- Desktop, tablet, and mobile viewport checks.
- Role isolation and forbidden route checks.
- No dead controls or actions that appear functional without behavior.

## Delivery Sequence

1. Stabilize tokens and shared dashboard UI primitives.
2. Refactor the common shell and responsive navigation.
3. Migrate administrator overview and object list.
4. Migrate object create/edit workflow.
5. Migrate administrator applications.
6. Split investor route views and page-level data loading.
7. Migrate investor overview, projects, applications, favorites, profile, and
   settings.
8. Integrate the dashboard map workspace.
9. Run full role-based desktop/mobile verification.
10. Begin a separate public-page audit using the stabilized design system.

## Non-Goals

- Redesigning public pages in this phase.
- Changing investment, application, authentication, or authorization rules.
- Inventing backend support for profile or notification controls.
- Copying product-specific branding or business components from the reference
  repositories.
