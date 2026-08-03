import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { OpenMeteoClientService } from './open-meteo.client';

/**
 * Module providing weather data fetching and geocoding services.
 */
@Module({
  providers: [GeocodingService, OpenMeteoClientService],
  exports: [GeocodingService, OpenMeteoClientService],
})
export class WeatherModule {}
