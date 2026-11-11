---
name: code-review
description: Code review standards for Windrose monorepo focusing on Clean Architecture, TypeScript strictness, Edge runtime safety, and Anti-Slop CSS.
---

# Code Review Standards (Windrose)
- Enforce TypeScript strictness (`noExplicitAny`, explicit parameter/return types, shared contracts in `libs/shared-types`).
- Guarantee zero Node-only modules (`fs`, `path`, `child_process`, `os`, `node:crypto`) inside `apps/web/`, `apps/edge-api/`, and `functions/`.
- Enforce Clean Architecture: weather evaluators and itinerary planning remain pure domain functions decoupled from React and Hono.
- Forbid `!important` in screen CSS (`apps/web/src/styles.css` outside `@media print`) and forbid inline `style={{...}}` in JSX except continuous drag/swipe physics coordinates.
- Verify interactive UI controls include `data-testid` and keyboard accessibility fallbacks.
- Require `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm standards:review` to pass before merging to `main`.
