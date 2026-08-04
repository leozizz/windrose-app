import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { LocationWeatherInfo, DailyWeatherData } from '@windrose/shared-types';

/**
 * Service client responsible for fetching raw weather data from Open-Meteo APIs with in-memory caching.
 */
@Injectable()
export class OpenMeteoClientService {
  private readonly logger = new Logger(OpenMeteoClientService.name);
  private readonly forecastApiUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly marineApiUrl = 'https://marine-api.open-meteo.com/v1/marine';

  // In-memory cache for weather forecasts (15 minutes TTL) to prevent 429 Open-Meteo rate limits
  private readonly weatherCache = new Map<string, { data: LocationWeatherInfo; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

  /**
   * Fetch 7-day weather forecast and marine metrics for given coordinates.
   *
   * @param latitude Target latitude.
   * @param longitude Target longitude.
   * @param cityName Optional city display name.
   * @returns Aggregated location weather info.
   */
  async getWeatherInfo(
    latitude: number,
    longitude: number,
    cityName?: string
  ): Promise<LocationWeatherInfo> {
    const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const cached = this.weatherCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Returning cached weather data for coords (${cacheKey})`);
      return { ...cached.data, cityName: cityName || cached.data.cityName };
    }

    try {
      const [forecastData, marineData] = await Promise.all([
        this.fetchForecast(latitude, longitude),
        this.fetchMarineWeather(latitude, longitude),
      ]);

      const daily: DailyWeatherData[] = forecastData.dates.map((date, index) => ({
        date,
        temperatureMax: forecastData.temperatureMax[index] ?? 0,
        temperatureMin: forecastData.temperatureMin[index] ?? 0,
        apparentTemperatureMax: forecastData.apparentTemperatureMax[index] ?? 0,
        apparentTemperatureMin: forecastData.apparentTemperatureMin[index] ?? 0,
        precipitationSum: forecastData.precipitationSum[index] ?? 0,
        weatherCode: forecastData.weatherCode[index] ?? 0,
        maxWindSpeed: forecastData.maxWindSpeed[index] ?? 0,
        waveHeightMax: marineData?.waveHeightMax?.[index] ?? 0,
        wavePeriodMax: marineData?.wavePeriodMax?.[index] ?? 0,
      }));

      const result: LocationWeatherInfo = {
        latitude,
        longitude,
        cityName,
        timezone: forecastData.timezone || 'UTC',
        daily,
      };

      this.weatherCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return result;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        this.logger.warn(`Open-Meteo API rate limit (429) hit for coords (${cacheKey})`);
        if (cached) {
          return { ...cached.data, cityName: cityName || cached.data.cityName };
        }
        throw new HttpException(
          'Open-Meteo weather service rate limit exceeded. Please try again in a few moments.',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
      throw error;
    }
  }

  private async fetchForecast(latitude: number, longitude: number) {
    try {
      const response = await axios.get(this.forecastApiUrl, {
        params: {
          latitude,
          longitude,
          daily: [
            'temperature_2m_max',
            'temperature_2m_min',
            'apparent_temperature_max',
            'apparent_temperature_min',
            'precipitation_sum',
            'weathercode',
            'windspeed_10m_max',
          ].join(','),
          timezone: 'auto',
        },
        headers: {
          'User-Agent': 'WindroseApp/1.0 (WindroseApp-Project)',
        },
        timeout: 5000,
      });

      const daily = response.data?.daily || {};
      return {
        timezone: response.data?.timezone,
        dates: (daily.time as string[]) || [],
        temperatureMax: (daily.temperature_2m_max as number[]) || [],
        temperatureMin: (daily.temperature_2m_min as number[]) || [],
        apparentTemperatureMax: (daily.apparent_temperature_max as number[]) || [],
        apparentTemperatureMin: (daily.apparent_temperature_min as number[]) || [],
        precipitationSum: (daily.precipitation_sum as number[]) || [],
        weatherCode: (daily.weathercode as number[]) || [],
        maxWindSpeed: (daily.windspeed_10m_max as number[]) || [],
      };
    } catch (error) {
      this.logger.error(`Error fetching Open-Meteo forecast: ${error.message}`);
      throw error;
    }
  }

  private async fetchMarineWeather(latitude: number, longitude: number) {
    try {
      const response = await axios.get(this.marineApiUrl, {
        params: {
          latitude,
          longitude,
          daily: ['wave_height_max', 'wave_period_max'].join(','),
          timezone: 'auto',
        },
        headers: {
          'User-Agent': 'WindroseApp/1.0 (WindroseApp-Project)',
        },
        timeout: 5000,
      });

      const daily = response.data?.daily || {};
      return {
        waveHeightMax: (daily.wave_height_max as number[]) || [],
        wavePeriodMax: (daily.wave_period_max as number[]) || [],
      };
    } catch (error) {
      // Inland locations return error for marine API; handle gracefully
      this.logger.warn(`Marine data unavailable for coords (${latitude}, ${longitude}): ${error.message}`);
      return null;
    }
  }
}
