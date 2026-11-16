import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchesList } from './MatchesList';
import { PointOfInterest, PoiCategory, PoiEnvironment } from '@windrose/shared-types';

describe('MatchesList Component', () => {
  const mockMatches: PointOfInterest[] = [
    {
      id: 'poi-1',
      name: 'Praia do Campeche',
      category: PoiCategory.BEACH,
      environment: PoiEnvironment.OUTDOOR,
      latitude: -27.68,
      longitude: -48.48,
      city: 'Florianópolis',
      description: 'Águas cristalinas e vista para a Ilha do Campeche.',
      imageUrl: 'https://example.com/campeche.jpg',
      tags: ['Praia', 'Surf'],
      address: 'Avenida Pequeno Príncipe',
      website: 'https://exemplo.com/campeche',
    },
    {
      id: 'poi-2',
      name: 'Mercado Público',
      category: PoiCategory.RESTAURANT,
      environment: PoiEnvironment.INDOOR,
      latitude: -27.597,
      longitude: -48.553,
      city: 'Florianópolis',
      description: 'Gastronomia típica e frutos do mar.',
      imageUrl: 'https://example.com/mercado.jpg',
      tags: ['Gastronomia'],
      address: 'Rua Jerônimo Coelho, 60',
    },
  ];

  it('deve renderizar a lista de locais curtidos com data-testids obrigatórios', () => {
    const handleBack = vi.fn();
    const handleClear = vi.fn();
    const handleGenerate = vi.fn();

    render(
      <MatchesList
        city="Florianópolis"
        matches={mockMatches}
        onBackToSwipe={handleBack}
        onClearMatches={handleClear}
        onGenerateItinerary={handleGenerate}
      />
    );

    expect(screen.getByText(/Seus Matches em Florianópolis/i)).toBeDefined();
    expect(screen.getByTestId('matches-view-grid-tab')).toBeDefined();
    expect(screen.getByTestId('matches-view-map-tab')).toBeDefined();
    expect(screen.getByTestId('matches-back-swipe-btn')).toBeDefined();
    expect(screen.getByTestId('matches-generate-itinerary-btn')).toBeDefined();
    expect(screen.getByTestId('matches-clear-btn')).toBeDefined();
    expect(screen.getByTestId('match-card-website-link')).toBeDefined();
  });

  it('deve alternar entre visão de grade e mapa ao clicar nas abas sem usar inline styles', () => {
    const { container } = render(
      <MatchesList
        city="Florianópolis"
        matches={mockMatches}
        onBackToSwipe={vi.fn()}
        onClearMatches={vi.fn()}
        onGenerateItinerary={vi.fn()}
      />
    );

    const gridTab = screen.getByTestId('matches-view-grid-tab');
    const mapTab = screen.getByTestId('matches-view-map-tab');

    // Verifica que as abas possuem classes semânticas
    expect(gridTab.classList.contains('matches-nav-tab-btn')).toBe(true);
    expect(gridTab.classList.contains('active')).toBe(true);

    // Contêiner de abas não deve ter inline style
    const navTabs = container.querySelector('.matches-nav-tabs');
    expect(navTabs).toBeDefined();
    expect(navTabs?.getAttribute('style')).toBeNull();

    // Alterna para o mapa
    fireEvent.click(mapTab);
    expect(mapTab.classList.contains('active')).toBe(true);
    const mapWrapper = container.querySelector('.matches-map-container');
    expect(mapWrapper).toBeDefined();
    expect(mapWrapper?.getAttribute('style')).toBeNull();
  });

  it('deve invocar os callbacks ao clicar nos botões de ação', () => {
    const handleBack = vi.fn();
    const handleClear = vi.fn();
    const handleGenerate = vi.fn();

    render(
      <MatchesList
        city="Florianópolis"
        matches={mockMatches}
        onBackToSwipe={handleBack}
        onClearMatches={handleClear}
        onGenerateItinerary={handleGenerate}
      />
    );

    fireEvent.click(screen.getByTestId('matches-back-swipe-btn'));
    expect(handleBack).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('matches-generate-itinerary-btn'));
    expect(handleGenerate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('matches-clear-btn'));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('deve exibir empty state com data-testid quando não houver matches', () => {
    const handleBack = vi.fn();

    render(
      <MatchesList
        city="Florianópolis"
        matches={[]}
        onBackToSwipe={handleBack}
        onClearMatches={vi.fn()}
        onGenerateItinerary={vi.fn()}
      />
    );

    expect(screen.getByText(/Nenhum local curtido ainda/i)).toBeDefined();
    const exploreBtn = screen.getByTestId('matches-empty-explore-btn');
    expect(exploreBtn).toBeDefined();

    fireEvent.click(exploreBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
