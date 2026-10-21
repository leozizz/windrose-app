export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

interface OpenMeteoGeocodingApiResponse {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

/**
 * Client for Open-Meteo Geocoding API with in-memory TTL caching.
 */
export class GeocodingClient {
  private static readonly baseUrl = 'https://geocoding-api.open-meteo.com/v1/search';
  private static readonly cache = new Map<string, { data: GeocodingResult; expiresAt: number }>();
  private static readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Resolve a city name to geographic coordinates.
   */
  static async searchCity(cityName: string): Promise<GeocodingResult> {
    const trimmed = cityName.trim();
    if (!trimmed) {
      throw new Error('City name cannot be empty');
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const url = new URL(this.baseUrl);
    url.searchParams.set('name', trimmed);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'WindroseApp-Edge/2.0 (Cloudflare-Workers)',
        Accept: 'application/json',
      },
    });

    if (response.status === 429) {
      if (cached) return cached.data;
      throw new Error('Open-Meteo Geocoding rate limit reached. Please try again in a few moments.');
    }

    if (!response.ok) {
      throw new Error(`Geocoding service returned HTTP ${response.status}`);
    }

    const json = (await response.json()) as OpenMeteoGeocodingApiResponse;
    if (!json.results || json.results.length === 0) {
      throw new Error(`Location '${trimmed}' not found`);
    }

    const match = json.results[0];
    const result: GeocodingResult = {
      name: match.name,
      latitude: match.latitude,
      longitude: match.longitude,
      country: match.country,
      admin1: match.admin1,
    };

    this.cache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return result;
  }
}
