# generate-spec.md
# Geração da Spec por Issue — executar no início de cada task

> Substitua `{ISSUE}` pelo número real da issue antes de executar.
> O agente cria `specs/spec.{ISSUE}.md` como instância preenchida.
> Os arquivos `spec.md` e `plan.md` na raiz de /specs são templates — nunca editá-los.

---

## Instruções para o Agente

Você irá criar o arquivo `specs/spec.{ISSUE}.md` com base na issue indicada
e no contexto do repositório.

**Não edite** `specs/spec.md` — ele é o template de origem, somente-leitura para issues.
**Não edite** `specs/plan.md`.

---

## Passo 1 — Leitura de documentação e contexto

```
specs/spec.md          ← ler como template — copiar estrutura, não editar
specs/testing.md       ← ler as convenções de teste antes de preencher a seção 7
.agents/AGENTS.md      ← regras e decisões do projeto (se existir)
```

---

## Passo 2 — Leitura da issue e issues relacionadas via MCP

```
Issue principal: #{ISSUE}
```

Para cada issue lida:
- Ler o corpo completo
- Identificar issues referenciadas (épico, dependências, bloqueadas)
- Ler essas issues também
- Para cada uma com PR atrelado: ler o diff completo

---

## Passo 3 — Leitura do codebase relevante

Com base na issue, identificar e ler via MCP os arquivos que serão impactados.

Ao ler cada arquivo, anotar mentalmente:
- Qual é a estrutura atual
- Quais tipos e interfaces são usados
- Quais nomes de funções, componentes e endpoints existem
- O que pode quebrar se for alterado

Não inventar nomes que não foram vistos no código.

---

## Passo 4 — Levantamento de cobertura de testes existente

> Este passo alimenta a seção 7 (Estratégia de Testes) da spec.

Para cada arquivo identificado no Passo 3, verificar arquivos de teste
existentes que os importem ou testem diretamente.

Ao preencher a spec, listar na seção "Cobertura existente afetada" (seção 7)
qualquer teste encontrado que possa ser impactado pela mudança.

Se não houver testes existentes nos arquivos em escopo, registrar explicitamente:
`"Nenhum teste existente nos arquivos em escopo."` — não deixar em branco.

---

## Passo 5 — Criar `specs/spec.{ISSUE}.md`

Criar o arquivo `specs/spec.{ISSUE}.md` com o seguinte conteúdo:

1. Copiar integralmente o bloco **PROJECT CONTEXT** de `specs/spec.md` (sem alterações)
2. Preencher todos os `<!-- FILL -->` do bloco **ISSUE CONTEXT** com os dados reais:
   - **Seção 1:** identificação da issue
   - **Seção 2:** contexto em 2–4 linhas, referenciando a issue (não duplicando)
   - **Seção 3:** issues adicionais a ler e arquivos do repositório identificados no Passo 3
   - **Seção 4:** escopo extraído da issue — dentro e fora
   - **Seção 5:** contratos de API/banco/schema conforme a issue define
   - **Seção 6:** lista de arquivos a criar, alterar ou remover
   - **Seção 7:** estratégia de testes (Red/Green/Refactor) com base em `testing.md` e Passo 4
   - **Seção 8:** critérios de aceite extraídos da issue, com correspondência aos testes
3. Remover seções do ISSUE CONTEXT que não se aplicam (ex: sem contratos de banco se for só frontend)

**Regras ao preencher:**
- Não inventar informações ausentes na issue ou no código
- Se algo não estiver claro: deixar o placeholder e listar no relatório abaixo
- Usar os nomes reais de arquivos, funções e tipos encontrados no repositório

---

## Passo 6 — Relatório de pendências

Ao finalizar, listar no chat (não no arquivo gerado):

1. **Preenchido automaticamente:** o que foi extraído da issue e do código
2. **Requer revisão humana:** campos com informação ambígua ou incompleta
3. **Não encontrado:** o que estava ausente na issue e no código

Aguardar revisão e aprovação de `specs/spec.{ISSUE}.md` antes de qualquer implementação.