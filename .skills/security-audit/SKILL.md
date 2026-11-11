---
name: security-audit
description: Security verification for Windrose covering input validation, XSS prevention, CORS, and zero secret exposure.
---

# Security Audit Guidelines (Windrose)
- Validate all query and path parameters on Hono routes (`apps/edge-api/src/routes/`) with Zod schemas.
- Prevent XSS: never use `innerHTML` or `dangerouslySetInnerHTML` with unvalidated external data (e.g., OSM/Wikidata/Wikimedia descriptions or Leaflet popups).
- Ensure zero hardcoded API keys, tokens, or `.env` files are tracked in git; keep upstream integrations 100% free-tier without private credentials in client bundles.
- Enforce safe timeouts and sanitized error responses on external HTTP calls (`Open-Meteo`, `Overpass`, `Nominatim`, `Wikidata`, `Wikimedia`).
