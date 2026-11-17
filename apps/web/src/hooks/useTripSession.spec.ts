import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTripSession } from './useTripSession';
import { PointOfInterest, PoiCategory, PoiEnvironment } from '@windrose/shared-types';

describe('useTripSession hook', () => {
  const mockPoi: PointOfInterest = {
    id: 'poi-1',
    name: 'Praia da Joaquina',
    category: PoiCategory.BEACH,
    environment: PoiEnvironment.OUTDOOR,
    latitude: -27.62,
    longitude: -48.44,
    city: 'Florianópolis',
    description: 'Praia famosa',
    imageUrl: 'https://example.com/beach.jpg',
    tags: ['Praia'],
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('deve inicializar com estado vazio quando não há nada no localStorage', () => {
    const { result } = renderHook(() => useTripSession('Florianópolis'));

    expect(result.current.city).toBe('Florianópolis');
    expect(result.current.totalLikes).toBe(0);
    expect(result.current.likedPois).toEqual([]);
    expect(result.current.canUndo).toBe(false);
  });

  it('deve registrar swipe de curtida (liked) e atualizar likedPois e totalLikes', () => {
    const { result } = renderHook(() => useTripSession('Florianópolis'));

    act(() => {
      result.current.swipe(mockPoi, 'liked');
    });

    expect(result.current.totalLikes).toBe(1);
    expect(result.current.likedPois).toHaveLength(1);
    expect(result.current.likedPois[0].name).toBe('Praia da Joaquina');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.isSwiped('poi-1')).toBe(true);
  });

  it('deve registrar swipe de rejeição (rejected) sem adicionar a likedPois', () => {
    const { result } = renderHook(() => useTripSession('Florianópolis'));

    act(() => {
      result.current.swipe(mockPoi, 'rejected');
    });

    expect(result.current.totalLikes).toBe(0);
    expect(result.current.likedPois).toHaveLength(0);
    expect(result.current.isSwiped('poi-1')).toBe(true);
    expect(result.current.canUndo).toBe(true);
  });

  it('deve permitir desfazer (undo) a última ação executada', () => {
    const { result } = renderHook(() => useTripSession('Florianópolis'));

    act(() => {
      result.current.swipe(mockPoi, 'liked');
    });
    expect(result.current.totalLikes).toBe(1);

    act(() => {
      result.current.undo();
    });

    expect(result.current.totalLikes).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.isSwiped('poi-1')).toBe(false);
  });

  it('deve hidratar múltiplos locais curtidos via hydrateLikedPlaces e persistir no localStorage', () => {
    const { result } = renderHook(() => useTripSession('Florianópolis'));

    const poi2: PointOfInterest = {
      ...mockPoi,
      id: 'poi-2',
      name: 'Praia Mole',
    };

    act(() => {
      result.current.hydrateLikedPlaces([mockPoi, poi2]);
    });

    expect(result.current.totalLikes).toBe(2);
    expect(result.current.likedPois).toHaveLength(2);
    expect(result.current.likedPois.map((p) => p.name)).toEqual(['Praia da Joaquina', 'Praia Mole']);
    expect(result.current.isSwiped('poi-1')).toBe(true);
    expect(result.current.isSwiped('poi-2')).toBe(true);

    const storedRaw = localStorage.getItem('windrose_trip_v2_florianópolis');
    expect(storedRaw).not.toBeNull();
    const stored = JSON.parse(storedRaw as string);
    expect(Object.keys(stored.swipes)).toHaveLength(2);
  });

  it('não deve sobrescrever localStorage com estado vazio quando a cidade mudar (prevenção de race condition)', () => {
    // Prepara dados pré-existentes no localStorage para Ubatuba
    const ubatubaKey = 'windrose_trip_v2_ubatuba';
    localStorage.setItem(
      ubatubaKey,
      JSON.stringify({
        city: 'Ubatuba',
        swipes: {
          'poi-1': { poi: mockPoi, action: 'liked', timestamp: 123456 },
        },
        history: ['poi-1'],
      })
    );

    // Inicia o hook com cidade vazia (como no App.tsx ao montar)
    const { result, rerender } = renderHook(({ city }) => useTripSession(city), {
      initialProps: { city: '' },
    });

    expect(result.current.city).toBe('');
    expect(result.current.totalLikes).toBe(0);

    // Alterna a cidade para Ubatuba
    rerender({ city: 'Ubatuba' });

    // O hook NÃO deve ter apagado os dados de Ubatuba no localStorage e deve ter carregado o poi-1
    expect(result.current.city).toBe('Ubatuba');
    expect(result.current.totalLikes).toBe(1);
    expect(result.current.likedPois).toHaveLength(1);
    expect(result.current.likedPois[0].id).toBe('poi-1');

    const storedAfter = JSON.parse(localStorage.getItem(ubatubaKey) || '{}');
    expect(storedAfter.swipes?.['poi-1']).toBeDefined();
  });

  it('deve permitir hidratar locais especificando overrideCity mesmo com hook inicializado com cidade vazia', () => {
    const { result } = renderHook(() => useTripSession(''));

    act(() => {
      result.current.hydrateLikedPlaces([mockPoi], 'Ubatuba');
    });

    expect(result.current.city).toBe('Ubatuba');
    expect(result.current.totalLikes).toBe(1);
    expect(result.current.likedPois).toHaveLength(1);

    const storedRaw = localStorage.getItem('windrose_trip_v2_ubatuba');
    expect(storedRaw).not.toBeNull();
    const stored = JSON.parse(storedRaw as string);
    expect(stored.city).toBe('Ubatuba');
    expect(stored.swipes['poi-1']).toBeDefined();
  });
});
