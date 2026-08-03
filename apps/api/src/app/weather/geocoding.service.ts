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
 * Service to search geographic coordinates using the Open-Meteo Geocoding API.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly baseUrl = 'https://geocoding-api.open-meteo.com/v1/search';

  /**
   * Search for coordinates and location metadata by city name.
   *
   * @param cityName Name of the city to search for.
   * @returns Best matching location coordinates and metadata.
   */
  async searchCity(cityName: string): Promise<GeocodingSearchResult> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          name: cityName,
          count: 1,
          language: 'en',
          format: 'json',
        },
        timeout: 5000,
      });

      const results = response.data?.results;
      if (!results || results.length === 0) {
        throw new NotFoundException(`Location '${cityName}' not found`);
      }

      const bestMatch = results[0];
      return {
        name: bestMatch.name,
        latitude: bestMatch.latitude,
        longitude: bestMatch.longitude,
        country: bestMatch.country,
        admin1: bestMatch.admin1,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to geocode location '${cityName}': ${error.message}`);
      throw new NotFoundException(`Could not retrieve coordinates for '${cityName}'`);
    }
  }
}
