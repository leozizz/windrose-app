import { DailyWeatherData, DailyScore } from '@windrose/shared-types';

/**
 * Evaluates weather and marine suitability for Surfing.
 */
export class SurfingEvaluator {
  /**
   * Evaluate a single day's surf conditions.
   *
   * @param day Daily weather and marine data entry.
   * @returns Score (0-100), recommendation level, and English reasons.
   */
  static evaluateDay(day: DailyWeatherData): DailyScore {
    let score = 0;
    const reasons: string[] = [];

    const waveHeight = day.waveHeightMax ?? 0;
    const wavePeriod = day.wavePeriodMax ?? 0;

    // Handle inland location / unavailable ocean data
    if (waveHeight === 0 && wavePeriod === 0) {
      return {
        date: day.date,
        score: 0,
        recommendationLevel: 'POOR',
        reasons: ['No ocean wave data available (inland location)'],
      };
    }

    // 1. Wave Height evaluation (Max 50 pts)
    if (waveHeight >= 1.0 && waveHeight <= 2.5) {
      score += 50;
      reasons.push(`Optimal wave height (${waveHeight.toFixed(1)}m)`);
    } else if (waveHeight >= 0.5 && waveHeight < 1.0) {
      score += 30;
      reasons.push(`Small surfable waves (${waveHeight.toFixed(1)}m)`);
    } else if (waveHeight > 2.5 && waveHeight <= 4.0) {
      score += 25;
      reasons.push(`Heavy swell (${waveHeight.toFixed(1)}m)`);
    } else if (waveHeight > 4.0) {
      score += 10;
      reasons.push(`Rough storm waves (${waveHeight.toFixed(1)}m)`);
    } else {
      score += 0;
      reasons.push(`Flat ocean condition (${waveHeight.toFixed(1)}m)`);
    }

    // 2. Wave Period evaluation (Max 30 pts)
    if (wavePeriod >= 10) {
      score += 30;
      reasons.push(`Long groundswell period (${wavePeriod.toFixed(0)}s)`);
    } else if (wavePeriod >= 7) {
      score += 20;
      reasons.push(`Medium swell period (${wavePeriod.toFixed(0)}s)`);
    } else if (wavePeriod > 0) {
      score += 5;
      reasons.push(`Short windswell period (${wavePeriod.toFixed(0)}s)`);
    }

    // 3. Weather / Rain evaluation (Max 10 pts)
    const rain = day.precipitationSum;
    if (rain === 0) {
      score += 10;
      reasons.push('No rainfall expected');
    } else {
      score += 0;
      reasons.push(`Precipitation expected (${rain}mm)`);
    }

    // 4. Wind speed evaluation (Max 10 pts)
    const wind = day.maxWindSpeed ?? 0;
    if (wind <= 20) {
      score += 10;
      reasons.push(`Favorable light wind (${wind} km/h)`);
    } else {
      score += 2;
      reasons.push(`Strong onshore wind (${wind} km/h)`);
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(score)));

    let recommendationLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' = 'POOR';
    if (finalScore >= 80) recommendationLevel = 'EXCELLENT';
    else if (finalScore >= 60) recommendationLevel = 'GOOD';
    else if (finalScore >= 40) recommendationLevel = 'FAIR';

    return {
      date: day.date,
      score: finalScore,
      recommendationLevel,
      reasons,
    };
  }
}
