# Windrose App — 7-Day Weather Activity Ranking Platform

[![Monorepo: NX](https://img.shields.io/badge/Monorepo-NX-blue.svg)](https://nx.dev/)
[![Backend: NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E.svg)](https://nestjs.com/)
[![API: GraphQL](https://img.shields.io/badge/API-GraphQL-E10098.svg)](https://graphql.org/)
[![Frontend: React 19](https://img.shields.io/badge/Frontend-React_19-61DAFB.svg)](https://react.dev/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript_Strict-3178C6.svg)](https://www.typescriptlang.org/)

Windrose App is a modern, scalable web application designed to evaluate travel destinations over a 7-day period for weather-dependent activities. Built with **React 19**, **NestJS**, **GraphQL Code-First**, and **NX Monorepo**, the platform consumes real-time weather and marine data from **Open-Meteo APIs** to compute deterministic scores (0–100) and human-readable recommendations.

---

## Project Navigation & Roadmaps

- **[Development Roadmap & Timestamps](docs/ROADMAP.md)**

---

## Application Deployment

- **Windrose App (Vercel)**: https://windrose-app-eight.vercel.app/
- **Windrose Api (Render)**: https://windrose-api.onrender.com/api

---

## 1. Architecture Overview & Technical Decisions

### Monorepo Architecture (NX)
The repository is structured as an **NX Monorepo** to enforce strict separation of concerns, shared TypeScript contracts, and build-cache optimization:
- **`apps/web`**: Single Page Application built with **React 19 + TypeScript + Vite**. Consumes GraphQL queries using **Apollo Client** (`@apollo/client/react`) with an ultra-responsive, glassmorphic Dark Theme interface.
- **`apps/api`**: Standalone backend application built with **Node.js + NestJS** exposing a Code-First GraphQL API powered by `@nestjs/graphql` and `@nestjs/apollo` (Apollo Driver).
- **`libs/shared-types`** (`@windrose/shared-types`): Shared domain library containing TypeScript DTOs, Enums (`ActivityType`), and Interfaces used across both frontend and backend packages.

### Backend Modular Domain Design
The NestJS backend is organized into decoupled domain modules:

```
apps/api/src/app/
├── weather/            # Open-Meteo Geocoding, Forecast & Marine Weather HTTP Integration
│   ├── geocoding.service.ts
│   └── open-meteo.client.ts
├── scoring/            # Activity Scoring Engine & Evaluators
│   ├── evaluators/
│   │   ├── outdoor-sightseeing.evaluator.ts
│   │   └── surfing.evaluator.ts
│   └── scoring.service.ts
└── ranking/            # GraphQL Code-First Resolvers & Schema Types
    └── ranking.resolver.ts
```

- **`WeatherModule`**:
  - `GeocodingService`: Translates city names (e.g., *"Florianópolis"*, *"Honolulu"*, *"Aspen"*) into geographic coordinates using Open-Meteo Geocoding API.
  - `OpenMeteoClientService`: Fetches 7-day daily weather forecasts (temperatures, precipitation, wind, weather code) and coastal marine data (wave height, wave period). Gracefully handles inland locations where ocean wave data is unavailable.
- **`ScoringModule`**:
  - `OutdoorSightseeingEvaluator`: Evaluates weather parameters against optimal sightseeing conditions (18°C–26°C, low precipitation, clear skies, gentle wind).
  - `SurfingEvaluator`: Evaluates wave height (1.0m–2.5m optimal), groundswell wave period (>10s), and coastal wind speeds.
  - `ScoringService`: Calculates 7-day overall average scores (0–100), assigns recommendation levels (`EXCELLENT`, `GOOD`, `FAIR`, `POOR`), and generates English explanation bullet points (`reasons`).
- **`RankingModule`**: Exposes the `rankActivity` and `searchLocations` GraphQL queries through `RankingResolver`.

---

## 2. How AI Assisted in the Process

This project was crafted using **Spec-Driven Development (SDD)** in pair programming with **Antigravity AI**:

1. **Structured Phase Proposals**: Before writing code, AI generated detailed proposal documents outlining technical trade-offs, architecture alternatives, and timestamps for human developer review and approval.
2. **Quality Control & Code Generation**: AI assisted in scaffolding the NX monorepo, declaring strict TypeScript interfaces, writing English TSDoc comments, and implementing scoring logic without relying on untyped `any`.
3. **Real-Time Auditing**: Development milestones were audited and recorded in real-time in `docs/ROADMAP.md`.

---

## 3. Omissions & Trade-offs

In accordance with technical test guidelines (**Quality > Quantity**, 2–3 hours time budget):

- **Activity Scope Focus (2 of 4 Activities)**: Implemented 2 comprehensive, deeply scored activities (**Outdoor Sightseeing** & **Surfing**) rather than 4 superficial ones. *Skiing* and *Indoor Sightseeing* were intentionally omitted and can be added seamlessly via new evaluator providers in `ScoringModule`.
- **Global State Management**: Omitted Redux/Zustand; state is managed cleanly using React local state and Apollo Client's in-memory cache.
- **Backend Deployment Target**: Deployed the API as a containerized Web Service on **Render Free Tier** rather than Vercel Serverless. This eliminates serverless read-only filesystem constraints, removes cold-starts, and preserves the native NestJS/Express standalone architecture.
- **External API Resilience & Caching**: Implemented in-memory TTL caching (24h for geocoding, 15m for forecasts), custom User-Agent headers, and stale fallback mechanisms in `WeatherModule`. This prevents HTTP 429 rate-limiting on shared cloud IP environments (Render Free Tier) and ensures high availability during live evaluation demos.
- **Automated Testing & E2E Templates**: The default NX-generated `apps/api-e2e` test application was removed to streamline the monorepo footprint. While Test-Driven Development (TDD) combined with Spec-Driven Development (SDD) is my preferred engineering workflow, automated test suites (unit/E2E) were omitted due to strict time constraints, prioritizing architectural depth, domain separation, and full-stack integration.
- **Pragmatic `any` & Type Assertions**: A minimal number of `any` types and type assertions exist across edge-case boundaries (such as dynamic Open-Meteo API payload responses and Apollo Client v4 exports) to meet the delivery deadline. In a production polish phase, these would be refactored into strict runtime validation schemas (e.g., Zod) and custom type guards for 100% uncompromising type safety.

---

## 4. How to Run Locally

### Prerequisites
- **Node.js**: v20+ or v24+
- **pnpm**: v9+ or v11+ (`npm install -g pnpm`)

### Installation & Setup

1. **Clone the repository and install dependencies**:
   ```bash
   git clone <repository-url>
   cd windrose-app
   pnpm install
   ```

2. **Run the Backend API (NestJS + GraphQL)**:
   ```bash
   pnpm nx dev api
   ```
   - API REST endpoint: `http://localhost:3000/api`
   - GraphQL Playground: `http://localhost:3000/graphql`

3. **Run the Frontend Web Application (React + Vite)**:
   ```bash
   pnpm nx dev web
   ```
   - Web application: `http://localhost:4200`

4. **Build Monorepo Projects**:
   ```bash
   pnpm nx run-many --target=build
   ```

---

## 5. Documentation Links

- **Roadmap & Timestamps**: [docs/ROADMAP.md](docs/ROADMAP.md)
- **Generated GraphQL Schema**: [apps/api/src/schema.gql](apps/api/src/schema.gql)
