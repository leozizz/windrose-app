import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { SwipeDeck } from './SwipeDeck';
import {
  PointOfInterest,
  PoiCategory,
  PoiEnvironment,
  BeachProfileType,
  CrowdLevel,
} from '@windrose/shared-types';

describe('SwipeDeck Component', () => {
  const mockPlaces: PointOfInterest[] = [
    {
      id: 'poi-1',
      name: 'Praia da Joaquina',
      category: PoiCategory.BEACH,
      environment: PoiEnvironment.OUTDOOR,
      latitude: -27.62,
      longitude: -48.44,
      city: 'Florianópolis',
      description: 'Dunas e surf',
      imageUrl: 'https://example.com/joaquina.jpg',
      tags: ['Surf', 'Dunas'],
    },
    {
      id: 'poi-2',
      name: 'Ponte Hercílio Luz',
      category: PoiCategory.ATTRACTION,
      environment: PoiEnvironment.OUTDOOR,
      latitude: -27.59,
      longitude: -48.56,
      city: 'Florianópolis',
      description: 'Cartão postal histórico',
      imageUrl: 'https://example.com/ponte.jpg',
      tags: ['Ponte', 'História'],
    },
    {
      id: 'poi-3',
      name: 'Mercado Público',
      category: PoiCategory.RESTAURANT,
      environment: PoiEnvironment.INDOOR,
      latitude: -27.598,
      longitude: -48.553,
      city: 'Florianópolis',
      description: 'Gastronomia típica',
      imageUrl: 'https://example.com/mercado.jpg',
      tags: ['Gastronomia'],
    },
  ];

  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve renderizar o card ativo no topo do deck', () => {
    render(
      <SwipeDeck
        places={mockPlaces}
        isSwiped={() => false}
        onSwipe={vi.fn()}
        onUndo={vi.fn()}
        canUndo={false}
        onViewMatches={vi.fn()}
        totalLikes={0}
      />
    );

    expect(screen.getByText('Praia da Joaquina')).toBeDefined();
    expect(screen.getByText('Dunas e surf')).toBeDefined();
    expect(screen.getByText('#Surf')).toBeDefined();
  });

  it('deve disparar onSwipe com "liked" ao clicar no botão de coração em modo instantâneo', () => {
    const handleSwipe = vi.fn();

    render(
      <SwipeDeck
        places={mockPlaces}
        isSwiped={() => false}
        onSwipe={handleSwipe}
        onUndo={vi.fn()}
        canUndo={false}
        onViewMatches={vi.fn()}
        totalLikes={0}
        animationDuration={0}
      />
    );

    const likeButton = screen.getByRole('button', { name: /curtir/i });
    fireEvent.click(likeButton);

    expect(handleSwipe).toHaveBeenCalledTimes(1);
    expect(handleSwipe).toHaveBeenCalledWith(mockPlaces[0], 'liked');
  });

  it('deve disparar onSwipe com "rejected" ao clicar no botão de passar em modo instantâneo', () => {
    const handleSwipe = vi.fn();

    render(
      <SwipeDeck
        places={mockPlaces}
        isSwiped={() => false}
        onSwipe={handleSwipe}
        onUndo={vi.fn()}
        canUndo={false}
        onViewMatches={vi.fn()}
        totalLikes={0}
        animationDuration={0}
      />
    );

    const rejectButton = screen.getByRole('button', { name: /rejeitar/i });
    fireEvent.click(rejectButton);

    expect(handleSwipe).toHaveBeenCalledTimes(1);
    expect(handleSwipe).toHaveBeenCalledWith(mockPlaces[0], 'rejected');
  });

  it('deve executar fly-out com fade-out gradual e chamar onSwipe somente ao fim da animação', () => {
    vi.useFakeTimers();
    const handleSwipe = vi.fn();

    render(
      <SwipeDeck
        places={mockPlaces}
        isSwiped={() => false}
        onSwipe={handleSwipe}
        onUndo={vi.fn()}
        canUndo={false}
        onViewMatches={vi.fn()}
        totalLikes={0}
        animationDuration={340}
      />
    );

    const likeButton = screen.getByRole('button', { name: /curtir/i });
    fireEvent.click(likeButton);

    // Durante o voo e fade-out, o callback ainda NÃO foi disparado
    expect(handleSwipe).not.toHaveBeenCalled();

    // O card ativo em voo possui classe flying-liked e o botão de curtir pulsa
    const card = screen.getByTestId('swipe-card');
    expect(card.className).toContain('flying-liked');
    expect(likeButton.className).toContain('btn-pulse-like');

    // O stamp de curtir aparece exclusivamente no card que está voando
    const stamp = screen.getByTestId('stamp-like');
    expect(stamp).toBeDefined();

    // Ao avançar o tempo dos 340ms, a transição se completa e o callback é acionado
    act(() => {
      vi.advanceTimersByTime(340);
    });

    expect(handleSwipe).toHaveBeenCalledTimes(1);
    expect(handleSwipe).toHaveBeenCalledWith(mockPlaces[0], 'liked');
  });

  it('deve desabilitar botões durante a animação de saída para evitar cliques múltiplos', () => {
    vi.useFakeTimers();
    const handleSwipe = vi.fn();

    render(
      <SwipeDeck
        places={mockPlaces}
        isSwiped={() => false}
        onSwipe={handleSwipe}
        onUndo={vi.fn()}
        canUndo={true}
        onViewMatches={vi.fn()}
        totalLikes={0}
        animationDuration={340}
      />
    );

    const rejectButton = screen.getByRole('button', { name: /rejeitar/i });
    const likeButton = screen.getByRole('button', { name: /curtir/i });
    const undoButton = screen.getByRole('button', { name: /desfazer/i });

    fireEvent.click(rejectButton);

    // Botões devem estar desabilitados durante a animação
    expect(rejectButton).toHaveProperty('disabled', true);
    expect(likeButton).toHaveProperty('disabled', true);
    expect(undoButton).toHaveProperty('disabled', true);

    act(() => {
      vi.advanceTimersByTime(340);
    });

    expect(handleSwipe).toHaveBeenCalledTimes(1);
    expect(handleSwipe).toHaveBeenCalledWith(mockPlaces[0], 'rejected');
  });

  it('deve exibir mensagem de conclusão quando todos os cartões foram swipados', () => {
    render(
      <SwipeDeck
        places={mockPlaces}
        isSwiped={() => true} // todos já foram swipados
        onSwipe={vi.fn()}
        onUndo={vi.fn()}
        canUndo={true}
        onViewMatches={vi.fn()}
        totalLikes={2}
      />
    );

    expect(screen.getByText(/você explorou todos os locais/i)).toBeDefined();
    expect(screen.getByText(/ver 2 matches/i)).toBeDefined();
  });

  describe('Acessibilidade e Atalhos de Teclado (WCAG 2.2 AA)', () => {
    it('deve conter atributos de acessibilidade ARIA e região aria-live informativa', () => {
      render(
        <SwipeDeck
          places={mockPlaces}
          isSwiped={() => false}
          onSwipe={vi.fn()}
          onUndo={vi.fn()}
          canUndo={false}
          onViewMatches={vi.fn()}
          totalLikes={0}
        />
      );

      const region = screen.getByRole('region', { name: /descoberta de locais/i });
      expect(region).toBeDefined();
      expect(region.getAttribute('aria-roledescription')).toBe('carrossel de descoberta interativo');

      const liveRegion = screen.getByTestId('swipe-live-region');
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.textContent).toContain('Praia da Joaquina');
    });

    it('deve possuir data-testid em todos os botões e controles de ação interativos', () => {
      render(
        <SwipeDeck
          places={mockPlaces}
          isSwiped={() => false}
          onSwipe={vi.fn()}
          onUndo={vi.fn()}
          canUndo={true}
          onViewMatches={vi.fn()}
          totalLikes={3}
        />
      );

      expect(screen.getByTestId('btn-undo')).toBeDefined();
      expect(screen.getByTestId('btn-reject')).toBeDefined();
      expect(screen.getByTestId('btn-like')).toBeDefined();
      expect(screen.getByTestId('btn-matches')).toBeDefined();
    });

    it('deve responder aos atalhos ArrowLeft (rejeitar) e ArrowRight (curtir)', () => {
      const handleSwipe = vi.fn();
      render(
        <SwipeDeck
          places={mockPlaces}
          isSwiped={() => false}
          onSwipe={handleSwipe}
          onUndo={vi.fn()}
          canUndo={false}
          onViewMatches={vi.fn()}
          totalLikes={0}
          animationDuration={0}
        />
      );

      // Seta Direita -> Curtir
      fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });
      expect(handleSwipe).toHaveBeenCalledWith(mockPlaces[0], 'liked');

      // Seta Esquerda -> Rejeitar
      fireEvent.keyDown(window, { key: 'ArrowLeft', code: 'ArrowLeft' });
      expect(handleSwipe).toHaveBeenCalledWith(mockPlaces[0], 'rejected');
    });

    it('deve responder à tecla ArrowUp para acionar desfazer (onUndo) se canUndo for verdadeiro', () => {
      const handleUndo = vi.fn();
      render(
        <SwipeDeck
          places={mockPlaces}
          isSwiped={() => false}
          onSwipe={vi.fn()}
          onUndo={handleUndo}
          canUndo={true}
          onViewMatches={vi.fn()}
          totalLikes={1}
          animationDuration={0}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(handleUndo).toHaveBeenCalledTimes(1);
    });

    it('não deve acionar atalhos de navegação se o foco estiver em um input de texto', () => {
      const handleSwipe = vi.fn();
      render(
        <div>
          <input data-testid="search-input" />
          <SwipeDeck
            places={mockPlaces}
            isSwiped={() => false}
            onSwipe={handleSwipe}
            onUndo={vi.fn()}
            canUndo={false}
            onViewMatches={vi.fn()}
            totalLikes={0}
            animationDuration={0}
          />
        </div>
      );

      const input = screen.getByTestId('search-input');
      input.focus();

      fireEvent.keyDown(input, { key: 'ArrowRight', code: 'ArrowRight' });
      fireEvent.keyDown(input, { key: 'ArrowLeft', code: 'ArrowLeft' });

      expect(handleSwipe).not.toHaveBeenCalled();
    });

    it('deve emitir anúncio acessível via onAnnounce ao acionar curtir, rejeitar ou desfazer', () => {
      const handleAnnounce = vi.fn();
      const handleUndo = vi.fn();

      const { rerender } = render(
        <SwipeDeck
          places={mockPlaces}
          isSwiped={() => false}
          onSwipe={vi.fn()}
          onUndo={handleUndo}
          canUndo={true}
          onViewMatches={vi.fn()}
          totalLikes={0}
          animationDuration={0}
          onAnnounce={handleAnnounce}
        />
      );

      // Seta Direita -> Curtir
      fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });
      expect(handleAnnounce).toHaveBeenCalledWith(
        expect.stringMatching(/você curtiu praia da joaquina/i)
      );

      // Seta Esquerda -> Rejeitar
      fireEvent.keyDown(window, { key: 'ArrowLeft', code: 'ArrowLeft' });
      expect(handleAnnounce).toHaveBeenCalledWith(
        expect.stringMatching(/você rejeitou praia da joaquina/i)
      );

      // Seta Cima -> Desfazer
      fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(handleAnnounce).toHaveBeenCalledWith(
        expect.stringMatching(/última decisão desfeita/i)
      );
    });
  });

  describe('Experiência Litoral e Metadados Balneares', () => {
    const mockBeachPlaces: PointOfInterest[] = [
      {
        id: 'beach-1',
        name: 'Praia da Enseada',
        category: PoiCategory.BEACH,
        environment: PoiEnvironment.OUTDOOR,
        latitude: -23.43,
        longitude: -45.07,
        city: 'Ubatuba',
        description: 'Águas calmas ideais para banho e crianças',
        imageUrl: 'https://example.com/enseada.jpg',
        tags: ['Praia', 'Família'],
        beachMetadata: {
          profile: BeachProfileType.CALM_WATERS,
          crowdEstimate: CrowdLevel.MODERATE,
          lifeguardAvailable: true,
          swimmingSuitabilityScore: 92,
          waveConditions: {
            heightMeters: 0.6,
            periodSeconds: 7,
            safeForSwimming: true,
          },
        },
      },
      {
        id: 'beach-2',
        name: 'Praia do Tombo',
        category: PoiCategory.BEACH,
        environment: PoiEnvironment.OUTDOOR,
        latitude: -23.99,
        longitude: -46.26,
        city: 'Guarujá',
        description: 'Forte arrebentação e mar de tombo',
        imageUrl: 'https://example.com/tombo.jpg',
        tags: ['Surf', 'Arrebentação'],
        beachMetadata: {
          profile: BeachProfileType.DEEP_DROP_OFF,
          crowdEstimate: CrowdLevel.BUZZING,
          lifeguardAvailable: true,
          swimmingSuitabilityScore: 35,
          waveConditions: {
            heightMeters: 2.3,
            periodSeconds: 12,
            safeForSwimming: false,
            safetyWarning: 'Atenção: arrebentação violenta e ondas de 2.3m. Risco severo para banhistas.',
          },
        },
      },
      {
        id: 'poi-urban',
        name: 'Museu da Cidade',
        category: PoiCategory.MUSEUM,
        environment: PoiEnvironment.INDOOR,
        latitude: -23.43,
        longitude: -45.08,
        city: 'Ubatuba',
        description: 'História local',
        imageUrl: 'https://example.com/museu.jpg',
        tags: ['História'],
      },
    ];

    it('deve renderizar a BeachFilterBar quando existirem praias na lista', () => {
      render(
        <SwipeDeck
          places={mockBeachPlaces}
          isSwiped={() => false}
          onSwipe={vi.fn()}
          onUndo={vi.fn()}
          canUndo={false}
          onViewMatches={vi.fn()}
          totalLikes={0}
        />
      );

      expect(screen.getByTestId('beach-filter-bar')).toBeDefined();
    });

    it('não deve renderizar a BeachFilterBar quando não houver praias', () => {
      const placesWithoutBeaches: PointOfInterest[] = [
        mockBeachPlaces[2], // apenas museu
      ];

      render(
        <SwipeDeck
          places={placesWithoutBeaches}
          isSwiped={() => false}
          onSwipe={vi.fn()}
          onUndo={vi.fn()}
          canUndo={false}
          onViewMatches={vi.fn()}
          totalLikes={0}
        />
      );

      expect(screen.queryByTestId('beach-filter-bar')).toBeNull();
    });

    it('deve renderizar badges de perfil, lotação e segurança balnear no card de praia', () => {
      render(
        <SwipeDeck
          places={mockBeachPlaces}
          isSwiped={() => false}
          onSwipe={vi.fn()}
          onUndo={vi.fn()}
          canUndo={false}
          onViewMatches={vi.fn()}
          totalLikes={0}
        />
      );

      const activeCard = screen.getByTestId('swipe-card');
      const profileBadge = within(activeCard).getByTestId('badge-beach-profile');
      expect(profileBadge.textContent).toContain('Águas Calmas');

      const crowdBadge = within(activeCard).getByTestId('badge-crowd-estimate');
      expect(crowdBadge.textContent).toContain('Movimento Moderado');

      const waveBadge = within(activeCard).getByTestId('badge-wave-safety');
      expect(waveBadge.textContent).toContain('Mar Calmo');
    });

    it('deve renderizar alerta de segurança quando o mar for desfavorável para banho', () => {
      // Rejeita a primeira praia para que o card do Tombo venha para o topo
      render(
        <SwipeDeck
          places={mockBeachPlaces}
          isSwiped={(id) => id === 'beach-1'}
          onSwipe={vi.fn()}
          onUndo={vi.fn()}
          canUndo={false}
          onViewMatches={vi.fn()}
          totalLikes={0}
        />
      );

      expect(screen.getByText('Praia do Tombo')).toBeDefined();
      const warningBanner = screen.getByTestId('beach-safety-warning');
      expect(warningBanner).toBeDefined();
      expect(warningBanner.textContent).toContain('arrebentação violenta');
    });

    it('deve filtrar os cards do deck quando o usuário seleciona um perfil balnear', () => {
      render(
        <SwipeDeck
          places={mockBeachPlaces}
          isSwiped={() => false}
          onSwipe={vi.fn()}
          onUndo={vi.fn()}
          canUndo={false}
          onViewMatches={vi.fn()}
          totalLikes={0}
        />
      );

      // Card atual é Praia da Enseada
      expect(screen.getByText('Praia da Enseada')).toBeDefined();

      // Clica no filtro de praia de tombo
      const dropoffFilter = screen.getByTestId('beach-filter-dropoff');
      fireEvent.click(dropoffFilter);

      // Agora o card ativo deve ser a Praia do Tombo
      expect(screen.getByText('Praia do Tombo')).toBeDefined();
      expect(screen.queryByText('Praia da Enseada')).toBeNull();
    });
  });
});
