import { describe, it, expect } from 'vitest';
import { TravelDistanceCalculator } from './travel-distance.calculator';

describe('TravelDistanceCalculator', () => {
  describe('haversineDistance', () => {
    it('deve calcular a distância geodésica aproximada entre coordenadas conhecidas usando Haversine', () => {
      // Praia da Joaquina (-27.6289, -48.4478) para Centro de Florianópolis (-27.5969, -48.5495)
      const distance = TravelDistanceCalculator.haversineDistance(
        -27.6289,
        -48.4478,
        -27.5969,
        -48.5495
      );

      // Distância geodésica esperada em torno de 10.5 a 12 km
      expect(distance).toBeGreaterThan(10);
      expect(distance).toBeLessThan(12);
    });

    it('deve retornar 0 para coordenadas idênticas', () => {
      const distance = TravelDistanceCalculator.haversineDistance(
        -27.5969,
        -48.5495,
        -27.5969,
        -48.5495
      );

      expect(distance).toBe(0);
    });
  });

  describe('estimateTravelTimes', () => {
    it('deve retornar tempos mínimos de 1 min para distância zero', () => {
      const times = TravelDistanceCalculator.estimateTravelTimes(0);

      expect(times).toEqual({
        walkingMinutes: 1,
        drivingMinutes: 1,
      });
    });

    it('deve calcular tempos proporcionais de caminhada (~4.8 km/h) e carro (~25 km/h)', () => {
      // 1.2 km: ~15 min a pé e ~5 min de carro
      const times = TravelDistanceCalculator.estimateTravelTimes(1.2);

      expect(times.walkingMinutes).toBe(15);
      expect(times.drivingMinutes).toBe(5);
    });

    it('deve estimar tempos realistas para trajetos longos (> 10 km)', () => {
      // 11 km: ~138 min (2h 18min) a pé e ~26 min de carro
      const times = TravelDistanceCalculator.estimateTravelTimes(11);

      expect(times.walkingMinutes).toBe(138);
      expect(times.drivingMinutes).toBe(26);
    });
  });

  describe('formatDistance', () => {
    it('deve formatar adequadamente distâncias em metros para < 1 km', () => {
      expect(TravelDistanceCalculator.formatDistance(0.08)).toBe('~80 m');
      expect(TravelDistanceCalculator.formatDistance(0.65)).toBe('~650 m');
      expect(TravelDistanceCalculator.formatDistance(0.8)).toBe('~800 m');
    });

    it('deve formatar adequadamente distâncias em quilômetros para >= 1 km', () => {
      expect(TravelDistanceCalculator.formatDistance(1.2)).toBe('~1.2 km');
      expect(TravelDistanceCalculator.formatDistance(11)).toBe('~11 km');
      expect(TravelDistanceCalculator.formatDistance(10.4)).toBe('~10.4 km');
    });
  });

  describe('formatTravelSummary', () => {
    it('deve formatar resumo com minutos quando inferior a 1 hora', () => {
      const summary = TravelDistanceCalculator.formatTravelSummary('~1.2 km', 15, 5);
      expect(summary).toBe('~1.2 km • 15 min a pé / 5 min de carro');
    });

    it('deve formatar horas e minutos para durações iguais ou superiores a 60 minutos', () => {
      const summary = TravelDistanceCalculator.formatTravelSummary('~11 km', 138, 26);
      expect(summary).toBe('~11 km • 2 h 18 min a pé / 26 min de carro');
    });

    it('deve formatar horas exatas sem minutos residuais', () => {
      const summary = TravelDistanceCalculator.formatTravelSummary('~4.8 km', 60, 12);
      expect(summary).toBe('~4.8 km • 1 h a pé / 12 min de carro');
    });
  });

  describe('calculateTransitEstimate', () => {
    it('deve calcular objeto completo de TravelEstimate entre dois pontos de interesse', () => {
      const from = { latitude: -27.6289, longitude: -48.4478 };
      const to = { latitude: -27.5969, longitude: -48.5495 };

      const estimate = TravelDistanceCalculator.calculateTransitEstimate(from, to);

      expect(estimate).not.toBeNull();
      expect(estimate?.distanceKm).toBeGreaterThan(10);
      expect(estimate?.walkingMinutes).toBeGreaterThan(100);
      expect(estimate?.drivingMinutes).toBeGreaterThan(20);
      expect(estimate?.formattedDistance).toContain('km');
      expect(estimate?.formattedSummary).toContain('a pé /');
      expect(estimate?.formattedSummary).toContain('de carro');
    });

    it('deve retornar null se as coordenadas forem inválidas, NaN ou nulas', () => {
      expect(
        TravelDistanceCalculator.calculateTransitEstimate(
          { latitude: Number.NaN, longitude: -48.44 },
          { latitude: -27.59, longitude: -48.54 }
        )
      ).toBeNull();

      expect(
        TravelDistanceCalculator.calculateTransitEstimate(
          null as unknown as { latitude: number; longitude: number },
          { latitude: -27.59, longitude: -48.54 }
        )
      ).toBeNull();

      expect(
        TravelDistanceCalculator.calculateTransitEstimate(
          { latitude: 95, longitude: -48.44 }, // Fora dos limites [-90, 90]
          { latitude: -27.59, longitude: -48.54 }
        )
      ).toBeNull();
    });
  });
});
