import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

    const likeButton = screen.getByRole('button', { name: /curtir este local/i });
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

    const rejectButton = screen.getByRole('button', { name: /rejeitar este local/i });
    fireEvent.click(rejectButton);

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

    expect(screen.getByText(/você explorou todos os lugares/i)).toBeDefined();
    expect(screen.getByText(/ver meus matches \(2\)/i)).toBeDefined();
  });
});
