# Troubleshooting — Paperclip, Anti-Slop & Ponte GitHub (Windrose)

Guia rápido de diagnóstico para a operação dos agentes do **Windrose** em `C:\Code\Leozizz\windrose-app`.

## 1. Agente não acorda após `pnpm task:handoff` ou `pnpm sync:dispatch`

- **Causa comum:** `wakeOnAssignment` ou `wakeOnDemand` desativado na configuração do agente, ou Paperclip offline em `http://127.0.0.1:3100`.
- **Verificação:**
  1. Confirme que o Paperclip está respondendo: abra `http://127.0.0.1:3100` ou rode `pnpm sync:status`.
  2. Verifique no card se o status foi alterado para `todo` e se o `assigneeAgentId` aponta para um dos UUIDs do projeto Windrose (`7e340278-e6dd-4fcd-b1e5-578d569e1d12`).
  3. Confirme que `instructionsBundleMode` está como `external` e que `.agents/<persona>/<persona>.md` existe no disco.

## 2. Erro de encoding UTF-8 / caracteres quebrados (`Ã§`, `Ã£`) no Windows

- **Causa comum:** uso de `curl` no PowerShell ou `Set-Content` sem `-Encoding UTF8`.
- **Solução:** Nunca faça chamadas JSON manuais via `curl` no shell do Windows. Use exclusivamente os scripts Node ESM (`pnpm task:handoff`, `pnpm sync:*`) ou `Invoke-RestMethod` / `fetch` com payload UTF-8. Ao gerar arquivos em disco, force UTF-8 sem BOM.

## 3. Conflito ou mistura com issues de outros projetos (Studyzz, Dinheirizz, Shapezz)

- **Contexto:** O Windrose compartilha a empresa `Leozizz Dev Labs` (`7cc4de9e-1eb0-44ea-8d5b-43d3d0d91655`) com outros repositórios.
- **Proteção implementada:** Tanto `scripts/paperclip-sync.mjs` quanto `scripts/paperclip-task.mjs` filtram obrigatoriamente por `projectId === '7e340278-e6dd-4fcd-b1e5-578d569e1d12'` (`Windrose`). Caso crie um card manualmente pela UI do Paperclip, **sempre selecione o projeto `Windrose`** antes de atribuir a um agente `Windrose | ...`.

## 4. `pnpm task:handoff` reporta "Multiple active Windrose issues found"

- **Causa:** Mais de uma issue no projeto `Windrose` está em `todo` ou `in_progress`.
- **Solução:** Passe o identificador explícito como terceiro argumento:
  ```bash
  pnpm task:handoff qa "Validado no browser." LEO-123
  ```

## 5. `Windrose | UX Reviewer` falha ao iniciar Playwright MCP / CLI

- **Causa comum:** Chromium headless não encontrado, servidor `pnpm dev:web` não subiu antes da auditoria visual, ou conflito de porta `5173`/`8787`.
- **Solução:**
  1. Confirme `C:\Users\leona\.gemini\config\mcp_config.json` apontando para `@playwright/mcp/cli.js --headless`.
  2. Suba o frontend localmente em background durante a checagem ou rode `pnpm build && npx vite preview --port 4173`.
  3. Se usar CLI, prefira `npx playwright ...` conforme a skill `.skills/playwright-cli/SKILL.md`.

## 6. Diferença entre `unslop` e `unslop-copy`

- **`unslop`**: elimina vícios visuais de IA na interface (gradientes genéricos, glows artificiais, excesso de badges decorativos, falta de hierarquia, desalinhamentos no tema `#fbfbf9` / `#f97316`).
- **`unslop-copy`**: elimina vícios de texto gerado por IA (slogans vazios, excesso de emojis, títulos com dois-pontos forçados, CTA genérico) garantindo copy direto e natural em PT-BR/EN conforme a tela.

## 7. `pnpm standards:sync` sobrescreve arquivos `.agents/`?

- `pnpm standards:sync` atualiza **apenas** `.agents/STANDARDS.md`, `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` e `.cursorrules`.
- Caso edite `agent.config.json` e rode `pnpm standards:sync`, lembre-se de replicar o `.agents/STANDARDS.md` atualizado para cada subpasta `.agents/<persona>/STANDARDS.md` (pois cada persona lê em modo `external` isolado no `instructionsRootPath`).

## 8. Pré-existente vs Regressão em TypeScript / ESLint / Standards

- O repositório **não possui script global `pnpm -r typecheck`** funcional atualmente (há referências herdadas de Nx/tsconfigs parciais em `*.spec.ts`). A matriz oficial de validação do projeto é:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
  - `pnpm build:edge`
  - `pnpm standards:review`
- Ao rodar `pnpm standards:review`, lembre-se de que o arquivo `REVIEW_REPORT.md` gerado está ignorado no `.gitignore`.
