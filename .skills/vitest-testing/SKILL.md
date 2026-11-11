---
name: vitest-testing
description: Vitest unit and integration testing patterns for Windrose (apps/edge-api, apps/web, libs/shared-types).
---

# Vitest Testing Patterns (Windrose)
- Write unit tests (`*.spec.ts` / `*.spec.tsx`) co-located with source files following `specs/testing.md`.
- Frontend (`apps/web`): test components (`SwipeDeck`, `ItineraryView`), hooks (`useTripSession`), and domain engines (`ItineraryPlannerEngine`, `CalendarExporter`) with `@testing-library/react` and `jsdom`.
- Edge API (`apps/edge-api`): test pure evaluators (`OutdoorSightseeingEvaluator`, `SurfingEvaluator`), `PlacesService`, and Hono routes via `app.request(...)` with mocked gateways (`vi.fn()`, `vi.spyOn()`).
- Never hit real external APIs (Open-Meteo, Overpass, Wikidata, Wikimedia) in automated Vitest runs.
- Ensure 100% deterministic execution with `pnpm test` (`vitest run`).
