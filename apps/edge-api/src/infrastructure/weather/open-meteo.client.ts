import { LocationWeatherInfo, DailyWeatherData } from '@windrose/shared-types';

interface ForecastApiResponse {
  timezone?: string;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    precipitation_sum: number[];
    weathercode: number[];
    windspeed_10m_max: number[];
  };
}

interface MarineApiResponse {
  daily?: {
    time: string[];
    wave_height_max?: number[];
    wave_period_max?: number[];
  };
}

/**
 * Native Edge client for Open-Meteo Forecast & Marine Weather APIs with automatic retry
 * and resilience against upstream network/SSL hiccups (such as Cloudflare 525 errors).
 */
export class OpenMeteoClient {
  private static readonly forecastUrl = 'https://api.open-meteo.com/v1/forecast';
  private static readonly marineUrl = 'https://marine-api.open-meteo.com/v1/marine';
  private static readonly cache = new Map<string, { data: LocationWeatherInfo; expiresAt: number }>();
  private static readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Fetch 7-day weather metrics and marine conditions for coordinates.
   */
  static async getWeatherInfo(
    latitude: number,
    longitude: number,
    cityName?: string
  ): Promise<LocationWeatherInfo> {
    const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.data, cityName: cityName || cached.data.cityName };
    }

    const [forecastResult, marineResult] = await Promise.allSettled([
      this.fetchForecastWithRetry(latitude, longitude),
      this.fetchMarine(latitude, longitude),
    ]);

    if (forecastResult.status === 'rejected') {
      if (cached) return cached.data;
      throw new Error(`Failed to fetch forecast: ${forecastResult.reason?.message || 'Unknown error'}`);
    }

    const forecastData = forecastResult.value;
    const marineData = marineResult.status === 'fulfilled' ? marineResult.value : null;

    const daily: DailyWeatherData[] = forecastData.daily.time.map((date, index) => ({
      date,
      temperatureMax: forecastData.daily.temperature_2m_max[index] ?? 0,
      temperatureMin: forecastData.daily.temperature_2m_min[index] ?? 0,
      apparentTemperatureMax: forecastData.daily.apparent_temperature_max[index] ?? 0,
      apparentTemperatureMin: forecastData.daily.apparent_temperature_min[index] ?? 0,
      precipitationSum: forecastData.daily.precipitation_sum[index] ?? 0,
      weatherCode: forecastData.daily.weathercode[index] ?? 0,
      maxWindSpeed: forecastData.daily.windspeed_10m_max[index] ?? 0,
      waveHeightMax: marineData?.daily?.wave_height_max?.[index] ?? 0,
      wavePeriodMax: marineData?.daily?.wave_period_max?.[index] ?? 0,
    }));

    const result: LocationWeatherInfo = {
      latitude,
      longitude,
      cityName,
      timezone: forecastData.timezone || 'UTC',
      daily,
    };

    this.cache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return result;
  }

  private static async fetchForecastWithRetry(
    latitude: number,
    longitude: number,
    retries = 2
  ): Promise<ForecastApiResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.fetchForecast(latitude, longitude);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Retry only on transient network, handshake or 5xx errors
        const isTransient =
          lastError.message.includes('525') ||
          lastError.message.includes('502') ||
          lastError.message.includes('503') ||
          lastError.message.includes('504') ||
          lastError.message.includes('fetch');

        if (!isTransient || attempt === retries) {
          break;
        }

        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
      }
    }

    throw lastError || new Error('Failed to fetch forecast from Open-Meteo');
  }

  private static async fetchForecast(latitude: number, longitude: number): Promise<ForecastApiResponse> {
    const url = new URL(this.forecastUrl);
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set(
      'daily',
      'temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,weathercode,windspeed_10m_max'
    );
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'WindroseApp/2.0 (weather-ranking)',
        Accept: 'application/json',
      },
    });

    if (res.status === 429) {
      throw new Error('Open-Meteo Forecast rate limit reached. Please retry in a moment.');
    }

    if (!res.ok) {
      throw new Error(`Open-Meteo Forecast error HTTP ${res.status}`);
    }

    return (await res.json()) as ForecastApiResponse;
  }

  private static async fetchMarine(latitude: number, longitude: number): Promise<MarineApiResponse | null> {
    const url = new URL(this.marineUrl);
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('daily', 'wave_height_max,wave_period_max');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');

    try {
      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'WindroseApp/2.0 (weather-ranking)',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        // Inland locations return 400 when ocean grid is not applicable
        return null;
      }

      return (await res.json()) as MarineApiResponse;
    } catch {
      return null;
    }
  }
}
