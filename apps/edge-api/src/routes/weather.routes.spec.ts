import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index';
import { GeocodingClient } from '../infrastructure/weather/geocoding.client';
import { OpenMeteoClient } from '../infrastructure/weather/open-meteo.client';
import { LocationWeatherInfo } from '@windrose/shared-types';

describe('Weather Routes Integration (Hono Edge API)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /health', () => {
    it('deve retornar HTTP 200 com status ok e runtime cloudflare-workers', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe('ok');
      expect(json.service).toBe('windrose-edge-api');
      expect(json.runtime).toBe('cloudflare-workers');
    });
  });

  describe('GET /api/weather/rank', () => {
    it('deve validar parâmetros de query e retornar HTTP 400 se a cidade for vazia', async () => {
      const res = await app.request('/api/weather/rank?city=');
      expect(res.status).toBe(400);
    });

    it('deve retornar HTTP 200 com ranking de atividade quando a cidade for válida', async () => {
      vi.spyOn(GeocodingClient, 'searchCity').mockResolvedValueOnce({
        name: 'Florianópolis',
        latitude: -27.59,
        longitude: -48.54,
        country: 'Brazil',
      });

      const mockWeather: LocationWeatherInfo = {
        latitude: -27.59,
        longitude: -48.54,
        cityName: 'Florianópolis',
        timezone: 'America/Sao_Paulo',
        daily: [
          {
            date: '2026-10-22',
            temperatureMax: 24,
            temperatureMin: 19,
            apparentTemperatureMax: 24,
            apparentTemperatureMin: 19,
            precipitationSum: 0,
            weatherCode: 0,
            maxWindSpeed: 12,
          },
        ],
      };

      vi.spyOn(OpenMeteoClient, 'getWeatherInfo').mockResolvedValueOnce(mockWeather);

      const res = await app.request(
        '/api/weather/rank?city=Florianopolis&activity=OUTDOOR_SIGHTSEEING'
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.locationName).toBe('Florianópolis');
      expect(json.activity).toBe('OUTDOOR_SIGHTSEEING');
      expect(json.overallScore).toBeGreaterThanOrEqual(80);
      expect(json.recommendationLevel).toBe('EXCELLENT');
      expect(json.dailyScores).toHaveLength(1);
    });

    it('deve retornar HTTP 200 com ranking para activity=BEACH_DAY', async () => {
      vi.spyOn(GeocodingClient, 'searchCity').mockResolvedValueOnce({
        name: 'Florianópolis',
        latitude: -27.59,
        longitude: -48.54,
        country: 'Brazil',
      });

      const mockWeather: LocationWeatherInfo = {
        latitude: -27.59,
        longitude: -48.54,
        cityName: 'Florianópolis',
        timezone: 'America/Sao_Paulo',
        daily: [
          {
            date: '2026-11-15',
            temperatureMax: 28,
            temperatureMin: 22,
            apparentTemperatureMax: 29,
            apparentTemperatureMin: 22,
            precipitationSum: 0,
            weatherCode: 0,
            maxWindSpeed: 10,
            waveHeightMax: 0.8,
            wavePeriodMax: 9,
          },
        ],
      };

      vi.spyOn(OpenMeteoClient, 'getWeatherInfo').mockResolvedValueOnce(mockWeather);

      const res = await app.request(
        '/api/weather/rank?city=Florianopolis&activity=BEACH_DAY'
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.activity).toBe('BEACH_DAY');
      expect(json.overallScore).toBeGreaterThanOrEqual(85);
      expect(json.recommendationLevel).toBe('EXCELLENT');
    });

    it('deve retornar HTTP 404 quando o serviço de geocodificação não encontrar a cidade', async () => {
      vi.spyOn(GeocodingClient, 'searchCity').mockRejectedValueOnce(
        new Error("Location 'UnknownCity123' not found")
      );

      const res = await app.request('/api/weather/rank?city=UnknownCity123');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain('not found');
    });

    it('deve retornar alertas de mudança brusca de tempo quando houver frente fria ou tempestade', async () => {
      vi.spyOn(GeocodingClient, 'searchCity').mockResolvedValueOnce({
        name: 'Curitiba',
        latitude: -25.42,
        longitude: -49.27,
        country: 'Brazil',
      });

      const mockWeather: LocationWeatherInfo = {
        latitude: -25.42,
        longitude: -49.27,
        cityName: 'Curitiba',
        timezone: 'America/Sao_Paulo',
        daily: [
          {
            date: '2026-11-18',
            temperatureMax: 28,
            temperatureMin: 18,
            apparentTemperatureMax: 28,
            apparentTemperatureMin: 18,
            precipitationSum: 0,
            weatherCode: 0,
            precipitationProbabilityMax: 10,
          },
          {
            date: '2026-11-19',
            temperatureMax: 19, // Queda de 9°C
            temperatureMin: 13,
            apparentTemperatureMax: 18,
            apparentTemperatureMin: 13,
            precipitationSum: 30, // Tempestade / chuva severa >= 25mm
            weatherCode: 95,
            precipitationProbabilityMax: 90, // Salto 10% -> 90%
          },
        ],
      };

      vi.spyOn(OpenMeteoClient, 'getWeatherInfo').mockResolvedValueOnce(mockWeather);

      const res = await app.request(
        '/api/weather/rank?city=Curitiba&activity=OUTDOOR_SIGHTSEEING'
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.alerts).toBeDefined();
      expect(json.alerts.length).toBeGreaterThanOrEqual(2);
      expect(json.alerts.some((a: { type: string }) => a.type === 'TEMPERATURE_DROP')).toBe(true);
      expect(json.alerts.some((a: { type: string }) => a.type === 'STORM')).toBe(true);
      expect(json.dailyScores[1].alerts).toBeDefined();
      expect(json.dailyScores[1].alerts.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/weather/forecast', () => {
    it('deve retornar HTTP 400 se lat/lon forem inválidos ou omitidos', async () => {
      const res = await app.request('/api/weather/forecast?lat=invalid');
      expect(res.status).toBe(400);
    });

    it('deve retornar HTTP 200 com previsão meteorológica e alertas climáticos para coordenadas válidas', async () => {
      const mockWeather: LocationWeatherInfo = {
        latitude: -25.42,
        longitude: -49.27,
        cityName: 'Curitiba',
        timezone: 'America/Sao_Paulo',
        daily: [
          {
            date: '2026-11-18',
            temperatureMax: 28,
            temperatureMin: 18,
            apparentTemperatureMax: 28,
            apparentTemperatureMin: 18,
            precipitationSum: 0,
            weatherCode: 0,
          },
          {
            date: '2026-11-19',
            temperatureMax: 19,
            temperatureMin: 13,
            apparentTemperatureMax: 18,
            apparentTemperatureMin: 13,
            precipitationSum: 0,
            weatherCode: 3,
          },
        ],
        alerts: [
          {
            id: 'alert-temp-drop-2026-11-19',
            type: 'TEMPERATURE_DROP',
            severity: 'WARNING',
            title: 'Queda Brusca de Temperatura (Frente Fria)',
            description: 'Queda de 9°C prevista.',
            date: '2026-11-19',
          },
        ],
      };

      vi.spyOn(OpenMeteoClient, 'getWeatherInfo').mockResolvedValueOnce(mockWeather);

      const res = await app.request('/api/weather/forecast?lat=-25.42&lon=-49.27&cityName=Curitiba');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.cityName).toBe('Curitiba');
      expect(json.alerts).toBeDefined();
      expect(json.alerts).toHaveLength(1);
      expect(json.alerts[0].type).toBe('TEMPERATURE_DROP');
    });
  });

  describe('GET /api/weather/search', () => {
    it('deve retornar HTTP 200 com coordenadas encontradas para termo de busca', async () => {
      vi.spyOn(GeocodingClient, 'searchCity').mockResolvedValueOnce({
        name: 'Honolulu',
        latitude: 21.3,
        longitude: -157.85,
        country: 'United States',
      });

      const res = await app.request('/api/weather/search?q=Honolulu');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.name).toBe('Honolulu');
      expect(json.latitude).toBe(21.3);
    });
  });
});
