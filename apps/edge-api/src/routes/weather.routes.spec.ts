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

    it('deve retornar HTTP 404 quando o serviço de geocodificação não encontrar a cidade', async () => {
      vi.spyOn(GeocodingClient, 'searchCity').mockRejectedValueOnce(
        new Error("Location 'UnknownCity123' not found")
      );

      const res = await app.request('/api/weather/rank?city=UnknownCity123');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain('not found');
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
