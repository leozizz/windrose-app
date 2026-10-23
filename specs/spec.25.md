# Spec - Issue #25: Redesign Editorial do Roteiro, Exportação em PDF e Correção de Bugs de Produção/Local

## 1. Visão Geral
Esta spec orienta a entrega da **Fase 4 do Épico #21**, além de resolver os dois problemas fundamentais reportados:
1. **Quebra por `undefined` em Produção**:
   - No `app.tsx`, a interface tentava acessar `ranking.dailyRanking` e `ranking.coordinates.latitude`, porém a API de produção da Hono retorna `dailyScores`, `latitude` e `longitude` conforme `ActivityRankingResult` oficial de `@windrose/shared-types`. A ausência de compatibilidade quebrava com `TypeError: Cannot read properties of undefined (reading '0')` e `undefined.latitude`.
2. **502 Bad Gateway no Desenvolvimento Local**:
   - O comando `pnpm dev` rodava apenas `pnpm --filter web dev` sem inicializar o servidor de backend `@windrose/edge-api` na porta `8787`, fazendo com que o proxy do Vite retornasse `ECONNREFUSED` (502).

---

## 2. Correções Técnicas

### 2.1. Normalização de Dados no `app.tsx`
- Utilizar `ranking.dailyScores` (com fallback para `ranking.dailyRanking`) garantindo compatibilidade total com o modelo de dados de ambos os contratos.
- Obter latitude/longitude direto de `ranking.latitude` e `ranking.longitude` com fallback para `ranking.coordinates`.
- Proteger todas as leituras de métricas contra valores `undefined`.

### 2.2. Script `dev` no `package.json`
- Adicionar comando `concurrently` (ou script coordenado) para que `pnpm run dev` inicie o frontend Vite e o servidor backend `wrangler dev` simultaneamente na porta `8787`, eliminando o erro de proxy 502 local.

---

## 3. Redesign Editorial do Roteiro e Exportação em PDF Print-Friendly

### 3.1. Visual Travel Magazine em `ItineraryView.tsx`
- **Capa Editorial**:
  - Título monumental do destino, badge com o clima predominante e número de dias.
  - Ações táteis destacadas: *"Baixar PDF de Viagem"* (`window.print()`) e *"Adicionar à Agenda (.ICS)"*.
- **Timeline de Períodos (Manhã, Tarde, Noite)**:
  - Cards enriquecidos com fotos dos locais selecionados, categoria, endereço completo e nota de otimização climática.
  - Mapa integrado mostrando a distribuição geográfica dos pontos do itinerário.
- **Estilos `@media print` Exclusivos**:
  - Ocultação de headers, botões de ação e tabs.
  - Formatação em folha A4 com tipografia preta nítida e fotos em alta definição com quebras de página controladas (`break-inside: avoid`).

---

## 4. Critérios de Aceite
- [x] Correção de `undefined` na leitura do ranking em produção.
- [x] Inicialização unificada de dev front + back para eliminar 502 local.
- [x] Redesign editorial de `ItineraryView.tsx` com print styles de revista de viagem.
- [x] 100% dos testes Vitest passando sem falhas.
