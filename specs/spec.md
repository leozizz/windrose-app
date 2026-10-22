# spec.md
# Template de Especificação — NÃO EDITAR DIRETAMENTE PARA ISSUES

> **Este arquivo é um template somente-leitura após o `setup.md` preencher o PROJECT CONTEXT.**
> Para cada issue, o agente cria `specs/spec.{número-da-issue}.md` a partir deste template.
> O arquivo raiz `spec.md` nunca é tocado pelo `generate-spec.md`.

---

> **Dois blocos distintos neste arquivo:**
>
> `PROJECT CONTEXT` — preenchido pelo `setup.md` uma vez por projeto. Não alterar por issue.
> `ISSUE CONTEXT`   — preenchido pelo `generate-spec.md` a cada issue.
>
> Remova seções inteiras do ISSUE CONTEXT que não se aplicarem à task atual.

---

<!-- ═══ PROJECT CONTEXT — preenchido pelo setup.md ═══ -->

## PC-1. Stack do Projeto

### Frontend
```
Framework:      React 19
Linguagem:      TypeScript 5 (Strict Mode)
Build:          Vite
Estilização:    CSS Variables, Classes Utilitárias / TailwindCSS, Dark Theme Glassmorphic
Componentes:    Componentes Customizados, micro-interações de Swipe, Lucide Icons
Roteamento:     React Router DOM 6
Estado:         Local Session State (LocalStorage com Zod), React Hooks (migrado de Apollo Client)
```

### Backend
```
Framework:      Hono.js (substituindo NestJS GraphQL)
Runtime:        Cloudflare Workers (Edge Runtime) / Node.js 22
Linguagem:      TypeScript (Strict Mode)
Autenticação:   Nenhuma na Fase 1 (Stateless / Sessão no Cliente)
```

### Banco de Dados
```
Banco:          Nenhum na Fase 1 (LocalStorage / URL state); PostgreSQL (Supabase) na Fase 2
ORM / Query:    Drizzle ORM (Fase 2)
Migrations:     drizzle-kit (Fase 2)
```

### Infraestrutura & Repositório
```
Estrutura:      Monorepo NX em transição planejada para pnpm workspaces puro
Hospedagem:     Cloudflare Workers (Backend Edge) & Cloudflare Pages / Vercel (Frontend)
Storage:        Client-side (LocalStorage, ICS download, PDF export)
CI/CD:          GitHub Actions / Cloudflare Pages / Vercel
```

---

## PC-2. CLIs Disponíveis

```bash
# Gerenciador de pacotes e monorepo
pnpm                     # Instalação e execução de dependências
pnpm nx                  # Orquestrador de tarefas do monorepo Nx (em transição para pnpm workspaces)
pnpm nx dev web          # Executar frontend em modo desenvolvimento (porta 4200)
pnpm nx dev edge-api     # Executar backend Hono com Wrangler localmente
pnpm nx test web         # Executar testes do frontend com Vitest
pnpm nx test edge-api    # Executar testes do backend edge com Vitest

# GitHub CLI
gh                       # Interação com issues, PRs e repositório GitHub
gh issue create          # Criar issues
gh pr create             # Criar pull requests

# Cloudflare CLI
wrangler                 # CLI do Cloudflare Workers / Pages
```

---

## PC-3. Estrutura de Pastas

```
apps/
  edge-api/              # Novo Backend Edge com HonoJS (Cloudflare Workers)
  api/                   # Legado NestJS + GraphQL (em fase de descarte / Fase 5)
  web/                   # Frontend React 19 + Vite (UI Glassmorphic + Swipe Deck)
libs/
  shared-types/          # Contratos, DTOs e tipos compartilhados
docs/                    # Relatórios de viabilidade, roadmaps e documentação técnica
specs/                   # Especificações e templates do fluxo Spec-Driven Development
```

---

## PC-4. Convenções do Projeto

```
Nomenclatura de branches:  feat/, fix/, chore/, refactor/
Padrão de commits:         Conventional Commits (feat:, fix:, chore:, docs:, refactor:)
Localização de testes:     *.spec.ts, *.spec.tsx (ao lado do arquivo ou pasta correspondente)
Variáveis de ambiente:     .env, .env.example, wrangler.toml
Documentação interna:      docs/, specs/, README.md
```

---

## PC-5. Restrições Permanentes do Projeto

```
- TypeScript Strict: Proibido o uso de 'any' sem justificativa formal; tipagem estrita end-to-end.
- Clean Code & CSS Limpo: PROIBIDO o uso de styles inline ('style={{...}}') no JSX, exceto exclusivamente para cálculo contínuo de coordenadas de física de arrasto (drag coordinates) em animações em tempo real onde classes CSS não comportam valores arbitrários contínuos. Toda estilização visual deve residir em classes CSS reutilizáveis ou utilitários TailwindCSS.
- Clean Architecture (Robert C. Martin): As regras de cálculo de clima e geração de roteiros devem ser funções puras de domínio, desacopladas de frameworks (Hono, React, NestJS).
- Custo 100% Gratuito ($0.00): Utilizar estritamente provedores com free tier vitalício (Cloudflare Workers, Open-Meteo, OpenStreetMap Overpass, Wikimedia).
- Edge Native: O backend não deve depender de módulos exclusivos de Node.js (como 'fs' ou processos locais de longa duração).
- Stateless na Fase 1: Sem dependência de banco de dados no lançamento inicial; estado mantido em sessão/localStorage e exportações client-side (.ics e PDF).
- Acessibilidade: Interações complexas como o Swipe Deck devem ter fallbacks acessíveis via teclado e botões (WCAG 2.2).
- Monorepo Simplificado: Planejado descarte do ecossistema pesado do Nx na Fase 5 em favor de pnpm workspaces nativo para simplificar a manutenção.
```

<!-- ═══ FIM DO PROJECT CONTEXT ═══ -->

---
---

<!-- ═══ ISSUE CONTEXT — preenchido pelo generate-spec.md por issue ═══ -->

## 1. Identificação

```
Issue principal:    #<!-- FILL -->
Título:             <!-- FILL -->
Tipo:               <!-- FILL: feat | fix | refactor | chore | spike -->
Branch:             <!-- FILL: ex: feat/fe-07-cadastro-equipe -->
Milestone:          <!-- FILL ou remover -->
```

**Issues relacionadas**
```
<!-- FILL: listar com número e título resumido
ex:
#1  Épico
#2  Roadmap
#BE-06  Employees + 5 roles (depende de)
#FE-08  Calendário (bloqueia)
-->
```

---

## 2. Contexto

> O que esta spec cobre e por que existe.
> Referenciar a issue — não duplicar o conteúdo dela.

<!-- FILL: 2–4 linhas -->

---

## 3. Leitura Obrigatória Antes de Qualquer Código

### 3.1 Documentação interna
```
# Caminhos definidos em PC-4 — não repetir aqui, apenas confirmar que foram lidos.
# Adicionar arquivos específicos desta issue se houver:
<!-- FILL ou remover -->
```

### 3.2 Issues via MCP
```
<!-- FILL: listar as issues a ler além das já indicadas na seção 1 -->
```

Ler PRs atrelados a cada issue. Para PRs mergeados, ler o diff completo.

### 3.3 Arquivos do repositório
```
<!-- FILL: listar arquivos/pastas a ler antes de editar
ex:
src/pages/cadastros/
src/types/employee.ts
src/context/AuthContext.tsx
-->
```

---

## 4. Escopo

### Está incluso
```
<!-- FILL -->
-
-
```

### Está fora do escopo
```
<!-- FILL -->
-
-
```

---

## 5. Contratos

> Preencher apenas o que esta issue cria, altera ou consome.
> Adaptar ao tipo de interface do projeto (REST, GraphQL, RPC, eventos…).

### Endpoints / Mutations / Queries
```
<!-- FILL: ex:
GET  /api/employees?role=MONITOR
POST /api/employees
# ou para GraphQL:
# mutation CreateEmployee($input: EmployeeInput!): Employee
-->
```

### Schema / Migrations
```sql
-- FILL: alterações de banco necessárias
-- ex:
-- ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_en VARCHAR(255);
```

### Tipos gerados (se aplicável)
```bash
# FILL: comando para regenerar tipos após mudança de schema
# ex: prisma generate | supabase gen types | graphql-codegen
```

---

## 6. Arquivos que Serão Criados ou Alterados

> O agente **não deve alterar** arquivos fora desta lista sem justificar
> com comentário `// SPEC-#<número>: <motivo>`.

```
CRIAR:
  <!-- FILL -->

ALTERAR:
  <!-- FILL -->

REMOVER (se aplicável):
  <!-- FILL ou remover esta linha -->
```

---

## 7. Estratégia de Testes (TDD)

> Preencher antes de qualquer implementação.
> Consultar `specs/testing.md` para convenções do projeto.

### 🔴 Red — testes que devem falhar primeiro

> Descrever os testes que serão escritos ANTES da implementação.
> Cada critério de aceite deve ter ao menos um teste correspondente.

```
<!-- FILL: ex:
- `employee.service.spec.ts` → deve lançar erro ao criar employee com role ADM por COORDENACAO
- `EmployeeForm.spec.tsx` → deve desabilitar opção ADM no select para usuário COORDENACAO
- `cadastros.e2e.ts` → fluxo completo de cadastro de monitor com nome_en obrigatório
-->
```

### 🟢 Green — mínimo para os testes passarem

> O que precisa ser implementado para que cada teste acima passe.
> Sem over-engineering — apenas o suficiente.

```
<!-- FILL: ex:
- Validação de role no service antes de persistir
- Lógica de filtragem de opções no componente de select
- Handler do formulário com campo nome_en condicional
-->
```

### 🔵 Refactor — oportunidades após o green

> O que pode ser melhorado depois que os testes passam,
> sem quebrar nenhum deles.

```
<!-- FILL ou "Nenhuma oportunidade identificada nesta iteração." -->
```

### Cobertura existente afetada

> Testes já existentes que tocam arquivos desta issue.
> Verificar que continuam passando após a implementação.

```
<!-- FILL: ex:
- `auth.spec.ts` → testa login — afetado se AuthContext for alterado
- Remover se não houver testes existentes nos arquivos em escopo
-->
```

---

## 8. Critérios de Aceite

> Copiar e adaptar da issue. Cada item deve ter correspondência na seção 7 (testes).

```
<!-- FILL:
- [ ] ...
- [ ] ...
-->
```

<!-- ═══ FIM DO ISSUE CONTEXT ═══ -->