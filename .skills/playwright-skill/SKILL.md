---
name: playwright-skill
description: Playwright End-to-End functional testing guidelines for Windrose travel planner workflows.
---

# Playwright E2E Guidelines (Windrose)
- Verify complete user journeys in real browsers:
  1. City search from welcome hero and header search bar.
  2. Weather ranking summary and 7-day forecast tab.
  3. SwipeDeck interactions (drag gesture, Like/Reject/Undo buttons, keyboard controls).
  4. Matches list with interactive Leaflet map and itinerary generation.
  5. Export workflows (`.ics` download and print-friendly PDF view).
- Verify responsive layouts at `375x667`, `390x844`, `768x1024`, and `1440x900` with zero horizontal overflow (`scrollWidth <= innerWidth`) and zero console/page errors.
