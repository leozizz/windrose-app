---
name: github-actions
description: GitHub Actions CI/CD pipeline guidelines for Windrose monorepo (lint, typecheck, test, build, Cloudflare Pages).
---

# GitHub Actions CI/CD Guidelines (Windrose)
- Trigger workflows on pull requests and pushes to `main`.
- Use Node.js 22+ and `pnpm` (`pnpm install --frozen-lockfile`).
- Run quality gates in order: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm build:edge` (Wrangler dry-run).
- Keep Cloudflare tokens and deployment secrets strictly in GitHub Actions Secrets, never in source files.
