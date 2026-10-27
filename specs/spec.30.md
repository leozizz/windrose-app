# Spec - Issue #30: Resiliência contra 525 da Open-Meteo, Mapas 100% Livres de API Key e Remoção de Hardcodes

## 1. Visão Geral
Esta spec soluciona as três falhas operacionais apontadas:
1. **Erro 525 (SSL Handshake Failed / Cloudflare Origin Drop)** nas requisições à Open-Meteo em produção no Cloudflare Workers / Pages Functions.
2. **Exigência de API Key para Tiles de Mapa**: Migração para a camada de tiles do OpenStreetMap oficial (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`), que é 100% livre, aberta e dispensa qualquer cadastro ou API key.
3. **Hardcodes de Florianópolis**: A aplicação carregava dados fictícios ou fixos de Florianópolis por padrão. Agora o app inicia em estado neutro/vazio convidativo, aguardando que o usuário digite o destino desejado.

---

## 2. Resiliência do `OpenMeteoClient` (Fix 525)
- Em Cloudflare Workers, quando o edge da Cloudflare negocia TLS com a Open-Meteo sob tráfego de saída, cabeçalhos customizados complexos ou falhas pontuais de handshake podem retornar status 525.
- **Estratégia de Resiliência**:
  1. Retry com Backoff: Em caso de HTTP 525, 502, 503 ou erro de rede, o client executa até 2 tentativas automáticas.
  2. Simplificação de Headers: Utilizar `User-Agent` compatível com ASCII padrão (`Windrose/2.0 (weather-app)`).
  3. Degradação Suave / Cache Fallback: Se a Open-Meteo falhar temporariamente e houver dado recente em cache, retorna o dado em cache.

---

## 3. Mapas 100% Livres de API Key
- No `InteractiveMap.tsx`:
  - Substituir CartoDB por **OpenStreetMap Standard**:
    `https://tile.openstreetmap.org/{z}/{x}/{y}.png` com atribuição `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`.
  - Zero necessidade de chave, token ou conta externa.

---

## 4. Remoção de Hardcodes & Empty State Inicial
- No `App.tsx`:
  - Estado inicial `cityNameInput: ''` e `activeCity: ''`.
  - Não faz auto-fetch ao montar a página se `activeCity` for vazio.
  - Tela inicial de boas-vindas (*Hero Search*) inspirada nas landing pages de viagem do Dribbble, convidando o viajante a buscar seu primeiro destino.
- No `InteractiveMap.tsx` e `ItineraryView.tsx`:
  - Remover qualquer coordenada ou menção fixa a Florianópolis. Coordenadas padrão tornam-se neutras `[0, 0]` ou baseadas estritamente nos pontos retornados.

---

## 5. Critérios de Aceite
- [x] Retry automático e tratamento seguro de 525 em `OpenMeteoClient`.
- [x] Mapa com OpenStreetMap livre de API key.
- [x] Remoção completa de hardcodes de Florianópolis e tela inicial de boas-vindas com busca.
- [x] 100% dos testes Vitest passando.
