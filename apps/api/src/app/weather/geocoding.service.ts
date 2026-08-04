import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';

/**
 * Result of a geocoding search for a location name.
 */
export interface GeocodingSearchResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

/**
 * Service to search geographic coordinates using the Open-Meteo Geocoding API with in-memory caching.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly baseUrl = 'https://geocoding-api.open-meteo.com/v1/search';

  // In-memory cache for geocoding queries to avoid 429 rate limits
  private readonly geocodeCache = new Map<string, { data: GeocodingSearchResult; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours TTL

  /**
   * Search for coordinates and location metadata by city name.
   *
   * @param cityName Name of the city to search for.
   * @returns Best matching location coordinates and metadata.
   */
  async searchCity(cityName: string): Promise<GeocodingSearchResult> {
    const cacheKey = cityName.trim().toLowerCase();
    const cached = this.geocodeCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Returning cached geocoding result for '${cityName}'`);
      return cached.data;
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          name: cityName,
          count: 1,
          language: 'en',
          format: 'json',
        },
        headers: {
          'User-Agent': 'WindroseApp/1.0 (WindroseApp-Project)',
        },
        timeout: 5000,
      });

      const results = response.data?.results;
      if (!results || results.length === 0) {
        throw new NotFoundException(`Location '${cityName}' not found`);
      }

      const bestMatch = results[0];
      const result: GeocodingSearchResult = {
        name: bestMatch.name,
        latitude: bestMatch.latitude,
        longitude: bestMatch.longitude,
        country: bestMatch.country,
        admin1: bestMatch.admin1,
      };

      this.geocodeCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response?.status === 429) {
        this.logger.warn(`Open-Meteo Geocoding rate limit hit for '${cityName}'`);
        if (cached) {
          return cached.data;
        }
        throw new NotFoundException(
          `Open-Meteo API rate limit reached. Please try searching '${cityName}' again in a minute.`
        );
      }

      this.logger.error(`Failed to geocode location '${cityName}': ${error.message}`);
      throw new NotFoundException(`Could not retrieve coordinates for '${cityName}'`);
    }
  }
}
