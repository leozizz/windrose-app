# Guia do Operador — Esteira GitHub ➔ Paperclip (Windrose)

Este guia resume a operação diária do **Windrose** via ponte `scripts/paperclip-sync.mjs` e `scripts/paperclip-task.mjs`, usando o **Paperclip** (`http://127.0.0.1:3100`) com os 7 agentes isolados da empresa **Leozizz Dev Labs**.

## 1. Pré-requisitos Locais

1. **Paperclip ativo:** servidor local respondendo em `http://127.0.0.1:3100`.
2. **Empresa & Projeto:**
   - Empresa: `Leozizz Dev Labs` (`7cc4de9e-1eb0-44ea-8d5b-43d3d0d91655`)
   - Projeto: `Windrose` (`7e340278-e6dd-4fcd-b1e5-578d569e1d12`)
3. **Playwright MCP Global:** configurado em `C:\Users\leona\.gemini\config\mcp_config.json` (`--headless`) para uso automático do `Windrose | UX Reviewer` e `Windrose | QA`.
4. **Autenticação GitHub (opcional para fechar issues no GitHub):** `gh auth login` ou variável `GITHUB_TOKEN`/`GH_TOKEN`. A leitura de issues públicas em `leozizz/windrose-app` funciona mesmo sem token.

## 2. Comandos Principais

| Comando | O que faz |
| :--- | :--- |
| `pnpm sync:status` | Compara issues abertas em `leozizz/windrose-app` com os cards existentes exclusivamente no projeto **Windrose** no Paperclip. |
| `pnpm sync:board` | Lista todos os cards do projeto **Windrose** agrupados por status (`in_progress`, `todo`, `blocked`, `backlog`, `done`) e dono atual. |
| `pnpm sync:dispatch` | Despacha a próxima issue pendente do GitHub para o **Windrose \| PM** (`todo`), respeitando o isolamento para não disparar múltiplos fluxos paralelos sem necessidade. |
| `pnpm sync:dispatch -- --issue=38` | Despacha explicitamente a issue `#38` do GitHub. |
| `pnpm sync:close --dispatch-next` | Encerra o card ativo no Paperclip (`done`), fecha a issue correspondente no GitHub (quando autenticado) e despacha automaticamente a próxima issue para o PM. |
| `pnpm task:handoff <agente> "<msg>"` | Transfere o card ativo para o próximo agente da fila e acorda o destinatário (`wakeOnAssignment: true`). |
| `pnpm standards:sync` | Regenera `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursorrules` e `.agents/STANDARDS.md` a partir de `agent.config.json`. |
| `pnpm standards:review` | Valida o diff local contra os padrões arquiteturais do Windrose antes do handoff para DevOps/merge. |

## 3. Fluxo Recomendado por Issue

1. **Início do Ciclo:** execute `pnpm sync:dispatch` (ou `pnpm sync:dispatch -- --issue=<N>`).
2. **PM ➔ Tech Lead:** `Windrose | PM` valida requisitos em `specs/` e transfere com `pnpm task:handoff tech-lead "..."`.
3. **Tech Lead ➔ Backend / Frontend:** `Windrose | Tech Lead` define contratos e encaminha para `backend` (ou direto para `frontend` se não houver rota Edge).
4. **Backend ➔ Frontend:** `Windrose | Backend` implementa/testa em `apps/edge-api/` e faz handoff para `frontend`.
5. **Frontend ➔ UX Reviewer:** `Windrose | Frontend` implementa UI seguindo Windrose Wanderlust + `unslop` + `unslop-copy`, verifica `pnpm lint`/`pnpm test`/`pnpm build` e envia para `ux-reviewer`.
6. **UX Reviewer ➔ QA (ou Frontend):** `Windrose | UX Reviewer` sobe o app localmente e audita desktop (`1440px`) e mobile (`375px`) via Playwright MCP/CLI. Só aprova para `qa` após 0 violações Anti-Slop.
7. **QA ➔ DevOps:** `Windrose | QA` roda `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm build:edge`, Playwright E2E funcional, WCAG e `pnpm standards:review`.
8. **DevOps ➔ Encerramento:** `Windrose | DevOps` valida artefatos Cloudflare Pages/Workers (`dist/apps/web` e bundle `edge-api`) e executa `pnpm sync:close --dispatch-next`.

## 4. Estratégia de Modelo (`gemini-3.8-flash-medium`)

Todos os 7 agentes utilizam `gemini-3.8-flash-medium` com:
- `heartbeat.enabled: false` (zero polling ocioso)
- `wakeOnDemand: true`
- `wakeOnAssignment: true`
- `wakeOnAutomation: true`

Isso garante que cada persona acorde somente quando receber uma issue ou menção via handoff, mantendo o custo de execução previsível e o histórico isolado por projeto.
