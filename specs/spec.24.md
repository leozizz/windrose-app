# Spec - Issue #24: Mapa Interativo com Leaflet e OpenStreetMap

## 1. Visão Geral
Esta spec define a integração de mapas interativos no frontend do **Windrose App** (`apps/web`), permitindo aos viajantes visualizar geograficamente os locais curtidos (Matches) e as rotas do roteiro com pins categorizados e endereços reais. Também inclui a correção do bug `TypeError: Cannot read properties of undefined (reading 'length')` no hook de sessão.

---

## 2. Correção Imediata do Bug de Sessão
- **Causa**: O hook `useTripSession` exporta as propriedades `{ likedPois, totalLikes, swipe, undo, clearSession }`, porém no `app.tsx` foi referenciado `session.likedPlaces` (que é `undefined`), causando a exceção `session.likedPlaces.length`.
- **Ação**:
  1. Padronizar as propriedades exportadas pelo `useTripSession` (`likedPois` e `totalLikes`) e manter alias de compatibilidade `likedPlaces = likedPois`, `likePlace = (poi) => swipe(poi, 'liked')`, `rejectPlace = (poi) => swipe(poi, 'rejected')`, `undoLastAction = undo`, `clearCitySession = clearSession`.
  2. Ajustar `app.tsx` para usar optional chaining com fallback `session.likedPois?.length || 0`.

---

## 3. Implementação do Mapa Interativo

### 3.1. Componente `InteractiveMap.tsx`
- **Stack**: `leaflet` e `react-leaflet` v5 com OpenStreetMap / CartoDB Positron tiles (visual editorial elegante).
- **Recursos**:
  - Auto-ajuste de limites (*fitBounds*) para enquadrar perfeitamente todos os pontos no mapa.
  - Marcadores customizados com SVG embutido de acordo com a categoria (`Praia` = azul, `Museu` = roxo, `Restaurante` = âmbar, `Atração` = terracota).
  - Popups com foto miniatura, nome do local, endereço real e botão *"Como Chegar (Google Maps)"*.
  - Rota conectando os pontos no modo Roteiro.

### 3.2. Integração nas Telas
1. **Aba Matches**: Alternância entre visualização em Grade (*Gallery*) e Mapa (*Map View*).
2. **Aba Roteiro**: Mapa mostrando o itinerário completo e os pontos distribuídos por dia.

---

## 4. Critérios de Aceite
- [x] Bug corrigido no `useTripSession` e `app.tsx`.
- [x] `leaflet/dist/leaflet.css` importado corretamente.
- [x] Componente `InteractiveMap.tsx` funcional com pins, popups e links de rotas.
- [x] Alternância suave entre lista e mapa nos Matches.
- [x] 100% dos testes Vitest passando sem regressões.
