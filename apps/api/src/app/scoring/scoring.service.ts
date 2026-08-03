import { Injectable } from '@nestjs/common';
import {
  ActivityType,
  LocationWeatherInfo,
  ActivityRankingResult,
  DailyScore,
} from '@windrose/shared-types';
import { OutdoorSightseeingEvaluator } from './evaluators/outdoor-sightseeing.evaluator';
import { SurfingEvaluator } from './evaluators/surfing.evaluator';

/**
 * Service calculating overall activity suitability scores and recommendation levels.
 */
@Injectable()
export class ScoringService {
  /**
   * Calculate 7-day ranking score for a specific activity at a target location.
   *
   * @param weatherInfo Location weather data.
   * @param activity Target activity type.
   * @returns Detailed activity ranking result.
   */
  calculateScore(
    weatherInfo: LocationWeatherInfo,
    activity: ActivityType
  ): ActivityRankingResult {
    const dailyScores: DailyScore[] = weatherInfo.daily.map((day) => {
      switch (activity) {
        case ActivityType.OUTDOOR_SIGHTSEEING:
          return OutdoorSightseeingEvaluator.evaluateDay(day);
        case ActivityType.SURFING:
          return SurfingEvaluator.evaluateDay(day);
        default:
          return OutdoorSightseeingEvaluator.evaluateDay(day);
      }
    });

    const totalScoreSum = dailyScores.reduce((acc, curr) => acc + curr.score, 0);
    const overallScore = dailyScores.length > 0 ? Math.round(totalScoreSum / dailyScores.length) : 0;

    let recommendationLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' = 'POOR';
    if (overallScore >= 80) recommendationLevel = 'EXCELLENT';
    else if (overallScore >= 60) recommendationLevel = 'GOOD';
    else if (overallScore >= 40) recommendationLevel = 'FAIR';

    return {
      locationName: weatherInfo.cityName || `${weatherInfo.latitude}, ${weatherInfo.longitude}`,
      latitude: weatherInfo.latitude,
      longitude: weatherInfo.longitude,
      activity,
      overallScore,
      recommendationLevel,
      dailyScores,
    };
  }
}
