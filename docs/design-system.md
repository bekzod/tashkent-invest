# Frontend Design System

## Foundation

The frontend uses Tailwind CSS v4 for semantic tokens and utility composition. `frontend/src/app/globals.css` is the sole owner of color, typography, radius, and focus-ring tokens. New visual values must extend those semantic tokens instead of adding a component-specific palette.

`frontend/components.json` records the shadcn configuration. shadcn-compatible primitives live in `frontend/src/components/ui`; add new primitives there through the shadcn pattern, then compose them in product code.

## Layers

- `src/components/ui`: reusable, accessible primitives such as `Button`, `Input`, `Label`, `Checkbox`, `Badge`, `Skeleton`, and `Toaster`.
- `src/shared/ui`: cross-feature presentation utilities. `feedback.ts` is the only application-facing API for transient notifications.
- `src/entities`, `src/features`, `src/widgets`, and `src/views`: product composition. They import primitives and shared utilities but do not duplicate primitive behavior.

## Component Rules

- Use `cn` from `@/lib/utils` to merge Tailwind class names.
- Prefer an existing primitive before creating a local button, input, checkbox, label, badge, or loading control.
- Add variants with `class-variance-authority` when a primitive has stable, reusable visual states.
- Keep raw layout CSS only for complex layouts, third-party integrations, and legacy migration; use semantic Tailwind utilities inside new primitives and new feature markup.
- Keep labels associated with controls and preserve keyboard and focus behavior when wrapping primitives.

## Feedback Rules

- Trigger transient success, warning, error, and informational messages via `notify` from `@/shared/ui/feedback`.
- Use the localized message function before passing copy to `notify`.
- Use a toast action for recoverable, page-level operations such as retrying a request.
- Keep validation adjacent to the field or editor when it tells the user what to correct. Route-level error pages and map/status indicators remain persistent UI, not toasts.

## Adding A Primitive

1. Add the component under `src/components/ui` and export its props type.
2. Use semantic Tailwind tokens and `cn`; do not hard-code a second design vocabulary.
3. Add a focused test for behavior or variants when logic is introduced.
4. Compose it in a feature rather than duplicating its markup there.
