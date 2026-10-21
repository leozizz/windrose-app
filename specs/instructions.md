# instructions.md
# Prompt de Implementação — colar no chat do agente após aprovação da spec

> Pré-requisito: `specs/spec.{ISSUE}.md` revisada e aprovada.
> Pré-requisito: `specs/testing.md` preenchida (pelo `setup.md`).
> Substitua `{ISSUE}` pelo número real da issue antes de executar.

---

Leia `specs/spec.{ISSUE}.md` (seções PROJECT CONTEXT e ISSUE CONTEXT),
`specs/testing.md` e os arquivos listados na seção 3 da spec.

Via MCP, confirme que as issues e PRs indicados na seção 3.2 foram lidos.

**Não escreva código ainda.**

Com base em tudo que leu, crie `specs/plan.{ISSUE}.md` a partir do template
`specs/plan.md`, preenchendo:

- Resumo do entendimento da spec
- Dúvidas ou ambiguidades (se houver)
- Sequência de passos em ordem Red → Green → Refactor
- Para cada passo: o que faz, arquivos envolvidos e teste correspondente
- Superfície de regressão: testes existentes que podem ser afetados
- Mapeamento de cada critério de aceite a um passo do plano

Não edite `specs/plan.md` — crie apenas `specs/plan.{ISSUE}.md`.

Aguarde aprovação do plano. Só inicie a implementação após confirmação explícita.