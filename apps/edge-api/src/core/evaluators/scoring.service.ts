import {
  ActivityType,
  LocationWeatherInfo,
  ActivityRankingResult,
  DailyScore,
} from '@windrose/shared-types';
import { OutdoorSightseeingEvaluator } from './outdoor-sightseeing.evaluator';
import { SurfingEvaluator } from './surfing.evaluator';
import { BeachEvaluator } from './beach.evaluator';
import { WeatherAlertEvaluator } from './weather-alert.evaluator';

/**
 * Service calculating overall activity suitability scores and recommendation levels.
 */
export class ScoringService {
  /**
   * Calculate 7-day ranking score for a specific activity at a target location.
   *
   * @param weatherInfo Location weather data.
   * @param activity Target activity type.
   * @returns Detailed activity ranking result.
   */
  static calculateScore = (
    weatherInfo: LocationWeatherInfo,
    activity: ActivityType
  ): ActivityRankingResult => {
    const alerts = weatherInfo.alerts ?? WeatherAlertEvaluator.evaluateAlerts(weatherInfo.daily);

    const dailyScores: DailyScore[] = weatherInfo.daily.map((day) => {
      let scoreObj: DailyScore;
      switch (activity) {
        case ActivityType.OUTDOOR_SIGHTSEEING:
          scoreObj = OutdoorSightseeingEvaluator.evaluateDay(day);
          break;
        case ActivityType.SURFING:
          scoreObj = SurfingEvaluator.evaluateDay(day);
          break;
        case ActivityType.BEACH_DAY:
          scoreObj = BeachEvaluator.evaluateDay(day);
          break;
        default:
          scoreObj = OutdoorSightseeingEvaluator.evaluateDay(day);
          break;
      }

      const dayAlerts = alerts.filter((a) => a.date === day.date);
      if (dayAlerts.length > 0) {
        scoreObj.alerts = dayAlerts;
      }

      return scoreObj;
    });

    const totalScoreSum = dailyScores.reduce((acc, curr) => acc + curr.score, 0);
    const overallScore =
      dailyScores.length > 0 ? Math.round(totalScoreSum / dailyScores.length) : 0;

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
      ...(alerts.length > 0 ? { alerts } : {}),
    };
  };
}
