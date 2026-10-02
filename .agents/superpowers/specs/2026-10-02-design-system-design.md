# Design System Architecture

## Goal

Establish Tailwind CSS and shadcn/ui as the reusable UI foundation for Invest
Tuman. Replace transient inline success, warning, and request-error messages
with localized toast notifications while preserving field-level validation.

## Current State

The frontend uses Next.js, TypeScript, a `@/*` path alias, Lucide icons, and a
large global stylesheet. It has no Tailwind, PostCSS, or `components.json`
configuration. Repeated visual primitives are global CSS classes such as
`button primary`, `admin-primary`, `error`, and `success`.

## Architecture

### Layers

1. Tokens: Tailwind theme variables in `src/app/globals.css` define product
   color, spacing, radius, shadow, typography, and semantic state tokens.
   Existing brand colors remain the source of truth.
2. Primitives: shadcn-owned source lives in `src/components/ui`. Required
   primitives are Button, Input, Textarea, Select, Checkbox, Label, Badge,
   Skeleton, Tooltip, Dialog, Sheet, and Sonner.
3. Shared compositions: `src/shared/ui` owns reusable product compositions,
   including field messaging, asynchronous actions, empty states, and feedback.
4. Features and views own business logic and local layout. They compose shared
   UI instead of creating a duplicate primitive or feedback mechanism.

### Feedback Contract

- The root layout renders exactly one `Toaster`.
- `src/shared/ui/feedback.ts` exposes `notify.success`, `notify.error`,
  `notify.warning`, and `notify.info` as the sole feature-facing toast API.
- Successful mutations, recoverable request failures, and non-blocking warnings
  use toast notifications. Duplicate general inline status banners are removed.
- Field-level validation stays by its input, with `aria-describedby`; it is not
  duplicated as a toast.
- Loading state remains contextual: buttons, skeletons, and map overlays do not
  generate noisy toasts.

### Migration Rules

- New interactive controls use `components/ui` primitives or a named shared
  composition. Generic control styling is not created inside feature modules.
- Existing MapLibre rendering, feature layout, and test data attributes remain
  intact; only reusable controls and transient feedback are migrated.
- Existing layout selectors migrate incrementally. This task is not a visual
  redesign and must not change business workflows.
- ESLint import boundaries allow cross-feature UI only through `components/ui`
  and `shared/ui`.

## Acceptance Criteria

- Tailwind and shadcn are configured without breaking the established brand.
- Every mutation-related success, warning, and request error uses the localized
  global toast system, except field-specific validation.
- Authentication, registration, applications, admin edits/reviews, dashboard,
  and map feedback flows are migrated.
- Lint, unit tests, production build, and relevant browser checks pass.
