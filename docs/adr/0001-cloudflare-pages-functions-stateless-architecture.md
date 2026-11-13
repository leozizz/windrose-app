# ADR 0001: Arquitetura Unificada Cloudflare Pages + Pages Functions e Custo Operacional $0.00

- **Status:** Aprovado
- **Data:** 2026-10-21
- **Decisores:** Tech Lead, Backend, DevOps

## Contexto
O Windrose App requer alta disponibilidade global, baixa latência e custo operacional estritamente zero ($0.00) para atender usuários planejando viagens com base no clima em tempo real. O backend realiza consultas a dados meteorológicos e pontos de interesse, e o frontend precisa rodar como SPA/PWA responsivo.

## Decisão
1. **Unificação na Cloudflare:**
   - Frontend hospedado no **Cloudflare Pages** (`dist/apps/web`).
   - Backend servido via **Pages Functions** em `functions/api/[[route]].ts`, reutilizando a aplicação Hono definida em `apps/edge-api/src/index.ts`.
   - Compatibilidade de desenvolvimento local via Wrangler na porta `8787` e Vite proxy na porta `4200`.
2. **Stateless no Servidor na Fase 1:**
   - Zero bancos de dados relacionais gerenciados na borda nesta fase.
   - Estado de roteiro mantido no cliente via `localStorage` com tipagem e validação Zod no hook `useTripSession`.
3. **Provedores Externos $0.00:**
   - Previsão Meteorológica: Open-Meteo (Forecast, Marine, Geocoding).
   - Lugares e Coordenadas: OpenStreetMap (Nominatim e Overpass API).
   - Enriquecimento Fotográfico: Wikimedia Search API e Pool Temático determinístico.
   - Mapas: Leaflet com tiles abertos do OpenStreetMap.

## Consequências
- Custo de infraestrutura $0.00 permanente.
- Proibido importar módulos nativos Node.js (`fs`, `path`, `child_process`) no código do browser ou Edge.
- A latência de sub-requisições externas deve ser mitigada via Edge HTTP Caching (`Cache-Control: public, s-maxage=604800`) e pools curados.
