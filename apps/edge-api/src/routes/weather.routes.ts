import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ActivityType } from '@windrose/shared-types';
import { GeocodingClient } from '../infrastructure/weather/geocoding.client';
import { OpenMeteoClient } from '../infrastructure/weather/open-meteo.client';
import { ScoringService } from '../core/evaluators/scoring.service';

export const weatherRouter = new Hono()
  .get(
    '/rank',
    zValidator(
      'query',
      z.object({
        city: z.string().min(1, 'City name is required'),
        activity: z
          .nativeEnum(ActivityType)
          .default(ActivityType.OUTDOOR_SIGHTSEEING),
      })
    ),
    async (c) => {
      const { city, activity } = c.req.valid('query');

      try {
        const location = await GeocodingClient.searchCity(city);
        const weatherInfo = await OpenMeteoClient.getWeatherInfo(
          location.latitude,
          location.longitude,
          location.name
        );
        const ranking = ScoringService.calculateScore(weatherInfo, activity);

        return c.json(ranking, 200);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to evaluate destination';
        if (message.includes('not found')) {
          return c.json({ error: message }, 404);
        }
        return c.json({ error: message }, 500);
      }
    }
  )
  .get(
    '/forecast',
    zValidator(
      'query',
      z.object({
        lat: z.coerce.number().min(-90).max(90),
        lon: z.coerce.number().min(-180).max(180),
        cityName: z.string().optional(),
      })
    ),
    async (c) => {
      const { lat, lon, cityName } = c.req.valid('query');

      try {
        const weatherInfo = await OpenMeteoClient.getWeatherInfo(lat, lon, cityName);
        return c.json(weatherInfo, 200);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch weather forecast';
        return c.json({ error: message }, 500);
      }
    }
  )
  .get(
    '/search',
    zValidator(
      'query',
      z.object({
        q: z.string().min(1, 'Search query is required'),
      })
    ),
    async (c) => {
      const { q } = c.req.valid('query');

      try {
        const location = await GeocodingClient.searchCity(q);
        return c.json(location, 200);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to search location';
        if (message.includes('not found')) {
          return c.json({ error: message }, 404);
        }
        return c.json({ error: message }, 500);
      }
    }
  );
