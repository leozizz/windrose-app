# Windrose App — Weather-Smart Travel Planner & Tinder-Style POI Discovery

[![Workspace: pnpm](https://img.shields.io/badge/Workspace-pnpm_v11-orange.svg)](https://pnpm.io/)
[![Backend: HonoJS](https://img.shields.io/badge/Backend-HonoJS_Edge-E36002.svg)](https://hono.dev/)
[![Cloud: Cloudflare Workers](https://img.shields.io/badge/Runtime-Cloudflare_Workers-F38020.svg)](https://workers.cloudflare.com/)
[![Frontend: React 19](https://img.shields.io/badge/Frontend-React_19-61DAFB.svg)](https://react.dev/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript_Strict-3178C6.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Windrose App** é uma aplicação web moderna e inteligente projetada para transformar o planejamento de viagens:
1. **Avaliação Climática (Open-Meteo)**: Análise determinística de viabilidade para atividades ao ar livre e surf em uma janela de 7 dias com notas de 0 a 100.
2. **Descoberta Estilo Tinder (Swipe Deck)**: Navegação interativa por cartões de pontos turísticos, museus, praias, restaurantes e bares (via OpenStreetMap Overpass API e Wikimedia Commons).
3. **Roteirizador Inteligente Contextual**: Organização automática dos lugares curtidos em períodos diários (Manhã, Tarde, Noite), realocando atividades ao ar livre para dias ensolarados e museus/gastronomia para dias com previsão de chuva ou ventos severos.
4. **Exportação Sem Fricção**: Download de arquivo de calendário padrão `.ics` (Google Calendar, Apple Calendar e Outlook), deep links diretos e impressão em PDF customizado de alta fidelidade.
5. **Custo $0.00 & Latência Global**: Backend 100% serverless/edge construído com **HonoJS** no **Cloudflare Workers**, eliminando cold starts e custos de hospedagem.

---

## 1. Documentação & Arquitetura

- **[Relatório de Viabilidade e Migração](docs/FEASIBILITY_AND_MIGRATION_REPORT.md)**
- **[Especificações de Desenvolvimento (SDD)](specs/)**

### Estrutura do Workspace (pnpm Workspaces)

```
apps/
├── edge-api/             # Backend Edge nativo com Hono.js no Cloudflare Workers
│   ├── src/
│   │   ├── core/         # Lógica pura de domínio (Clean Architecture)
│   │   │   ├── evaluators/  # Avaliadores de clima (Sightseeing, Surfing)
│   │   │   └── places/      # Orquestrador e curadoria de POIs
│   │   ├── infrastructure/  # Gateways HTTP (Open-Meteo, Overpass, Wikimedia)
│   │   └── routes/          # Rotas HTTP com validação Zod e tipagem RPC
│   └── wrangler.toml     # Configuração do Cloudflare Workers
└── web/                  # Single Page Application (React 19 + Vite + CSS Glassmorphic)
    ├── src/
    │   ├── components/   # SwipeDeck, MatchesList, ItineraryView
    │   ├── hooks/        # useTripSession (LocalStorage Stateless)
    │   └── services/     # ItineraryPlannerEngine, CalendarExporter, ApiClient
libs/
└── shared-types/         # Contratos, DTOs e Enums compartilhados
```

---

## 2. Como Rodar Localmente

### Pré-requisitos
- **Node.js**: v20+ ou v24+
- **pnpm**: v11+ (`npm install -g pnpm`)

### Instalação

```bash
git clone https://github.com/leozizz/windrose-app.git
cd windrose-app
pnpm install
```

### Comandos de Desenvolvimento

| Comando | Descrição |
| :--- | :--- |
| `pnpm dev` | Inicia o Frontend React 19 com Vite em `http://localhost:4200` |
| `pnpm dev:edge` | Inicia a Edge API com Wrangler em `http://localhost:8787` |
| `pnpm test` | Executa a suíte completa de 35 testes automatizados com Vitest |
| `pnpm build` | Compila o frontend para produção (`dist/apps/web`) |
| `pnpm build:edge` | Executa dry-run do bundle do Cloudflare Worker |

---

## 3. Endpoints da Edge API

- `GET /health`: Diagnóstico de saúde do serviço.
- `GET /api/weather/rank?city=:city&activity=:activity`: Avaliação e motivos determinísticos para os 7 dias.
- `GET /api/weather/search?q=:query`: Busca geográfica de coordenadas.
- `GET /api/places/deck?city=:city&lat=:lat&lon=:lon`: Baralho de lugares para a experiência Tinder Swipe com Edge Caching (7 dias).
- `GET /api/places/curated-cities`: Cidades com curadoria nativa verificada.

---

## 4. Licença

Este projeto está sob a licença [MIT](LICENSE).
