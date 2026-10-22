# testing.md
# Convenções de Teste do Projeto

> Preenchido pelo `setup.md` uma vez por projeto.
> Consultado pelo agente em toda issue que envolva testes.
> Atualizar quando as convenções mudarem — não por issue.

---

## 1. Pirâmide de Testes do Projeto

```
UNITÁRIOS (base — maior volume)
  O que cobre:
    - Funções puras de cálculo de pontuação de clima (OutdoorSightseeing, Surfing)
    - Algoritmo de roteirização temporal (alocação de slots manhã/tarde/noite com base no clima)
    - Validadores e parsers Zod para POIs e Sessão
    - Gerador de formato iCalendar (.ics) e links de calendário
  O que não cobre:
    - Chamadas reais a APIs de terceiros (Open-Meteo, Overpass, Wikimedia)
    - Renderização completa de componentes de UI

INTEGRAÇÃO (meio)
  O que cobre:
    - Handlers de rota do HonoJS (Edge API) simulando o fetch do Cloudflare Worker
    - Gateways mockados (WeatherGateway, PlacesGateway)
    - Componentes React isolados (SwipeDeck, ResultCard, WeatherBadge) com @testing-library/react
  O que não cobre:
    - Browser real, gestos complexos nativos de touch

E2E (topo — menor volume, fluxos críticos)
  O que cobre:
    - Fluxo completo: Busca de cidade -> Exibição do Clima -> Swipe de Atrações -> Geração do Roteiro -> Exportação
  O que não cobre:
    - Testes exaustivos de edge cases de combinações climáticas (ficam nos unitários)
```

---

## 2. Frameworks e Ferramentas

```
Unitários:        Vitest
Integração:       Vitest + @testing-library/react (Frontend) & Hono test client / Vitest (Backend)
E2E:              Playwright (planejado para fluxos críticos de ponta a ponta)
Mocks / Stubs:    vi.fn(), vi.spyOn(), MSW (Mock Service Worker) para Open-Meteo / Overpass
Fixtures:         Fixtures estáticas de respostas de clima e POIs OSM/Wikimedia
Coverage:         v8 (@vitest/coverage-v8)
```

---

## 3. Localização dos Testes

```
Unitários:        Ao lado do arquivo testado (*.spec.ts, *.spec.tsx)
Integração:       Ao lado do módulo testado (*.integration.spec.ts) ou subpasta tests/
E2E:              apps/web/e2e/ ou apps/web/tests/e2e/
Fixtures / Mocks: libs/shared-types/src/fixtures/ ou test-utils/
```

---

## 4. Nomenclatura

### Arquivos
```
Unitário:     [nome-do-arquivo].spec.ts / [nome-do-arquivo].spec.tsx
Integração:   [nome-do-modulo].integration.spec.ts
E2E:          [fluxo].e2e.ts
```

### Describes e Its
```
describe('[NomeDoComponente, Função ou Caso de Uso]', () => {
  describe('[contexto ou cenário específico]', () => {
    it('deve [comportamento esperado quando condição ocorre]', () => {
      // arrange, act, assert
    });
  });
});
```

---

## 5. Comandos

```bash
# Rodar todos os testes com Nx:
pnpm nx run-many --target=test

# Rodar testes do backend edge:
pnpm nx test edge-api

# Rodar testes do frontend web:
pnpm nx test web

# Rodar com coverage no Vitest:
pnpm nx test web --coverage

# Watch mode no desenvolvimento:
pnpm nx test web --watch
```

---

## 6. Critérios de Quando Testar

### Sempre testar (unitário obrigatório)
```
- Avaliadores determinísticos de clima (garantir notas 0-100 para extremos de temperatura/chuva/vento)
- Algoritmo de cruzamento de itinerário (garantir que atração outdoor não seja agendada em dia chuvoso se houver dia de sol)
- Utilitário de formatação de datas e gerador de arquivos .ics
- Parsers de validação de esquemas de sessão (Zod)
```

### Sempre testar (Integração obrigatória)
```
- Rotas da API Hono (/api/weather/rank, /api/places/deck) com mocks de gateway
- Hook e estado de sessão do usuário (gravação e leitura resiliente de LocalStorage)
```

### Não testar (evitar)
```
- Estilos visuais puros e transições CSS de animação
- Tipos TypeScript estáticos e interfaces puras
- Bibliotecas externas (ex: funcionamento interno do React ou Hono)
```
