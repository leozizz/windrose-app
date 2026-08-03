# Roadmap — Registro de Desenvolvimento (para revisão do Tech Lead)

> Documento vivo, atualizado a cada fase concluída.

---

## Fase 1: Scaffold do Monorepo e Lib de Tipos

**Plano proposto:** Setup inicial da estrutura do monorepo NX, configuração de pacotes base (NestJS GraphQL, Apollo Client), criação da biblioteca compartilhada de tipos (`@windrose/shared-types`), e criação dos documentos vivos `docs/ROADMAP.md` e `docs/LEARNING_GUIDE.md`.

**Alternativas consideradas:** 
- *Code-First vs Schema-First (GraphQL)*: Escolhido Code-First (`@nestjs/graphql`) para manter o TypeScript como fonte única da verdade e evitar duplicar DTOs.
- *Lib de Tipos NX*: Escolhida a criação da lib `@windrose/shared-types` com alias no `tsconfig.base.json` para desacoplamento e contrato forte entre `api` e `web`.

**Decisão do desenvolvedor:** Aprovado início da fase com o scaffold NX + NestJS + GraphQL code-first + Apollo Client.

**Timestamps**
| Marco | Horário |
|---|---|
| Plano proposto | 31/07 > 01/08 à 00:05 |
| Plano aprovado | 03/08 às 11:11 |
| Implementação iniciada | 03/08 às 11:11 |
| Implementação concluída | 03/08 às 11:17 |
| Revisão do usuário concluída | 03/08 às 11:17 |

**Resultado:** Scaffold do monorepo concluído com sucesso. Dependências do NestJS/GraphQL e Apollo instaladas, lib `@windrose/shared-types` configurada com aliases TypeScript, e builds do monorepo validados via NX.  
**Pendências/observações:** Nenhuma.

---

## Fase 2: Módulo de Integração com Open-Meteo (`WeatherModule`)

**Plano proposto:** Criação dos serviços `GeocodingService` e `OpenMeteoClientService` no backend para integração com as APIs de Geocodificação, Forecast e Marine Weather do Open-Meteo, com tratamento para cidades continentais (sem dados marítimos), retries e timeouts HTTP via Axios.

**Alternativas consideradas:** 
- *Busca por Nome de Cidade via Geocoding API vs Coordenadas puras*: Escolhido incluir `GeocodingService` para que a busca por nome de cidade seja traduzida no backend diretamente para coordenadas `(lat, long)`.
- *Axios no NestJS*: Encapsular Axios em serviço NestJS com timeout de 5s para garantia de resiliência.

**Decisão do desenvolvedor:** Aprovado início da Fase 2.

**Timestamps**
| Marco | Horário |
|---|---|
| Plano proposto | 03/08 às 11:17 |
| Plano aprovado | 03/08 às 12:06 |
| Implementação iniciada | 03/08 às 12:06 |
| Implementação concluída | 03/08 às 12:12 |
| Revisão do usuário concluída | 03/08 às 12:12 |

**Resultado:** Módulo de integração com Open-Meteo (`WeatherModule`) implementado com sucesso. Serviços `GeocodingService` e `OpenMeteoClientService` criados com suporte a geocodificação de cidades por nome, busca de previsão para 7 dias, e resiliência graciosa para cidades continentais sem dados de mar.  
**Pendências/observações:** Nenhuma.

---

## Fase 3: Módulo de Scoring (`ScoringModule`)

**Plano proposto:** Implementação do módulo `ScoringModule` com algoritmos determinísticos de cálculo de pontuação (0-100) e justificativas em inglês (`reasons`) para as atividades Outdoor Sightseeing e Surfing.

**Alternativas consideradas:** 
- *Mensagens e Motivos em Inglês*: Garantir que todos os textos de resposta da API (`reasons`, `recommendationLevel`) estejam em inglês para integração fluida com o frontend em inglês.

**Decisão do desenvolvedor:** Aprovado início da Fase 3 (às 12:46).

**Timestamps**
| Marco | Horário |
|---|---|
| Plano proposto | 03/08 às 12:12 |
| Plano aprovado | 03/08 às 12:46 |
| Implementação iniciada | 03/08 às 12:46 |
| Implementação concluída | 03/08 às 12:48 |
| Revisão do usuário concluída | 03/08 às 12:48 |

**Resultado:** Módulo de scoring (`ScoringModule`) implementado com sucesso. Avaliadores `OutdoorSightseeingEvaluator` e `SurfingEvaluator` criados com lógica determinística de pontuação de 0 a 100 e todas as justificativas (`reasons`) e classificações em inglês.  
**Pendências/observações:** Nenhuma.

---

## Fase 4: Resolvers GraphQL + Schema Code-First (`RankingModule`)

**Plano proposto:** Configuração do `GraphQLModule` com `ApolloDriver` em `AppModule`, criação de `RankingResolver`, DTOs/ObjectTypes GraphQL (`ActivityRankingResultType`, `DailyScoreType`, `LocationSearchResultType`) e queries `rankActivity` e `searchLocations`.

**Alternativas consideradas:** 
- *Busca transparente por nome de cidade (`cityName`)*: O resolver encadeia `GeocodingService` -> `OpenMeteoClientService` -> `ScoringService`, simplificando a interface GraphQL.

**Decisão do desenvolvedor:** Aprovado início da Fase 4 (às 13:22).

**Timestamps**
| Marco | Horário |
|---|---|
| Plano proposto | 03/08 às 12:48 |
| Plano aprovado | 03/08 às 13:22 |
| Implementação iniciada | 03/08 às 13:22 |
| Implementação concluída | 03/08 às 13:30 |
| Revisão do usuário concluída | 03/08 às 13:30 |

**Resultado:** Resolvers GraphQL e Schema Code-First (`RankingModule`) implementados com sucesso. Queries `rankActivity` e `searchLocations` integradas com o `GraphQLModule` do NestJS e Apollo Driver.  
**Pendências/observações:** Nenhuma.

---

## Fase 5: Frontend React em Inglês (`apps/web`)

**Plano proposto:** Interface React 19 + TypeScript + Vite + Apollo Client (`apps/web`) em Dark Theme com estética premium, Glassmorphism, input de busca por cidade, seletor de atividade (*Outdoor Sightseeing* / *Surfing*), hero card de score geral e grid dos 7 dias com justificativas em inglês.

**Alternativas consideradas:** 
- *Vanilla CSS com variáveis de design*: Utilizar CSS custom properties em `apps/web/src/styles.css` para design limpo, fluido e responsivo.

**Decisão do desenvolvedor:** Aprovado início da Fase 5 (às 16:23).

**Timestamps**
| Marco | Horário |
|---|---|
| Plano proposto | 03/08 às 13:30 |
| Plano aprovado | 03/08 às 16:23 |
| Implementação iniciada | 03/08 às 16:23 |
| Implementação concluída | 03/08 às 16:55 |
| Revisão do usuário concluída | 03/08 às 16:55 |

**Resultado:** Frontend React + Apollo Client (`apps/web`) implementado em inglês com estética premium Glassmorphism, Dark Theme, busca de cidades, seletor de atividades, score hero card e grid interativo de 7 dias com justificativas detalhadas.  
**Pendências/observações:** Nenhuma.

---

## Fase 6: Deploy, CORS e Documentação Final (`README.md`)

**Plano proposto:** Configuração de CORS no NestJS (`apps/api/src/main.ts`), configuração de variáveis de ambiente para o Apollo Client (`apps/web/src/main.tsx`), criação do `README.md` principal da raiz com todas as seções exigidas pelo teste técnico da Collinson Group e consolidação final do Roadmap.

**Alternativas consideradas:** 
- *CORS Liberado para Cliente Web*: `app.enableCors()` configurado para permitir comunicação entre o frontend Vite (port 4200 ou Vercel) e o backend NestJS (port 3000 ou Render).
- *Vite Env Variables*: Suporte a `import.meta.env.VITE_GRAPHQL_URL` para flexibilidade de deploy.

**Decisão do desenvolvedor:** Aprovado início da Fase 6 (às 17:15).

**Timestamps**
| Marco | Horário |
|---|---|
| Plano proposto | 03/08 às 16:55 |
| Plano aprovado | 03/08 às 17:15 |
| Implementação iniciada | 03/08 às 17:15 |
| Implementação concluída | 03/08 às 17:35 |
| Ajustes Vercel Serverless | 03/08 às 19:30 às 19:46 |
| Correção vercel.json (removido builds) | 03/08 às 20:13 às 20:23 |
| Revisão do usuário concluída | 03/08 às 20:23 |

**Resultado:** CORS habilitado no NestJS, suporte a envs `VITE_GRAPHQL_URL` no React, handler Serverless exportado em `apps/api/src/main.ts` com cache de instância em memória, remoção da chave legada `"builds"` em `apps/api/vercel.json` permitindo que a Vercel execute o `pnpm install` e o `npx nx build api` do Dashboard sem ignorar a etapa de build, e `README.md` finalizado.  
**Pendências/observações:** Nenhuma.

---

## Resumo Final

- **Tempo total de escrita e estruturação de código**: ~2 horas e 25 minutos
  - *Fase 1 (Scaffold & Shared Types)*: ~30 min
  - *Fase 2 (Open-Meteo WeatherModule)*: ~15 min
  - *Fase 3 (ScoringModule)*: ~10 min
  - *Fase 4 (GraphQL Resolvers & Schema)*: ~20 min
  - *Fase 5 (Frontend React & Apollo Client)*: ~45 min
  - *Fase 6 (Deploy, CORS, Integration Check & Docs)*: ~25 min
- **Tempo total de revisão/aprovação**: ~4 horas (pausas humanas de leitura e validação estratégica)
- **Principais trade-offs da entrega**:
  - Foco na implementação profunda e arquiteturalmente sólida de **2 atividades** (*Outdoor Sightseeing* e *Surfing*) em vez de 4 rasas ("Quality > Quantity").
  - Omissão de gerenciador de estado global extra (Redux/Zustand), utilizando o cache em memória do Apollo Client.
- **O que seria feito diferente com mais tempo**:
  - Implementação das 2 atividades restantes (*Skiing* e *Indoor Sightseeing*).
  - Cobertura estendida de testes E2E com Playwright/Cypress.





