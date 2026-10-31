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

  it('deve executar animação de fly-out fluida antes de disparar o callback quando animationDuration > 0', () => {
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

    // O callback ainda não deve ter sido executado imediatamente durante o fly-out
    expect(handleSwipe).not.toHaveBeenCalled();

    // O card do topo recebe a classe de voo e o botão recebe pulso
    const card = screen.getByTestId('swipe-card');
    expect(card.className).toContain('flying-liked');
    expect(likeButton.className).toContain('btn-pulse-like');

    // Ao avançar o timer dos 300ms, a animação conclui e dispara o callback
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(handleSwipe).toHaveBeenCalledTimes(1);
    expect(handleSwipe).toHaveBeenCalledWith(mockPlaces[0], 'liked');
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
});
