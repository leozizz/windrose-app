# ADR 0002: Design System Windrose Wanderlust e Gate Visual Anti-Slop (Playwright MCP)

- **Status:** Aprovado
- **Data:** 2026-10-31
- **Decisores:** Tech Lead, PM, Frontend, UX Reviewer

## Contexto
Aplicações geradas por IA frequentemente sofrem de "AI Slop": layouts SaaS genéricos, fundos escuros com gradientes roxos/neon desnecessários, badges decorativas sem função e descaso com usabilidade em telas móveis e leitores de tela.

## Decisão
1. **Identidade Visual Oficial (Windrose Wanderlust):**
   - Cores: Light Editorial aquecido (`#fbfbf9`, `#ffffff`, acento Compass Amber `#f97316` e Ocean Slate `#0f172a`).
   - Tipografia: `Plus Jakarta Sans` (títulos) e `Inter` (corpo e métricas tabulares).
   - Proibido `!important` no CSS de tela (reservado exclusivamente a overrides de impressão `@media print`).
   - Proibido `style={{...}}` inline em JSX, exceto para física de arraste contínuo no `SwipeDeck`.
2. **Separação de Papéis e Gate Visual:**
   - O desenvolvedor Frontend nunca aprova o próprio design.
   - O `UX Reviewer` atua como gate mecânico obrigatório antes do QA, inspecionando a aplicação ao vivo via Playwright MCP nos viewports `375px`, `768px` e `1440px`.
   - Requisito inegociável de zero overflow horizontal: `scrollWidth <= innerWidth`.

## Consequências
- A interface possui personalidade visual editorial e legibilidade superior.
- Reforça a conformidade contínua com as diretrizes do `agent-standards`.
