# Windrose App — 7-Day Activity Weather Ranking

Windrose App is a modern, scalable web application built with **React**, **NestJS**, **GraphQL**, and **NX Monorepo**. It ranks travel destinations over the next 7 days for specific weather-dependent activities based on real-time data from the **Open-Meteo APIs**.

---

## 1. Architecture Overview & Technical Choices

### Monorepo Structure (NX)
The project is organized as an NX Monorepo to maintain strong separation of concerns while sharing TypeScript contracts across frontend and backend:
- **`apps/web`**: React 19 + TypeScript + Vite single-page web application using Apollo Client (`@apollo/client/react`) for GraphQL consumption and Vanilla CSS with a glassmorphic Dark Theme.
- **`apps/api`**: Node.js + NestJS application exposing a GraphQL API built with Code-First `@nestjs/graphql` and `@nestjs/apollo` (Apollo Driver).
- **`libs/shared-types`** (`@windrose/shared-types`): Shared library containing TypeScript DTOs, Enums (`ActivityType`), and Interfaces used by both the API and Web applications.

### Backend Architecture (NestJS + GraphQL Code-First)
The API is structured in modular NestJS domains:
- **`WeatherModule`**:
  - `GeocodingService`: Translates city names (e.g., *"Florianópolis"*, *"Honolulu"*, *"Aspen"*) into geographic coordinates via the Open-Meteo Geocoding API.
  - `OpenMeteoClientService`: Fetches 7-day daily forecasts from Open-Meteo Forecast API (temperatures, precipitation, wind, weather code) and Marine Weather API (wave height and period). Gracefully handles inland destinations where ocean data is unavailable.
- **`ScoringModule`**:
  - `OutdoorSightseeingEvaluator`: Evaluates weather parameters against ideal sightseeing conditions (18°C–26°C, dry weather, gentle wind, clear skies).
  - `SurfingEvaluator`: Evaluates wave height (1.0m–2.5m optimal), wave period (>10s groundswell), and coastal wind conditions.
  - `ScoringService`: Computes overall 7-day average scores (0–100), assigns recommendation levels (`EXCELLENT`, `GOOD`, `FAIR`, `POOR`), and generates English explanation bullet points (`reasons`).
- **`RankingModule`**: Exposes the `rankActivity` and `searchLocations` GraphQL queries through `RankingResolver`.

---

## 2. How AI Assisted in the Process

This project was built using **Spec Driven Development (SDD)** in pair programming with **Antigravity AI**:

1. **Structured Phase Planning**: Before executing any phase, a dedicated proposal outlining technical trade-offs, alternatives, and timestamps was generated and submitted for human developer approval.
2. **Quality Control & Code Generation**: AI assisted in scaffolding the NX monorepo, generating strict TypeScript interfaces, adding English TSDoc comments, and implementing scoring algorithms without using untyped `any`.
3. **Real-time Auditing**: Every development phase logged exact real-time timestamps in `docs/ROADMAP.md` and documented technical concepts in `docs/LEARNING_GUIDE.md` (for dev purposes only).

---

## 3. Omissions & Trade-offs

In accordance with the test guidelines (**Quality > Quantity**, 2–3 hours time budget):

- **Activity Scope Reduction**: Focused on implementing 2 comprehensive, fully scored activities (**Outdoor Sightseeing** & **Surfing**) rather than 4 rushed ones. *Skiing* and *Indoor Sightseeing* were intentionally omitted and can be added seamlessly via new evaluators in `ScoringModule`.
- **Global State Management**: Omitted Redux/Zustand; state is managed cleanly using React local state and Apollo Client's in-memory cache.
- **Testing**: Automated test execution was kept minimal to focus on architectural depth, clean abstractions, and full-stack integration within the 2–3 hour window.

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
   - API global endpoint: `http://localhost:3000/api`
   - GraphQL Playground: `http://localhost:3000/graphql`

3. **Run the Frontend Web App (React + Vite)**:
   ```bash
   pnpm nx dev web
   ```
   - Web application: `http://localhost:4200`

4. **Build All Monorepo Projects**:
   ```bash
   pnpm nx run-many --target=build
   ```

---

## 5. Documentation & References
- **Roadmap & Timestamps**: [docs/ROADMAP.md](docs/ROADMAP.md)
- **Learning Guide & Technical Concepts**: [docs/LEARNING_GUIDE.md](docs/LEARNING_GUIDE.md)
- **GraphQL Schema**: Generated at [apps/api/src/schema.gql](apps/api/src/schema.gql)
