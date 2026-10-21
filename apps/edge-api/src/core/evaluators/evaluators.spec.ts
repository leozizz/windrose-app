import { describe, it, expect } from 'vitest';
import { DailyWeatherData, ActivityType, LocationWeatherInfo } from '@windrose/shared-types';
import { OutdoorSightseeingEvaluator } from './outdoor-sightseeing.evaluator';
import { SurfingEvaluator } from './surfing.evaluator';
import { ScoringService } from './scoring.service';

describe('Activity Evaluators Domain Logic', () => {
  describe('OutdoorSightseeingEvaluator', () => {
    it('deve retornar pontuação 100 e EXCELLENT em condições meteorológicas perfeitas', () => {
      const idealDay: DailyWeatherData = {
        date: '2026-10-22',
        temperatureMax: 22,
        temperatureMin: 18,
        apparentTemperatureMax: 22,
        apparentTemperatureMin: 18,
        precipitationSum: 0,
        weatherCode: 0, // Clear sunny
        maxWindSpeed: 10,
      };

      const result = OutdoorSightseeingEvaluator.evaluateDay(idealDay);

      expect(result.score).toBe(100);
      expect(result.recommendationLevel).toBe('EXCELLENT');
      expect(result.reasons).toContain('Ideal temperature for outdoor sightseeing (22°C)');
      expect(result.reasons).toContain('No rain expected');
      expect(result.reasons).toContain('Clear sunny skies');
      expect(result.reasons).toContain('Gentle breeze (10 km/h)');
    });

    it('deve retornar pontuação baixa e POOR em condições adversas de chuva e frio', () => {
      const stormyDay: DailyWeatherData = {
        date: '2026-10-23',
        temperatureMax: 8,
        temperatureMin: 4,
        apparentTemperatureMax: 6,
        apparentTemperatureMin: 2,
        precipitationSum: 15,
        weatherCode: 65, // Heavy rain
        maxWindSpeed: 45,
      };

      const result = OutdoorSightseeingEvaluator.evaluateDay(stormyDay);

      expect(result.score).toBeLessThanOrEqual(20);
      expect(result.recommendationLevel).toBe('POOR');
      expect(result.reasons).toContain('Chilly temperature (8°C)');
      expect(result.reasons).toContain('Significant rainfall expected (15mm)');
    });
  });

  describe('SurfingEvaluator', () => {
    it('deve retornar pontuação 100 e EXCELLENT para swell de longo período e ondas ideais', () => {
      const epicSurfDay: DailyWeatherData = {
        date: '2026-10-24',
        temperatureMax: 24,
        temperatureMin: 19,
        apparentTemperatureMax: 24,
        apparentTemperatureMin: 19,
        precipitationSum: 0,
        weatherCode: 1,
        maxWindSpeed: 12,
        waveHeightMax: 1.8,
        wavePeriodMax: 14,
      };

      const result = SurfingEvaluator.evaluateDay(epicSurfDay);

      expect(result.score).toBe(100);
      expect(result.recommendationLevel).toBe('EXCELLENT');
      expect(result.reasons).toContain('Optimal wave height (1.8m)');
      expect(result.reasons).toContain('Long groundswell period (14s)');
    });

    it('deve retornar score 0 e POOR para locais continentais sem ondas', () => {
      const inlandDay: DailyWeatherData = {
        date: '2026-10-25',
        temperatureMax: 25,
        temperatureMin: 15,
        apparentTemperatureMax: 25,
        apparentTemperatureMin: 15,
        precipitationSum: 0,
        weatherCode: 0,
        maxWindSpeed: 10,
        waveHeightMax: 0,
        wavePeriodMax: 0,
      };

      const result = SurfingEvaluator.evaluateDay(inlandDay);

      expect(result.score).toBe(0);
      expect(result.recommendationLevel).toBe('POOR');
      expect(result.reasons).toContain('No ocean wave data available (inland location)');
    });
  });

  describe('ScoringService', () => {
    it('deve calcular a média de 7 dias e emitir ActivityRankingResult consolidado', () => {
      const mockWeather: LocationWeatherInfo = {
        latitude: -27.59,
        longitude: -48.54,
        cityName: 'Florianópolis',
        timezone: 'America/Sao_Paulo',
        daily: [
          {
            date: '2026-10-22',
            temperatureMax: 22,
            temperatureMin: 18,
            apparentTemperatureMax: 22,
            apparentTemperatureMin: 18,
            precipitationSum: 0,
            weatherCode: 0,
            maxWindSpeed: 10,
          },
          {
            date: '2026-10-23',
            temperatureMax: 20,
            temperatureMin: 17,
            apparentTemperatureMax: 20,
            apparentTemperatureMin: 17,
            precipitationSum: 0,
            weatherCode: 1,
            maxWindSpeed: 15,
          },
        ],
      };

      const ranking = ScoringService.calculateScore(
        mockWeather,
        ActivityType.OUTDOOR_SIGHTSEEING
      );

      expect(ranking.locationName).toBe('Florianópolis');
      expect(ranking.activity).toBe(ActivityType.OUTDOOR_SIGHTSEEING);
      expect(ranking.overallScore).toBeGreaterThanOrEqual(80);
      expect(ranking.recommendationLevel).toBe('EXCELLENT');
      expect(ranking.dailyScores).toHaveLength(2);
    });
  });
});
