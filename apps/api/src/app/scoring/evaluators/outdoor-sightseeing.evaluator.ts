import { DailyWeatherData, DailyScore } from '@windrose/shared-types';

/**
 * Evaluates weather suitability for Outdoor Sightseeing.
 */
export class OutdoorSightseeingEvaluator {
  /**
   * Evaluate a single day's weather for outdoor sightseeing.
   *
   * @param day Daily weather data entry.
   * @returns Score (0-100), recommendation level, and English reasons.
   */
  static evaluateDay(day: DailyWeatherData): DailyScore {
    let score = 0;
    const reasons: string[] = [];

    // 1. Temperature evaluation (Max 35 pts)
    const temp = day.temperatureMax;
    if (temp >= 18 && temp <= 26) {
      score += 35;
      reasons.push(`Ideal temperature for outdoor sightseeing (${temp}°C)`);
    } else if ((temp >= 14 && temp < 18) || (temp > 26 && temp <= 30)) {
      score += 25;
      reasons.push(`Comfortable temperature (${temp}°C)`);
    } else if (temp < 10) {
      score += 5;
      reasons.push(`Chilly temperature (${temp}°C)`);
    } else if (temp > 32) {
      score += 5;
      reasons.push(`Hot temperature (${temp}°C)`);
    } else {
      score += 15;
      reasons.push(`Moderate temperature (${temp}°C)`);
    }

    // 2. Precipitation evaluation (Max 35 pts)
    const rain = day.precipitationSum;
    if (rain === 0) {
      score += 35;
      reasons.push('No rain expected');
    } else if (rain <= 1.5) {
      score += 20;
      reasons.push(`Light drizzle expected (${rain}mm)`);
    } else if (rain <= 5.0) {
      score += 10;
      reasons.push(`Light rain expected (${rain}mm)`);
    } else {
      score += 0;
      reasons.push(`Significant rainfall expected (${rain}mm)`);
    }

    // 3. Weather code evaluation (Max 20 pts)
    const code = day.weatherCode;
    if (code === 0 || code === 1) {
      score += 20;
      reasons.push('Clear sunny skies');
    } else if (code === 2 || code === 3) {
      score += 15;
      reasons.push('Partly cloudy');
    } else if (code === 45 || code === 48) {
      score += 10;
      reasons.push('Foggy weather');
    } else {
      score += 2;
      reasons.push('Adverse weather condition');
    }

    // 4. Wind speed evaluation (Max 10 pts)
    const wind = day.maxWindSpeed ?? 0;
    if (wind <= 20) {
      score += 10;
      reasons.push(`Gentle breeze (${wind} km/h)`);
    } else if (wind <= 35) {
      score += 5;
      reasons.push(`Moderate wind (${wind} km/h)`);
    } else {
      score += 0;
      reasons.push(`Strong wind gusts (${wind} km/h)`);
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
