import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index';
import { PlacesService } from '../core/places/places.service';
import { PoiCategory, PoiEnvironment } from '@windrose/shared-types';

describe('Places Routes Integration (Hono Edge API)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/places/deck', () => {
    it('deve retornar HTTP 400 se parâmetros obrigatórios estiverem ausentes', async () => {
      const res = await app.request('/api/places/deck?city=Florianopolis'); // falta lat e lon
      expect(res.status).toBe(400);
    });

    it('deve retornar HTTP 200 com deck de lugares e header de cache quando parâmetros forem válidos', async () => {
      vi.spyOn(PlacesService, 'getDeckForCity').mockResolvedValueOnce([
        {
          id: 'test-1',
          name: 'Praia da Joaquina',
          category: PoiCategory.BEACH,
          environment: PoiEnvironment.OUTDOOR,
          latitude: -27.62,
          longitude: -48.44,
          city: 'Florianópolis',
          description: 'Praia paradisíaca',
          imageUrl: 'https://example.com/beach.jpg',
          tags: ['Praia'],
        },
      ]);

      const res = await app.request('/api/places/deck?city=Florianopolis&lat=-27.59&lon=-48.54&limit=10');
      expect(res.status).toBe(200);

      // Validação de Edge Cache Headers
      const cacheControl = res.headers.get('Cache-Control');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('s-maxage=604800');

      const json = await res.json();
      expect(json.city).toBe('Florianopolis');
      expect(json.total).toBe(1);
      expect(json.deck).toHaveLength(1);
      expect(json.deck[0].name).toBe('Praia da Joaquina');
      expect(json.deck[0].category).toBe('BEACH');
    });

    it('deve retornar HTTP 500 se o serviço lançar exceção não tratada', async () => {
      vi.spyOn(PlacesService, 'getDeckForCity').mockRejectedValueOnce(
        new Error('Fatal Deck Generation Error')
      );

      const res = await app.request('/api/places/deck?city=Florianopolis&lat=-27.59&lon=-48.54');
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe('Fatal Deck Generation Error');
    });
  });

  describe('GET /api/places/curated-cities', () => {
    it('deve retornar HTTP 200 com lista de cidades suportadas de início', async () => {
      const res = await app.request('/api/places/curated-cities');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.cities).toBeDefined();
      expect(json.cities.length).toBeGreaterThanOrEqual(1);
      expect(json.cities[0].name).toBe('Florianópolis');
    });
  });
});
