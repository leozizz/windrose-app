# Guia de Aprendizado — Node.js, NestJS e GraphQL

> Objetivo: registrar o "porquê" de cada decisão técnica nova para mim, como material de estudo pós-teste.

---

## Conceito: NX Monorepo e Shared Types Library

**O que é:**
Arquitetura de monorepo gerenciada pelo NX que permite hospedar múltiplos aplicativos (`apps/web`, `apps/api`) e bibliotecas compartilhadas (`libs/shared-types`) em um único repositório Git, compartilhando ferramentas de build, linting e dependências.

**Por que foi usado aqui:**
Para centralizar os tipos TypeScript (DTOs, Enums, Interfaces GraphQL) em `@windrose/shared-types`, garantindo tipagem estrita de ponta a ponta entre frontend e backend sem duplicação de definições.

**Alternativas e por que não foram escolhidas:**
- *Projetos isolados (multi-repo)*: Dificultaria o compartilhamento de tipos e exigiria publicar pacotes npm privados ou duplicar código.
- *Turborepo*: NX já é utilizado no dia a dia do desenvolvedor, zerando a curva de aprendizado de ferramentas de monorepo.

**Prós:**
- Tipagem única e centralizada para contratos de API.
- Execução otimizada de comandos e tarefas (caching do NX).

**Contras:**
- Leve overhead de configuração inicial de aliases de caminho em TypeScript (`tsconfig.base.json`).

**Documentação oficial:**
- [NX Documentation](https://nx.dev/)

---

## Conceito: Code-First GraphQL no NestJS (`@nestjs/graphql`)

**O que é:**
Abordagem onde o esquema GraphQL (`schema.gql`) é gerado automaticamente a partir de classes TypeScript decoradas com `@ObjectType()`, `@Field()`, `@Resolver()`, `@Query()`, etc.

**Por que foi usado aqui:**
Evita a necessidade de manter manualmente arquivos `.graphql` (Schema-First) em sincronia com as classes TypeScript DTO, economizando tempo de desenvolvimento e reduzindo erros de incompatibilidade de tipos.

**Alternativas e por que não foram escolhidas:**
- *Schema-First*: Exige escrever o schema GraphQL manualmente em arquivos `.graphql` e depois gerar tipos TypeScript via ferramentas como GraphQL Code Generator.

**Prós:**
- Fonte única da verdade (Single Source of Truth) em TypeScript.
- Integração nativa com injeção de dependência e decorators do NestJS.

**Contras:**
- Acoplamento entre decoradores da framework e os tipos de domínio.

**Documentação oficial:**
- [NestJS GraphQL Code-First](https://docs.nestjs.com/graphql/quick-start#code-first)

---

## Conceito: Apollo Server + NestJS Driver (`@nestjs/apollo`)

**O que é:**
Driver oficial que integra a engine do Apollo Server v4 dentro da aplicação NestJS HTTP (Express), provendo o endpoint `/graphql` e o playground/sandbox para desenvolvimento.

**Por que foi usado aqui:**
Oferece compatibilidade total e madura com o `@nestjs/graphql`, permitindo testar queries facilmente via Apollo Studio Sandbox.

**Alternativas e por que não foram escolhidas:**
- *Mercurius (Fastify)*: Exigiria substituir o adapter HTTP do NestJS de Express para Fastify, aumentando complexidade desnecessária para o escopo.

**Prós:**
- Padrão de mercado para GraphQL em Node.js.
- Sandbox interativo integrado.

**Contras:**
- Tamanho de pacote um pouco maior em relação ao Mercurius.

**Documentação oficial:**
- [NestJS GraphQL Apollo Driver](https://docs.nestjs.com/graphql/quick-start#apollo-driver)

---

## Conceito: Services & Providers no NestJS (`@Injectable()`)

**O que é:**
Providers são classes decoradas com `@Injectable()` que contêm a lógica de negócio, integrações externas ou serviços de dados no NestJS. Eles são gerenciados pelo container de Injeção de Dependências (DI) do NestJS.

**Por que foi usado aqui:**
Para isolar completamente as chamadas às APIs externas do Open-Meteo (HTTP via Axios) dentro do `OpenMeteoClientService` e `GeocodingService`, impedindo que lógica HTTP vaze para os resolvers GraphQL ou controllers.

**Alternativas e por que não foram escolhidas:**
- *Chamadas HTTP diretas no Resolver*: Violarização da separação de responsabilidades (Separation of Concerns), dificultando reutilização e testes.

**Prós:**
- Alta testabilidade (facilidade de mock em testes unitários).
- Separação clara de responsabilidades no backend.

**Contras:**
- Leve verbosidade inicial de declaração em módulos do NestJS.

**Documentação oficial:**
- [NestJS Providers](https://docs.nestjs.com/providers)

---

## Conceito: GraphQL Resolvers (`@Resolver()`, `@Query()`)

**O que é:**
Classes decoradas com `@Resolver()` no NestJS que mapeiam operações GraphQL (queries, mutations) para métodos de serviço. Funcionam de maneira análoga aos Controllers no REST, porém sobre a camada GraphQL.

**Por que foi usado aqui:**
No `RankingResolver`, encapsulamos a entrada do usuário (`cityName`, `activity`), delegando o fluxo para os serviços de geocodificação, previsão do tempo e cálculo de score.

**Alternativas e por que não foram escolher:**
- *Controllers REST (`@Controller()`)*: A proposta do teste técnico e a stack exigida pela empresa pedem GraphQL.

**Prós:**
- O cliente/frontend solicita exatamente e apenas os campos de que necessita.
- Documentação e tipos autogerados e interativos via Sandbox.

**Contras:**
- Tratamento de exceções e erros de transporte requer formatação customizada no Apollo Server.

**Documentação oficial:**
- [NestJS GraphQL Resolvers](https://docs.nestjs.com/graphql/resolvers)

---

## Conceito: Apollo Client & React Hooks (`useLazyQuery`, `ApolloProvider`)

**O que é:**
Cliente GraphQL para React que gerencia conexões HTTP com o servidor GraphQL, controle de cache em memória e estado de carregamento/erro por meio de React Hooks declarativos (`useQuery`, `useLazyQuery`).

**Por que foi usado aqui:**
Permite ao frontend React realizar consultas GraphQL sob demanda via `useLazyQuery` sempre que o usuário busca uma cidade ou altera a aba de atividade, atualizando reativamente a UI sem gerenciador de estado global extra.

**Alternativas e por que não foram escolhidas:**
- *Fetch/Axios puro no React*: Exigiria gerenciar estado de loading, erro e cache manualmente via `useState` e `useEffect`.
- *Redux/Zustand*: Desnecessário para a complexidade do escopo; o cache em memória do Apollo Client gerencia o estado da API.

**Prós:**
- Integração reativa nativa com o React.
- Gerenciamento automático de estado de requisição (loading, error, data).

**Contras:**
- Leve atenção requerida às rotas de subpacotes de exportação no Apollo Client v4.

**Documentação oficial:**
- [Apollo Client React Documentation](https://www.apollographql.com/docs/react/)



