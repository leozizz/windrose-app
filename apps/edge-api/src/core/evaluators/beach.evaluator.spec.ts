import { describe, it, expect } from 'vitest';
import { DailyWeatherData, BeachProfileType } from '@windrose/shared-types';
import { BeachEvaluator } from './beach.evaluator';

describe('BeachEvaluator Domain Logic', () => {
  it('deve retornar pontuação alta (>= 85), EXCELLENT e mar seguro em dia ensolarado com ondas amenas', () => {
    const idealBeachDay: DailyWeatherData = {
      date: '2026-11-15',
      temperatureMax: 28,
      temperatureMin: 22,
      apparentTemperatureMax: 29,
      apparentTemperatureMin: 22,
      precipitationSum: 0,
      weatherCode: 0, // Ensolarado
      maxWindSpeed: 12,
      waveHeightMax: 0.8,
      wavePeriodMax: 9,
    };

    const result = BeachEvaluator.evaluateDay(idealBeachDay, BeachProfileType.CALM_WATERS);

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.recommendationLevel).toBe('EXCELLENT');
    expect(result.waveConditions.safeForSwimming).toBe(true);
    expect(result.waveConditions.heightMeters).toBe(0.8);
    expect(result.waveConditions.periodSeconds).toBe(9);
    expect(result.reasons.some((r) => r.includes('ideal') || r.includes('Ideal'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Sem previsão de chuva'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Mar calmo'))).toBe(true);
  });

  it('deve sinalizar safeForSwimming false e POOR quando as ondas forem superiores a 2.0m', () => {
    const roughSeaDay: DailyWeatherData = {
      date: '2026-11-16',
      temperatureMax: 26,
      temperatureMin: 20,
      apparentTemperatureMax: 26,
      apparentTemperatureMin: 20,
      precipitationSum: 0,
      weatherCode: 1,
      maxWindSpeed: 20,
      waveHeightMax: 2.5,
      wavePeriodMax: 12,
    };

    const result = BeachEvaluator.evaluateDay(roughSeaDay);

    expect(result.waveConditions.safeForSwimming).toBe(false);
    expect(result.waveConditions.safetyWarning).toBeDefined();
    expect(result.waveConditions.safetyWarning).toContain('2.5m');
    expect(result.recommendationLevel).toBe('POOR');
    expect(result.reasons.some((r) => r.toLowerCase().includes('arrebentação') || r.toLowerCase().includes('mar revolto'))).toBe(true);
  });

  it('deve penalizar e emitir alerta quando o vento costeiro for superior a 35 km/h', () => {
    const windyBeachDay: DailyWeatherData = {
      date: '2026-11-17',
      temperatureMax: 27,
      temperatureMin: 21,
      apparentTemperatureMax: 27,
      apparentTemperatureMin: 21,
      precipitationSum: 0,
      weatherCode: 2,
      maxWindSpeed: 42,
      waveHeightMax: 1.1,
      wavePeriodMax: 8,
    };

    const result = BeachEvaluator.evaluateDay(windyBeachDay);

    expect(result.score).toBeLessThan(75);
    expect(result.reasons.some((r) => r.includes('42 km/h') && (r.toLowerCase().includes('vento forte') || r.toLowerCase().includes('rajadas')))).toBe(true);
  });

  it('deve sinalizar safeForSwimming false para praia de tombo (DEEP_DROP_OFF) com ondas moderadas (> 1.2m)', () => {
    const dropOffBeachDay: DailyWeatherData = {
      date: '2026-11-18',
      temperatureMax: 27,
      temperatureMin: 21,
      apparentTemperatureMax: 27,
      apparentTemperatureMin: 21,
      precipitationSum: 0,
      weatherCode: 1,
      maxWindSpeed: 15,
      waveHeightMax: 1.4,
      wavePeriodMax: 8,
    };

    const result = BeachEvaluator.evaluateDay(dropOffBeachDay, BeachProfileType.DEEP_DROP_OFF);

    expect(result.waveConditions.safeForSwimming).toBe(false);
    expect(result.waveConditions.safetyWarning).toBeDefined();
    expect(result.waveConditions.safetyWarning?.toLowerCase()).toContain('tombo');
  });

  it('deve atribuir pontuação muito baixa e POOR em dias de chuva significativa e frio (< 20°C)', () => {
    const rainyColdDay: DailyWeatherData = {
      date: '2026-11-19',
      temperatureMax: 17,
      temperatureMin: 13,
      apparentTemperatureMax: 16,
      apparentTemperatureMin: 12,
      precipitationSum: 18,
      weatherCode: 65,
      maxWindSpeed: 30,
      waveHeightMax: 1.2,
      wavePeriodMax: 7,
    };

    const result = BeachEvaluator.evaluateDay(rainyColdDay);

    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.recommendationLevel).toBe('POOR');
    expect(result.reasons.some((r) => r.toLowerCase().includes('chuva'))).toBe(true);
    expect(result.reasons.some((r) => r.toLowerCase().includes('fria') || r.toLowerCase().includes('baixa'))).toBe(true);
  });

  it('deve tratar adequadamente praias sem métricas marítimas disponíveis sem lançar exceções', () => {
    const noMarineDataDay: DailyWeatherData = {
      date: '2026-11-20',
      temperatureMax: 29,
      temperatureMin: 21,
      apparentTemperatureMax: 30,
      apparentTemperatureMin: 21,
      precipitationSum: 0,
      weatherCode: 0,
      maxWindSpeed: 10,
    };

    const result = BeachEvaluator.evaluateDay(noMarineDataDay);

    expect(result.waveConditions.heightMeters).toBe(0);
    expect(result.waveConditions.periodSeconds).toBe(0);
    expect(result.waveConditions.safeForSwimming).toBe(true);
    expect(result.score).toBeGreaterThan(70);
  });
});
