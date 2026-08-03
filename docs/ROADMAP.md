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
| Revisão do usuário concluída | *Pendente* |

**Resultado:** Resolvers GraphQL e Schema Code-First (`RankingModule`) implementados com sucesso. Queries `rankActivity` e `searchLocations` integradas com o `GraphQLModule` do NestJS e Apollo Driver.  
**Pendências/observações:** Nenhuma.

---

## Resumo final (preencher ao término)
- Tempo total de escrita de código: TBD
- Tempo total de revisão/aprovação: TBD
- Principais trade-offs da entrega: TBD
- O que seria feito diferente com mais tempo: TBD



