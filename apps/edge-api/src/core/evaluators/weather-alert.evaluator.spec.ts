import { describe, it, expect } from 'vitest';
import { DailyWeatherData } from '@windrose/shared-types';
import { WeatherAlertEvaluator } from './weather-alert.evaluator';

describe('WeatherAlertEvaluator (Core Domain)', () => {
  it('deve retornar lista vazia quando o array de previsão estiver vazio ou tiver apenas 1 dia sem condições extremas', () => {
    expect(WeatherAlertEvaluator.evaluateAlerts([])).toEqual([]);

    const singleDay: DailyWeatherData[] = [
      {
        date: '2026-11-18',
        temperatureMax: 24,
        temperatureMin: 18,
        apparentTemperatureMax: 24,
        apparentTemperatureMin: 18,
        precipitationSum: 0,
        weatherCode: 1,
        precipitationProbabilityMax: 10,
        maxWindSpeed: 15,
      },
    ];

    expect(WeatherAlertEvaluator.evaluateAlerts(singleDay)).toEqual([]);
  });

  it('deve detectar queda brusca de temperatura >= 8°C e gerar alerta TEMPERATURE_DROP com severidade WARNING', () => {
    const daily: DailyWeatherData[] = [
      {
        date: '2026-11-18',
        temperatureMax: 28,
        temperatureMin: 20,
        apparentTemperatureMax: 28,
        apparentTemperatureMin: 20,
        precipitationSum: 0,
        weatherCode: 0,
        precipitationProbabilityMax: 10,
        maxWindSpeed: 10,
      },
      {
        date: '2026-11-19',
        temperatureMax: 19, // Queda de 9°C
        temperatureMin: 14,
        apparentTemperatureMax: 18,
        apparentTemperatureMin: 13,
        precipitationSum: 2,
        weatherCode: 3,
        precipitationProbabilityMax: 40,
        maxWindSpeed: 25,
      },
    ];

    const alerts = WeatherAlertEvaluator.evaluateAlerts(daily);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      type: 'TEMPERATURE_DROP',
      severity: 'WARNING',
      date: '2026-11-19',
      previousDate: '2026-11-18',
      metricDelta: {
        from: 28,
        to: 19,
        unit: '°C',
      },
    });
    expect(alerts[0].title).toContain('Queda');
    expect(alerts[0].description).toContain('9°C');
    expect(alerts[0].recommendation).toBeDefined();
  });

  it('deve marcar severidade CRITICAL quando a queda de temperatura for >= 12°C', () => {
    const daily: DailyWeatherData[] = [
      {
        date: '2026-11-18',
        temperatureMax: 30,
        temperatureMin: 22,
        apparentTemperatureMax: 31,
        apparentTemperatureMin: 22,
        precipitationSum: 0,
        weatherCode: 0,
      },
      {
        date: '2026-11-19',
        temperatureMax: 17, // Queda de 13°C
        temperatureMin: 12,
        apparentTemperatureMax: 16,
        apparentTemperatureMin: 11,
        precipitationSum: 4,
        weatherCode: 3,
      },
    ];

    const alerts = WeatherAlertEvaluator.evaluateAlerts(daily);
    const dropAlert = alerts.find((a) => a.type === 'TEMPERATURE_DROP');
    expect(dropAlert).toBeDefined();
    expect(dropAlert?.severity).toBe('CRITICAL');
  });

  it('deve detectar pico súbito de temperatura >= 8°C e gerar alerta TEMPERATURE_SPIKE', () => {
    const daily: DailyWeatherData[] = [
      {
        date: '2026-11-18',
        temperatureMax: 20,
        temperatureMin: 15,
        apparentTemperatureMax: 20,
        apparentTemperatureMin: 15,
        precipitationSum: 0,
        weatherCode: 1,
      },
      {
        date: '2026-11-19',
        temperatureMax: 29, // Aumento de 9°C
        temperatureMin: 21,
        apparentTemperatureMax: 31,
        apparentTemperatureMin: 21,
        precipitationSum: 0,
        weatherCode: 0,
      },
    ];

    const alerts = WeatherAlertEvaluator.evaluateAlerts(daily);
    const spikeAlert = alerts.find((a) => a.type === 'TEMPERATURE_SPIKE');
    expect(spikeAlert).toBeDefined();
    expect(spikeAlert?.severity).toBe('WARNING');
    expect(spikeAlert?.date).toBe('2026-11-19');
    expect(spikeAlert?.previousDate).toBe('2026-11-18');
    expect(spikeAlert?.metricDelta).toEqual({
      from: 20,
      to: 29,
      unit: '°C',
    });
  });

  it('deve detectar salto de probabilidade de chuva saindo de <= 20% para >= 80% e gerar alerta RAIN_SURGE', () => {
    const daily: DailyWeatherData[] = [
      {
        date: '2026-11-20',
        temperatureMax: 26,
        temperatureMin: 20,
        apparentTemperatureMax: 26,
        apparentTemperatureMin: 20,
        precipitationSum: 0,
        weatherCode: 1,
        precipitationProbabilityMax: 10,
      },
      {
        date: '2026-11-21',
        temperatureMax: 23,
        temperatureMin: 18,
        apparentTemperatureMax: 23,
        apparentTemperatureMin: 18,
        precipitationSum: 12,
        weatherCode: 63,
        precipitationProbabilityMax: 85,
      },
    ];

    const alerts = WeatherAlertEvaluator.evaluateAlerts(daily);
    const rainAlert = alerts.find((a) => a.type === 'RAIN_SURGE');
    expect(rainAlert).toBeDefined();
    expect(rainAlert?.severity).toBe('WARNING');
    expect(rainAlert?.date).toBe('2026-11-21');
    expect(rainAlert?.previousDate).toBe('2026-11-20');
    expect(rainAlert?.metricDelta).toEqual({
      from: 10,
      to: 85,
      unit: '%',
    });
  });

  it('deve detectar tempestade severa (WMO 95/96/99 ou chuva >= 25mm) e gerar alerta STORM com severidade CRITICAL', () => {
    const daily: DailyWeatherData[] = [
      {
        date: '2026-11-22',
        temperatureMax: 25,
        temperatureMin: 19,
        apparentTemperatureMax: 25,
        apparentTemperatureMin: 19,
        precipitationSum: 30, // >= 25mm
        weatherCode: 95, // Thunderstorm
      },
    ];

    const alerts = WeatherAlertEvaluator.evaluateAlerts(daily);
    const stormAlert = alerts.find((a) => a.type === 'STORM');
    expect(stormAlert).toBeDefined();
    expect(stormAlert?.severity).toBe('CRITICAL');
    expect(stormAlert?.date).toBe('2026-11-22');
    expect(stormAlert?.title).toContain('Tempestade');
  });

  it('deve detectar rajada de vento severa >= 50 km/h e gerar alerta WIND_GUST', () => {
    const daily: DailyWeatherData[] = [
      {
        date: '2026-11-23',
        temperatureMax: 22,
        temperatureMin: 17,
        apparentTemperatureMax: 22,
        apparentTemperatureMin: 17,
        precipitationSum: 2,
        weatherCode: 3,
        maxWindSpeed: 58, // >= 50 km/h
      },
    ];

    const alerts = WeatherAlertEvaluator.evaluateAlerts(daily);
    const windAlert = alerts.find((a) => a.type === 'WIND_GUST');
    expect(windAlert).toBeDefined();
    expect(windAlert?.severity).toBe('WARNING');
    expect(windAlert?.date).toBe('2026-11-23');
    expect(windAlert?.title).toContain('Vento');
  });

  it('deve retornar array vazio quando o clima for ameno e estável sem variações bruscas', () => {
    const daily: DailyWeatherData[] = [
      {
        date: '2026-11-15',
        temperatureMax: 24,
        temperatureMin: 18,
        apparentTemperatureMax: 24,
        apparentTemperatureMin: 18,
        precipitationSum: 0,
        weatherCode: 0,
        precipitationProbabilityMax: 10,
        maxWindSpeed: 15,
      },
      {
        date: '2026-11-16',
        temperatureMax: 25,
        temperatureMin: 19,
        apparentTemperatureMax: 25,
        apparentTemperatureMin: 19,
        precipitationSum: 0,
        weatherCode: 1,
        precipitationProbabilityMax: 15,
        maxWindSpeed: 18,
      },
      {
        date: '2026-11-17',
        temperatureMax: 23,
        temperatureMin: 17,
        apparentTemperatureMax: 23,
        apparentTemperatureMin: 17,
        precipitationSum: 1,
        weatherCode: 2,
        precipitationProbabilityMax: 20,
        maxWindSpeed: 20,
      },
    ];

    expect(WeatherAlertEvaluator.evaluateAlerts(daily)).toEqual([]);
  });
});
