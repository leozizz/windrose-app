import { ActivityType } from './activity.enum';

export type WeatherAlertSeverity = 'WARNING' | 'CRITICAL' | 'INFO';

export type WeatherAlertType =
  | 'TEMPERATURE_DROP'
  | 'TEMPERATURE_SPIKE'
  | 'RAIN_SURGE'
  | 'WIND_GUST'
  | 'STORM';

export interface WeatherAlertMetricDelta {
  from: number;
  to: number;
  unit: string;
}

export interface WeatherAlert {
  id: string;
  type: WeatherAlertType;
  severity: WeatherAlertSeverity;
  title: string;
  description: string;
  date: string;
  previousDate?: string;
  metricDelta?: WeatherAlertMetricDelta;
  recommendation?: string;
}

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
  precipitationProbabilityMax?: number;
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
  alerts?: WeatherAlert[];
}
