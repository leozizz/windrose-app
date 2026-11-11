---
name: hono-skill
description: Hono.js 4 Edge API patterns for Cloudflare Workers and Cloudflare Pages Functions in Windrose.
---

# Hono.js 4 Edge Patterns (Windrose)
- Target Cloudflare Workers (`apps/edge-api/src/index.ts`) and Cloudflare Pages Functions (`functions/api/[[route]].ts` via `handle(app)` from `hono/cloudflare-pages`).
- Validate query and body parameters strictly with `@hono/zod-validator` and `zod` schemas, returning HTTP 400 on invalid inputs.
- Preserve RPC type inference (`export type AppType = typeof routes`) and shared contracts in `@windrose/shared-types`.
- Keep all handlers 100% Edge-native: never import Node-only modules (`fs`, `path`, `child_process`, `os`, `node:crypto`).
- Apply defensive timeouts, retries, and Edge Cache headers (`Cache-Control`) for external free-tier gateways (Open-Meteo, Overpass, Nominatim, Wikidata SPARQL, Wikimedia).
