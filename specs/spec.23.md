# Spec - Issue #23: Redesign Visual e Design System Windrose Wanderlust

## 1. Visão Geral
Esta spec orienta o redesign completo de interface e experiência (UI/UX) do **Windrose App**, transformando a aplicação de um tema escuro genérico em uma experiência visual de viagens contemporânea (*"Windrose Wanderlust"*), inspirada em conceitos do Dribbble (Traw Travel, Explore the World UI).

---

## 2. Pilares de Design ("Windrose Wanderlust")

### 2.1. Cores e Superfícies
- **Fundo Editorial Quente**: `#F8F9FA` com gradiente sutil `linear-gradient(180deg, #FDFBF7 0%, #F4EFEA 100%)`.
- **Primary (Compass Amber / Terracotta)**: `#F97316` / `#EA580C` — calor, sol, aventura.
- **Secondary (Ocean Depth)**: `#0F172A` / `#1E293B` — sofisticação tipográfica e contraste.
- **Surface Cards**: `#FFFFFF` com bordas suaves `rgba(0, 0, 0, 0.05)`, cantos generosos (`rounded-3xl` / `24px`), sombras suaves em camadas `shadow-[0_12px_40px_-10px_rgba(15,23,42,0.08)]`.
- **Badges e Micro-interações**:
  - Viabilidade Alta / Match: `#059669` / `#ECFDF5` (esmeralda suave).
  - Viabilidade Média: `#D97706` / `#FFFBEB` (âmbar dourado).
  - Rejeição: `#E11D48` / `#FFF1F2` (carmesim).
  - Tag de Endereço: `#64748B` com ícone de pin sutil.

### 2.2. Tipografia & Layout
- **Fontes**: *Plus Jakarta Sans* e *Inter*.
- **Header**: Efeito glassmorphism translúcido (`backdrop-blur-md bg-white/80 border-b border-stone-200/60`).
- **Navegação**: Tabs pill-shaped com indicador de destaque ativo em terracota e contador de matches em micro-badge.

### 2.3. SwipeDeck Reimaginado
- **Aspect Ratio Cinematográfico (4:5)**: Otimizado para visualização de fotos de viagens no desktop e no mobile.
- **Card Inferior**: Card posterior com leve escala (`scale-95`), opacidade gradual e elevação para dar profundidade 3D de baralho real.
- **Endereço e Badges**: Exibição elegante do endereço real retornado pelo Nominatim com ícone `📍`.
- **Botões Táteis**:
  - Desfazer: botão circular discreto com ícone de retorno `↺`.
  - Rejeitar: botão circular generoso com `✕` vermelho suave e elevação no hover.
  - Curtir: botão circular de destaque com `♥` esmeralda e pulso tátil.
  - Matches: botão flutuante com badge de contagem em tempo real.

---

## 3. Critérios de Aceite
- [x] Atualizar variáveis de design e classes utilitárias no `styles.css`.
- [x] Refatorar `App.tsx` com novo Header editorial, busca moderna e navegação em tabs de revista.
- [x] Atualizar `SwipeDeck.tsx` com novo aspect ratio, exibição de endereços reais e botões táteis.
- [x] Atualizar `MatchesList.tsx` com visual de galeria e cards elegantes.
- [x] Garantir acessibilidade WCAG (contraste mínimo 4.5:1, foco visível, aria labels).
- [x] 100% dos testes Vitest passando e zero inline styles no JSX.
