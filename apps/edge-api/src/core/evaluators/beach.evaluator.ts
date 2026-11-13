import {
  DailyWeatherData,
  DailyScore,
  BeachProfileType,
  WaveSafetyCondition,
} from '@windrose/shared-types';

export interface BeachDailyScore extends DailyScore {
  waveConditions: WaveSafetyCondition;
}

/**
 * Deterministic evaluator for Beach and Coastal suitability based on weather and marine data ($0.00).
 */
export class BeachEvaluator {
  /**
   * Evaluate a single day's weather and marine conditions for beach activities.
   *
   * @param day Daily weather and ocean forecast metrics.
   * @param profile Optional coastal morphological profile.
   * @returns DailyScore with embedded WaveSafetyCondition.
   */
  static evaluateDay = (
    day: DailyWeatherData,
    profile?: BeachProfileType
  ): BeachDailyScore => {
    let score = 0;
    const reasons: string[] = [];

    const temp = day.temperatureMax;
    const rain = day.precipitationSum;
    const wind = day.maxWindSpeed ?? 0;
    const code = day.weatherCode;
    const waveHeight = day.waveHeightMax ?? 0;
    const wavePeriod = day.wavePeriodMax ?? 0;

    // 1. Temperature evaluation (Max 35 pts)
    if (temp >= 24 && temp <= 32) {
      score += 35;
      reasons.push(`Temperatura ideal para praia (${temp}°C)`);
    } else if (temp > 32) {
      score += 30;
      reasons.push(`Temperatura quente para praia (${temp}°C)`);
    } else if (temp >= 20 && temp < 24) {
      score += 20;
      reasons.push(`Temperatura amena (${temp}°C)`);
    } else {
      score += 5;
      reasons.push(`Temperatura fria para praia (${temp}°C)`);
    }

    // 2. Precipitation evaluation (Max 35 pts)
    if (rain === 0) {
      score += 35;
      reasons.push('Sem previsão de chuva');
    } else if (rain <= 1.0) {
      score += 20;
      reasons.push(`Possibilidade de chuvisco leve (${rain}mm)`);
    } else if (rain <= 4.0) {
      score += 10;
      reasons.push(`Chuva leve prevista (${rain}mm)`);
    } else {
      score += 0;
      reasons.push(`Chuva significativa prevista (${rain}mm)`);
    }

    // 3. Weather code evaluation (Max 15 pts)
    if (code === 0 || code === 1) {
      score += 15;
      reasons.push('Céu ensolarado e limpo');
    } else if (code === 2 || code === 3) {
      score += 10;
      reasons.push('Parcialmente nublado');
    } else {
      score += 2;
      reasons.push('Condições de tempo instável');
    }

    // 4. Wind speed evaluation (Max 15 pts)
    if (wind <= 20) {
      score += 15;
      reasons.push(`Brisa costeira suave (${wind} km/h)`);
    } else if (wind <= 35) {
      score += 8;
      reasons.push(`Vento costeiro moderado (${wind} km/h)`);
    } else {
      score += 0;
      reasons.push(`Vento forte na costa com rajadas (${wind} km/h)`);
      // Penalize excessive wind (> 35 km/h disturbs beach umbrellas and sand)
      score -= Math.min(15, Math.round((wind - 35) * 1.5));
    }

    // 5. Marine Safety Evaluation & Wave Conditions
    let safeForSwimming = true;
    let safetyWarning: string | undefined = undefined;

    if (profile === BeachProfileType.DEEP_DROP_OFF && waveHeight > 1.2) {
      safeForSwimming = false;
      safetyWarning = `Atenção: praia de tombo com arrebentação perigosa próxima à areia (ondas de ${waveHeight.toFixed(1)}m)`;
      reasons.push(safetyWarning);
    } else if (waveHeight > 2.0) {
      safeForSwimming = false;
      safetyWarning = `Alerta: mar revolto e arrebentação perigosa com ondas de ${waveHeight.toFixed(1)}m`;
      reasons.push(safetyWarning);
    } else if (profile === BeachProfileType.CALM_WATERS && waveHeight > 1.4) {
      safeForSwimming = false;
      safetyWarning = `Atenção: ondas elevadas para praia de águas calmas (${waveHeight.toFixed(1)}m)`;
      reasons.push(safetyWarning);
    } else if (waveHeight > 0) {
      reasons.push(`Mar calmo e seguro para banho (${waveHeight.toFixed(1)}m)`);
    }

    // If severe safety hazard or heavy rain/cold, adjust scores
    if (!safeForSwimming && waveHeight > 2.0) {
      score = Math.min(score, 35);
    }

    if (rain >= 10 || (temp < 20 && rain > 2)) {
      score = Math.min(score, 20);
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(score)));

    let recommendationLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' = 'POOR';
    if (!safeForSwimming && waveHeight > 2.0) {
      recommendationLevel = 'POOR';
    } else if (finalScore >= 80) {
      recommendationLevel = 'EXCELLENT';
    } else if (finalScore >= 60) {
      recommendationLevel = 'GOOD';
    } else if (finalScore >= 40) {
      recommendationLevel = 'FAIR';
    }

    return {
      date: day.date,
      score: finalScore,
      recommendationLevel,
      reasons,
      waveConditions: {
        heightMeters: waveHeight,
        periodSeconds: wavePeriod,
        safeForSwimming,
        safetyWarning,
      },
    };
  };
}
