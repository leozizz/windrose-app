import { describe, it, expect } from 'vitest';
import { ItineraryPlannerEngine } from './itinerary-planner.engine';
import {
  PointOfInterest,
  DailyScore,
  PoiCategory,
  PoiEnvironment,
  BeachProfileType,
  CrowdLevel,
} from '@windrose/shared-types';

describe('ItineraryPlannerEngine', () => {
  const mockLikedPois: PointOfInterest[] = [
    {
      id: 'poi-beach',
      name: 'Praia da Joaquina',
      category: PoiCategory.BEACH,
      environment: PoiEnvironment.OUTDOOR,
      latitude: -27.62,
      longitude: -48.44,
      city: 'Florianópolis',
      description: 'Dunas e surf',
      imageUrl: 'https://example.com/beach.jpg',
      tags: ['Surf'],
    },
    {
      id: 'poi-museum',
      name: 'Museu Histórico Palácio Cruz e Sousa',
      category: PoiCategory.MUSEUM,
      environment: PoiEnvironment.INDOOR,
      latitude: -27.59,
      longitude: -48.54,
      city: 'Florianópolis',
      description: 'Museu com acervo em palácio histórico',
      imageUrl: 'https://example.com/museum.jpg',
      tags: ['Museu', 'Cultura'],
    },
    {
      id: 'poi-restaurant',
      name: 'Artusi Ristorante',
      category: PoiCategory.RESTAURANT,
      environment: PoiEnvironment.INDOOR,
      latitude: -27.58,
      longitude: -48.55,
      city: 'Florianópolis',
      description: 'Gastronomia italiana contemporânea',
      imageUrl: 'https://example.com/food.jpg',
      tags: ['Jantar'],
    },
  ];

  const mockDailyScores: DailyScore[] = [
    {
      date: '2026-10-23',
      score: 90,
      recommendationLevel: 'EXCELLENT',
      reasons: ['Ensolarado e sem chuva'],
    },
    {
      date: '2026-10-24',
      score: 30,
      recommendationLevel: 'POOR',
      reasons: ['Chuva forte prevista'],
    },
  ];

  it('deve priorizar atração outdoor em dia com clima favorável', () => {
    const itinerary = ItineraryPlannerEngine.buildSmartItinerary(
      'Florianópolis',
      mockLikedPois,
      mockDailyScores
    );

    expect(itinerary.city).toBe('Florianópolis');
    expect(itinerary.days.length).toBeGreaterThanOrEqual(1);

    const sunnyDay = itinerary.days.find((d) => d.date === '2026-10-23');
    expect(sunnyDay).toBeDefined();
    expect(sunnyDay?.isRainyOrAdverse).toBe(false);

    // O primeiro slot (manhã) do dia ensolarado deve ser a Praia da Joaquina
    const morningSlot = sunnyDay?.slots.find((s) => s.slot === 'MORNING');
    expect(morningSlot?.place.environment).toBe(PoiEnvironment.OUTDOOR);
    expect(morningSlot?.place.name).toBe('Praia da Joaquina');
  });

  it('deve alocar atração indoor em dia com clima adverso ou chuva', () => {
    const itinerary = ItineraryPlannerEngine.buildSmartItinerary(
      'Florianópolis',
      mockLikedPois,
      mockDailyScores
    );

    const rainyDay = itinerary.days.find((d) => d.date === '2026-10-24');
    expect(rainyDay).toBeDefined();
    expect(rainyDay?.isRainyOrAdverse).toBe(true);

    const morningSlot = rainyDay?.slots.find((s) => s.slot === 'MORNING');
    expect(morningSlot?.place.environment).toBe(PoiEnvironment.INDOOR);
    expect(morningSlot?.weatherOptimizationNote).toContain('coberto');
  });

  it('deve retornar estrutura vazia graciosa se nenhum POI tiver sido curtido', () => {
    const itinerary = ItineraryPlannerEngine.buildSmartItinerary(
      'Florianópolis',
      [],
      mockDailyScores
    );

    expect(itinerary.totalPlacesScheduled).toBe(0);
    expect(itinerary.days).toEqual([]);
  });

  it('deve priorizar praias seguras para banho e adicionar nota explicativa balnear', () => {
    const safeBeach: PointOfInterest = {
      id: 'beach-safe',
      name: 'Praia da Enseada',
      category: PoiCategory.BEACH,
      environment: PoiEnvironment.OUTDOOR,
      latitude: -23.43,
      longitude: -45.07,
      city: 'Ubatuba',
      description: 'Mar calmo',
      imageUrl: 'https://example.com/enseada.jpg',
      tags: ['Família'],
      beachMetadata: {
        profile: BeachProfileType.CALM_WATERS,
        crowdEstimate: CrowdLevel.MODERATE,
        lifeguardAvailable: true,
        swimmingSuitabilityScore: 95,
        waveConditions: {
          heightMeters: 0.6,
          periodSeconds: 7,
          safeForSwimming: true,
        },
      },
    };

    const itinerary = ItineraryPlannerEngine.buildSmartItinerary(
      'Ubatuba',
      [safeBeach, mockLikedPois[1]], // Praia segura + Museu
      mockDailyScores
    );

    const sunnyDay = itinerary.days.find((d) => d.date === '2026-10-23');
    const beachSlot = sunnyDay?.slots.find((s) => s.place.id === 'beach-safe');
    expect(beachSlot).toBeDefined();
    expect(beachSlot?.weatherOptimizationNote).toContain('balnear');
  });

  it('não deve agendar praias em dias de clima chuvoso ou adverso', () => {
    const safeBeach: PointOfInterest = {
      id: 'beach-safe',
      name: 'Praia da Enseada',
      category: PoiCategory.BEACH,
      environment: PoiEnvironment.OUTDOOR,
      latitude: -23.43,
      longitude: -45.07,
      city: 'Ubatuba',
      description: 'Mar calmo',
      imageUrl: 'https://example.com/enseada.jpg',
      tags: ['Família'],
      beachMetadata: {
        profile: BeachProfileType.CALM_WATERS,
        crowdEstimate: CrowdLevel.MODERATE,
        lifeguardAvailable: true,
        swimmingSuitabilityScore: 90,
        waveConditions: {
          heightMeters: 0.5,
          periodSeconds: 6,
          safeForSwimming: true,
        },
      },
    };

    // Apenas 1 dia, e esse dia é chuvoso (score: 25)
    const rainyOnlyScores: DailyScore[] = [
      {
        date: '2026-10-24',
        score: 25,
        recommendationLevel: 'POOR',
        reasons: ['Chuva forte e mar revolto'],
      },
    ];

    const itinerary = ItineraryPlannerEngine.buildSmartItinerary(
      'Ubatuba',
      [safeBeach, mockLikedPois[1]], // Praia + Museu
      rainyOnlyScores
    );

    const rainyDay = itinerary.days[0];
    const beachSlot = rainyDay.slots.find((s) => s.place.category === PoiCategory.BEACH);
    expect(beachSlot).toBeUndefined(); // Praia não deve ser agendada no dia chuvoso
    const museumSlot = rainyDay.slots.find((s) => s.place.id === 'poi-museum');
    expect(museumSlot).toBeDefined();
  });
});
