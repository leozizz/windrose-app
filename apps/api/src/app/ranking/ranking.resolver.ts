import { Resolver, Query, Args } from '@nestjs/graphql';
import { ActivityType } from '@windrose/shared-types';
import {
  ActivityRankingResultType,
  LocationSearchResultType,
} from './dto/ranking.dto';
import { GeocodingService } from '../weather/geocoding.service';
import { OpenMeteoClientService } from '../weather/open-meteo.client';
import { ScoringService } from '../scoring/scoring.service';

/**
 * GraphQL Resolver handling activity destination ranking queries.
 */
@Resolver()
export class RankingResolver {
  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly weatherClient: OpenMeteoClientService,
    private readonly scoringService: ScoringService
  ) {}

  /**
   * Rank a location for a specific activity over the next 7 days.
   *
   * @param cityName Name of the city (e.g., "Florianópolis").
   * @param activity Selected activity (OUTDOOR_SIGHTSEEING or SURFING).
   * @returns 7-day activity ranking result.
   */
  @Query(() => ActivityRankingResultType, {
    name: 'rankActivity',
    description: 'Returns weather suitability ranking for an activity over 7 days',
  })
  async rankActivity(
    @Args('cityName', { type: () => String }) cityName: string,
    @Args('activity', { type: () => ActivityType }) activity: ActivityType
  ): Promise<ActivityRankingResultType> {
    const location = await this.geocodingService.searchCity(cityName);
    const displayName = location.country ? `${location.name}, ${location.country}` : location.name;

    const weatherInfo = await this.weatherClient.getWeatherInfo(
      location.latitude,
      location.longitude,
      displayName
    );

    return this.scoringService.calculateScore(weatherInfo, activity);
  }

  /**
   * Search for locations matching a query string.
   *
   * @param query Search query term.
   * @returns List of matching location results.
   */
  @Query(() => [LocationSearchResultType], {
    name: 'searchLocations',
    description: 'Search for matching city names and coordinates',
  })
  async searchLocations(
    @Args('query', { type: () => String }) query: string
  ): Promise<LocationSearchResultType[]> {
    const result = await this.geocodingService.searchCity(query);
    return [result];
  }
}
