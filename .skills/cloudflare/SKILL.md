---
name: cloudflare
description: Cloudflare Pages, Pages Functions, and Workers (Wrangler) deployment and caching guidelines for Windrose.
---

# Cloudflare Pages & Workers Guidelines (Windrose)
- Unified deploy via Cloudflare Pages + Pages Functions (`functions/api/[[route]].ts`):
  - Build command: `pnpm run build`
  - Build output directory: `dist/apps/web`
  - API routes served on the same origin under `/api/*` (`GET /health`, `/api/weather/*`, `/api/places/*`).
- Edge API dry-run & deploy: `pnpm build:edge` (`wrangler deploy --dry-run`) and `pnpm deploy:edge`.
- Keep bundle size lean and runtime 100% Web Standard APIs (`fetch`, `Request`, `Response`, `caches`, `crypto.subtle`).
- Respect $0.00 free-tier constraints with Edge Caching and graceful fallbacks when upstream APIs throttle.
