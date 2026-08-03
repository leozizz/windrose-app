import { ActivityType } from './activity.enum';

/**
 * Daily forecast entry returned by Open-Meteo API.
 */
export interface DailyWeatherData {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  apparentTemperatureMax: number;
  apparentTemperatureMin: number;
  precipitationSum: number;
  weatherCode: number;
  maxWindSpeed?: number;
  waveHeightMax?: number;
  wavePeriodMax?: number;
}

/**
 * Weather metrics retrieved for a given geographic location.
 */
export interface LocationWeatherInfo {
  latitude: number;
  longitude: number;
  cityName?: string;
  timezone: string;
  daily: DailyWeatherData[];
}
