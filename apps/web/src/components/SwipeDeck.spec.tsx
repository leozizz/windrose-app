import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SwipeDeck } from './SwipeDeck';
import { PointOfInterest, PoiCategory, PoiEnvironment } from '@windrose/shared-types';

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

  it('deve disparar onSwipe com "liked" ao clicar no botão de coração', () => {
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
      />
    );

    const likeButton = screen.getByRole('button', { name: /curtir/i });
    fireEvent.click(likeButton);

    expect(handleSwipe).toHaveBeenCalledTimes(1);
    expect(handleSwipe).toHaveBeenCalledWith(mockPlaces[0], 'liked');
  });

  it('deve disparar onSwipe com "rejected" ao clicar no botão de passar', () => {
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
      />
    );

    const rejectButton = screen.getByRole('button', { name: /rejeitar/i });
    fireEvent.click(rejectButton);

    expect(handleSwipe).toHaveBeenCalledTimes(1);
    expect(handleSwipe).toHaveBeenCalledWith(mockPlaces[0], 'rejected');
  });

  it('deve exibir overlay de voo independente e animar sem retorno ao centro quando animationDuration > 0', () => {
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
        animationDuration={300}
      />
    );

    const likeButton = screen.getByRole('button', { name: /curtir/i });
    fireEvent.click(likeButton);

    // Callback onSwipe dispara para a pilha ascender
    expect(handleSwipe).toHaveBeenCalledTimes(1);
    expect(handleSwipe).toHaveBeenCalledWith(mockPlaces[0], 'liked');

    // Overlay de voo independente está ativo no topo com classe flying-liked
    const exitingCard = screen.getByTestId('exiting-card');
    expect(exitingCard).toBeDefined();
    expect(exitingCard.className).toContain('flying-liked');
    expect(likeButton.className).toContain('btn-pulse-like');

    // Ao avançar o tempo dos 300ms, o card de saída conclui o voo e é desmontado
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByTestId('exiting-card')).toBeNull();
  });

  it('deve desabilitar botões durante a animação de fly-out para evitar múltiplos cliques acidentais', () => {
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
        animationDuration={300}
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
      vi.advanceTimersByTime(300);
    });

    // Após conclusão da animação, os botões voltam a ficar habilitados
    expect(rejectButton).toHaveProperty('disabled', false);
    expect(likeButton).toHaveProperty('disabled', false);
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
});
