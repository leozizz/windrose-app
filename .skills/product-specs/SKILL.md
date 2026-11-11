---
name: product-specs
description: Product specification standards for Spec-Driven Development (SDD) in specs/spec.{ID}.md.
---

# Product Specifications (SDD - Windrose)
- Follow the master template `specs/spec.md` without ever overwriting `specs/spec.md` or `specs/plan.md`.
- Create `specs/spec.{ID}.md` with clearly delimited Scope In vs Scope Out.
- Detail contracts in `@windrose/shared-types`, Hono routes (`apps/edge-api`), and React UI components (`apps/web`).
- Include affected file paths and verifiable acceptance criteria in Gherkin syntax.
