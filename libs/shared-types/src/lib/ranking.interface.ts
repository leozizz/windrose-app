import { ActivityType } from './activity.enum';

/**
 * Score breakdown for a specific date and activity.
 */
export interface DailyScore {
  date: string;
  score: number; // 0 - 100
  recommendationLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  reasons: string[];
}

/**
 * Overall 7-day activity score for a requested location.
 */
export interface ActivityRankingResult {
  locationName: string;
  latitude: number;
  longitude: number;
  activity: ActivityType;
  overallScore: number; // 0 - 100
  recommendationLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  dailyScores: DailyScore[];
}
