# Análise de Arquitetura e Guia de Produção: Cloudflare Pages vs. Workers

Este documento consolida a análise técnica comparativa entre os modelos de deploy no Cloudflare (Pages vs. Workers), com base nas arquiteturas dos projetos `school-scheduling-system` e `studyzz`, e define a padronização oficial adotada para o **Windrose App**.

---

## 1. Análise dos Projetos de Referência

### 1. `school-scheduling-system` (Monorepo Híbrido com Cloudflare Pages)
- **Implementação do Backend**: Utiliza Pages Functions em `functions/api/[[route]].ts`.
- **Adaptador**:
  ```typescript
  import { handle } from "hono/cloudflare-pages";
  import app from "../../server/app";

  export const onRequest = handle(app);
  ```
- **Roteamento**: O Cloudflare Pages roteia qualquer requisição iniciada por `/api/*` diretamente para o Hono sob o mesmo domínio (`app.pages.dev`).
- **Ambiente Local**: O `vite.config.ts` utiliza proxy reverso para `/api` apontando para o servidor de desenvolvimento.

### 2. `studyzz` (Deploy Dedicado / Docker VPS)
- **Implementação do Backend**: Servidor Node.js dedicado com `@hono/node-server` rodando em containers Docker na Oracle Cloud (Always Free).
- **Finalidade**: Aplicação com tarefas em background, filas e banco relacional local, com pipeline de deploy via GitHub Actions.

---

## 2. Decisão de Arquitetura: Cloudflare Pages Functions

Para o **Windrose App**, a abordagem com **Cloudflare Pages e Pages Functions** foi a escolhida como padrão definitivo pelas seguintes razões:

1. **Repositório e Deploy Unificados**: Apenas 1 projeto gerenciado no Cloudflare Dashboard com deploy automático acionado por commits na branch `main`.
2. **Mesmo Domínio Nativo (`/api/*`)**:
   - Frontend: `https://windrose-app.pages.dev/`
   - API Hono: `https://windrose-app.pages.dev/api/*`
   - Zero necessidade de cabeçalhos de CORS em produção e zero dependência de domínios ou portas externas.
3. **Gratuito (\$0.00)**: Incluído na cota de 100.000 requisições/dia do Cloudflare Pages Functions.
4. **Deploy Atômico**: Front e Back são compilados e disponibilizados simultaneamente, eliminando riscos de incompatibilidade entre versões do cliente e do servidor.

---

## 3. Guia de Configuração no Cloudflare Pages

### 3.1. Configuração do Projeto no Dashboard
1. Acesse o **Cloudflare Dashboard** > **Workers & Pages** > **Create** > **Pages** > **Connect to Git**.
2. Conecte sua conta do GitHub e selecione o repositório `leozizz/windrose-app`.
3. Defina as configurações de Build:
   - **Project Name**: `windrose-app`
   - **Production Branch**: `main`
   - **Framework Preset**: `None` (ou `Vite`)
   - **Build Command**: `pnpm run build`
   - **Build Output Directory**: `dist/apps/web`
   - **Root Directory**: `/` (Raiz do repositório)

### 3.2. Variáveis de Ambiente (Environment Variables)
No modelo com Pages Functions, **nenhuma variável de ambiente é obrigatória para o funcionamento básico**.

| Variável | Obrigatória | Valor Padrão / Recomendado | Descrição |
| :--- | :---: | :---: | :--- |
| `NODE_VERSION` | Opcional | `20` ou `22` | Define a versão do Node.js usada no container de build do Cloudflare Pages. |
| `VITE_API_URL` | Opcional | *(deixar em branco)* | Se não fornecido, o frontend utilizará chamadas relativas `/api/*`. |
