# ─────────────────────────────────────────────────────────────────────────────
# PROMPT 1 — Primeira vez no projeto
# Uso: colar no chat do agente ao iniciar um novo projeto na abordagem SDD.
# Pré-requisito: pasta /specs com os arquivos base já commitados.
# ─────────────────────────────────────────────────────────────────────────────

Leia `specs/setup.md` e siga as instruções nele.

---


# ─────────────────────────────────────────────────────────────────────────────
# PROMPT 2 — Projeto configurado, issue via MCP / CLI / arquivo
# Uso: substituir 000 pelo número real da issue e colar no chat.
# O agente criará specs/spec.{ISSUE}.md (não edita specs/spec.md).
# ─────────────────────────────────────────────────────────────────────────────

Leia `specs/generate-spec.md` e siga as instruções nele para a issue abaixo.
Ao criar a spec, nomeie o arquivo como `specs/spec.{ISSUE}.md`.

ISSUE: #000

---


# ─────────────────────────────────────────────────────────────────────────────
# PROMPT 3 — Projeto configurado, issue + contexto adicional em texto
# Uso: substituir 000 pelo número real da issue, preencher CONTEXTO ADICIONAL
#      e colar no chat. O contexto adicional complementa a issue — não a substitui.
#      Em caso de conflito, o CONTEXTO ADICIONAL prevalece.
# ─────────────────────────────────────────────────────────────────────────────

Leia `specs/generate-spec.md` e siga as instruções nele para a issue abaixo.
Ao criar a spec, nomeie o arquivo como `specs/spec.{ISSUE}.md`.
Considere o CONTEXTO ADICIONAL como parte da especificação.
Em caso de conflito entre a issue e o CONTEXTO ADICIONAL, o CONTEXTO ADICIONAL prevalece.

ISSUE: #000

CONTEXTO ADICIONAL:
<!-- colar aqui decisões do time, prints descritos, restrições não documentadas
     na issue, ou qualquer detalhe que o agente precisa saber além do que está
     no GitHub / Jira / fonte da issue -->