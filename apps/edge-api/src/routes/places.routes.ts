import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { PlacesService } from '../core/places/places.service';
import { CURATED_CITY_POIS } from '../infrastructure/places/curated-fallbacks';

export const placesRouter = new Hono()
  .get(
    '/deck',
    zValidator(
      'query',
      z.object({
        city: z.string().min(1, 'City name is required'),
        lat: z.coerce.number().min(-90).max(90),
        lon: z.coerce.number().min(-180).max(180),
        limit: z.coerce.number().min(5).max(50).default(20),
      })
    ),
    async (c) => {
      const { city, lat, lon, limit } = c.req.valid('query');

      try {
        const deck = await PlacesService.getDeckForCity(city, lat, lon, limit);

        // Edge Caching: 1 day in browser, 7 days in Cloudflare Edge CDN
        c.header('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');

        return c.json(
          {
            city,
            coordinates: { lat, lon },
            total: deck.length,
            deck,
          },
          200
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate places deck';
        return c.json({ error: message }, 500);
      }
    }
  )
  .get('/curated-cities', (c) => {
    const cities = Object.keys(CURATED_CITY_POIS).map((key) => {
      const sample = CURATED_CITY_POIS[key][0];
      return {
        key,
        name: sample.city,
        totalCuratedPois: CURATED_CITY_POIS[key].length,
      };
    });

    c.header('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return c.json({ cities }, 200);
  });
