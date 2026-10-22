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
});
