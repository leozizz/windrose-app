# 📜 AGENTS.md — Regras Globais & Constituição do Time Windrose

> **Documento Mestre Compartilhado**  
> **Status:** Ativo e Mandatório para Todos os Agentes Paperclip AI  
> **Aplica-se a:** Tech Lead, PM, Backend, Frontend, UX Reviewer, QA, DevOps  

---

## 1. Missão do Projeto
O **Windrose App** é um planejador de viagens inteligente orientado ao clima com descoberta de pontos de interesse estilo Tinder (*Swipe Deck*), geração automática de roteiros por período do dia, mapa interativo e exportação `.ics` / PDF com custo operacional **$0.00**.

Nenhum agente está autorizado a violar os princípios de arquitetura limpa, compatibilidade Edge, acessibilidade, design intencional (*Anti-Slop*) e cobertura de testes descritos neste documento.

---

## 2. Topologia do Monorepo (`pnpm` Workspaces)
```text
windrose-app/
├── apps/
│   ├── web/                    # Frontend React 19 + Vite 8 + React Router 6 + Leaflet
│   └── edge-api/               # Backend Hono.js 4 + Zod (Cloudflare Workers / Pages Functions)
├── functions/
│   └── api/[[route]].ts        # Entry point unificado Cloudflare Pages Functions (handle(app))
├── libs/
│   └── shared-types/           # Contratos, DTOs e enums compartilhados (@windrose/shared-types)
├── tools/agent-standards/      # Engine local de padrões e auditoria (pnpm standards:review)
├── scripts/                    # Ponte GitHub <-> Paperclip (paperclip-sync.mjs, paperclip-task.mjs)
├── specs/                      # Especificações SDD (spec.*.md, plan.*.md, testing.md)
├── docs/                       # Documentação arquitetural, UX/UI, roadmap e Paperclip
├── .skills/                    # Skills locais do projeto importadas no Paperclip
└── .agents/                    # Instruções isoladas por persona (.agents/<persona>/)
```

---

## 3. Regras de Ouro Inegociáveis (Non-Negotiables)

1. **Spec-Driven Development (SDD) Obrigatório:**
   - Nenhuma linha de código de feature ou refatoração estrutural é escrita sem uma `specs/spec.{ID}.md` aprovada pelo Tech Lead.
   - Nenhum código é alterado sem antes ter um `specs/plan.{ID}.md` descrevendo os passos Red → Green → Refactor.
   - Os arquivos `specs/spec.md` e `specs/plan.md` na raiz de `specs/` são templates e **nunca** devem ser alterados ou sobrescritos por issue.

2. **Isolamento de Ambiente e Compatibilidade Edge ($0.00):**
   - `apps/web/`, `apps/edge-api/` e `functions/` executam em browsers modernos, **Cloudflare Pages Functions** e **Cloudflare Workers**.
   - **PROIBIDO** importar módulos exclusivos de Node.js (`fs`, `path`, `child_process`, `os`, `node:crypto`) dentro de `apps/web/`, `apps/edge-api/` ou `functions/`.
   - Utilize estritamente provedores e APIs gratuitas ($0.00): Open-Meteo (Forecast, Marine, Geocoding), OpenStreetMap (Overpass + Nominatim), Wikidata SPARQL, Wikimedia Search API e Leaflet/Carto/OSM tiles.
   - Fase 1 é **stateless** no servidor (persistência client-side em `localStorage` via `useTripSession` + Edge Caching HTTP).

3. **Clean Architecture & Domínio Puro:**
   - Avaliadores climáticos (`apps/edge-api/src/core/evaluators/`) e motor de roteirização (`apps/web/src/services/itinerary-planner.engine.ts`) devem permanecer funções puras de domínio desacopladas de React e Hono.
   - Contratos entre cliente e servidor vivem em `libs/shared-types/` (`@windrose/shared-types`).

4. **Design System "Windrose Wanderlust" & Estilização:**
   - Identidade visual oficial em `apps/web/src/styles.css`:
     - Superfícies Light Editorial aquecidas (`#fbfbf9`, `#ffffff`, gradiente suave `#fef3c7` ➔ `#f4efe6`).
     - Acento primário Compass Amber / Terracotta (`#f97316`, hover `#ea580c`) e secundário Ocean Slate (`#0f172a`).
     - Semânticos: Like (`#059669`), Reject (`#e11d48`), Undo (`#d97706`).
     - Tipografia: `Plus Jakarta Sans` (headings) e `Inter` (corpo e dados tabulares).
   - **PROIBIDO** o uso de `!important` no CSS de tela (reservado exclusivamente a regras de impressão em `@media print` quando necessário para override editorial PDF).
   - **PROIBIDO** `style={{...}}` inline em JSX, exceto exclusivamente para cálculo contínuo de coordenadas da física de arrasto (*drag*) no `SwipeDeck`.

5. **Git, Branching e Pull Requests:**
   - **PROIBIDO** fazer commits ou merges diretos na branch `main` durante entregas de issues.
   - Toda alteração deve ser desenvolvida em branch isolada: `feat/{id}-{slug}` ou `fix/{id}-{slug}` ou `chore/{id}-{slug}`.
   - Pull Requests devem conter título semântico, descrição clara em UTF-8 válido e passar por UX Reviewer (quando houver UI), QA e aprovação final do Tech Lead.

6. **Critérios de Qualidade para Entrega:**
   - `pnpm test` deve passar **100% dos testes** (Vitest em `apps/edge-api` e `apps/web`).
   - `pnpm lint` deve executar sem erros.
   - `pnpm build` (`dist/apps/web`) e `pnpm build:edge` (`wrangler deploy --dry-run`) devem completar com sucesso.

7. **Padrões de Engenharia & Code Review Unificado (`agent-standards`):**
   - Todos os agentes devem cumprir `agent.config.json` e `.agents/STANDARDS.md`.
   - **Regras Estritas:** Arrow functions (`const fn = () => {}`), proibido `any`, interfaces tipadas, `data-testid` em elementos interativos de UI, proibido `!important` em tela, proibido `innerHTML`, zero módulos Node em código Edge/Browser, ausência de `console.log` residual e `catch` vazio.
   - Antes de aprovar ou finalizar qualquer PR, execute: `pnpm standards:review`.

8. **Codificação Estrita UTF-8 em Comentários, Issues e Respostas:**
   - Todas as mensagens, comentários de issues no Paperclip, logs e documentações **devem** ser emitidas em **UTF-8 nativo** com acentuação correta em português.
   - É proibido enviar saídas com caracteres corrompidos (*mojibake* ou interrogações).

9. **GitHub como Fonte Única da Verdade & Orquestração Contínua:**
   - O **GitHub Issues** (`leozizz/windrose-app`) é a fonte oficial da verdade para backlog e priorização.
   - O **Paperclip AI** orquestra a execução sequencial: **PM → Tech Lead → Backend / Frontend → UX Reviewer → QA → Tech Lead (Merge) → DevOps**.
   - O script `scripts/paperclip-sync.mjs` (`pnpm sync:*`) sincroniza issues abertas para o Paperclip com **custo zero de tokens de IA**.
   - Para transferir tarefas entre agentes, use exclusivamente `pnpm task:handoff --assign <role> --comment "..."` (`scripts/paperclip-task.mjs`). Nunca execute comandos manuais de `curl` para atualizar issues.

10. **Auditoria Visual Anti-Slop ("Unslop") & Gate de Qualidade UI/UX:**
    - **Separação Autor vs. Revisor:** O **Frontend** nunca aprova o próprio design. Toda alteração com impacto visual passa obrigatoriamente pelo **UX Reviewer** antes do **QA**.
    - **Proibição de Aparência Genérica (AI Slop):** Proibido uso de layouts SaaS genéricos, gradientes roxos/neon gratuitos, excesso de glows, cartões aninhados redundantes (`nested cards`) ou badges/pills decorativas sem função real.
    - **Sem Overflow Horizontal:** `document.documentElement.scrollWidth <= window.innerWidth` em Mobile (`375px` / `390px`), Tablet (`768px`) e Desktop (`1440px`).
    - **Acessibilidade e Identificação:** Todos os controles interativos devem possuir `data-testid`, suporte a navegação por teclado (incluindo fallback acessível ao Swipe Deck) e passar por inspeção ao vivo via **Playwright MCP / CLI**.
