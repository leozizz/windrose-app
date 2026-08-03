import { ObjectType, Field, Float, Int, registerEnumType } from '@nestjs/graphql';
import { ActivityType } from '@windrose/shared-types';

registerEnumType(ActivityType, {
  name: 'ActivityType',
  description: 'Supported activities for weather destination ranking',
});

@ObjectType({ description: 'Daily activity score breakdown' })
export class DailyScoreType {
  @Field(() => String, { description: 'Forecast date (YYYY-MM-DD)' })
  date: string;

  @Field(() => Int, { description: 'Activity score from 0 to 100' })
  score: number;

  @Field(() => String, { description: 'Recommendation level (EXCELLENT, GOOD, FAIR, POOR)' })
  recommendationLevel: string;

  @Field(() => [String], { description: 'Detailed weather reasons in English' })
  reasons: string[];
}

@ObjectType({ description: '7-day activity ranking result for a destination' })
export class ActivityRankingResultType {
  @Field(() => String, { description: 'Name of the city or location' })
  locationName: string;

  @Field(() => Float, { description: 'Geographic latitude' })
  latitude: number;

  @Field(() => Float, { description: 'Geographic longitude' })
  longitude: number;

  @Field(() => ActivityType, { description: 'Target activity' })
  activity: ActivityType;

  @Field(() => Int, { description: 'Overall 7-day average score (0-100)' })
  overallScore: number;

  @Field(() => String, { description: 'Overall recommendation level' })
  recommendationLevel: string;

  @Field(() => [DailyScoreType], { description: 'Daily breakdown for the next 7 days' })
  dailyScores: DailyScoreType[];
}

@ObjectType({ description: 'Geocoding search location result' })
export class LocationSearchResultType {
  @Field(() => String, { description: 'City name' })
  name: string;

  @Field(() => Float, { description: 'Latitude' })
  latitude: number;

  @Field(() => Float, { description: 'Longitude' })
  longitude: number;

  @Field(() => String, { nullable: true, description: 'Country name' })
  country?: string;

  @Field(() => String, { nullable: true, description: 'Administrative region' })
  admin1?: string;
}
