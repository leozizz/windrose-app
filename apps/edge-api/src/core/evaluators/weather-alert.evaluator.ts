import {
  DailyWeatherData,
  WeatherAlert,
  WeatherAlertType,
  WeatherAlertSeverity,
} from '@windrose/shared-types';

/**
 * Pure domain evaluator for abrupt weather changes and severe meteorological conditions ($0.00).
 */
export class WeatherAlertEvaluator {
  /**
   * Evaluates sequential daily forecast metrics to detect abrupt temperature drops,
   * rain surges, severe storms, or intense wind gusts.
   */
  static evaluateAlerts = (daily: DailyWeatherData[]): WeatherAlert[] => {
    if (!daily || daily.length === 0) {
      return [];
    }

    const alerts: WeatherAlert[] = [];

    // 1. Single-day severe conditions (STORM, WIND_GUST)
    daily.forEach((currentDay) => {
      // STORM: WMO code 95 (Thunderstorm), 96 (Thunderstorm with slight hail), 99 (Thunderstorm with heavy hail)
      // or heavy precipitation >= 25mm
      const isSevereStormCode = [95, 96, 99].includes(currentDay.weatherCode);
      const isTorrentialRain = currentDay.precipitationSum >= 25;

      if (isSevereStormCode || isTorrentialRain) {
        alerts.push({
          id: `alert-storm-${currentDay.date}`,
          type: 'STORM',
          severity: 'CRITICAL',
          title: 'Alerta de Tempestade e Chuva Severa',
          description: isTorrentialRain
            ? `Precipitação volumosa de ${currentDay.precipitationSum}mm prevista.`
            : 'Condições favoráveis a tempestades elétricas e instabilidade intensa.',
          date: currentDay.date,
          recommendation:
            'Evite praias, trilhas e atividades em mar aberto; prefira atrações culturais e ambientes protegidos.',
        });
      }

      // WIND_GUST: max wind speed >= 50 km/h
      const windSpeed = currentDay.maxWindSpeed ?? 0;
      if (windSpeed >= 50) {
        alerts.push({
          id: `alert-wind-${currentDay.date}`,
          type: 'WIND_GUST',
          severity: 'WARNING',
          title: 'Alerta de Vento Forte e Rajadas Intensas',
          description: `Rajadas de vento de até ${windSpeed} km/h previstas.`,
          date: currentDay.date,
          recommendation:
            'Atenção redobrada em mirantes e passeios de barco; condições desfavoráveis para guarda-sol na praia.',
        });
      }
    });

    // 2. Day-to-day transition variations (TEMPERATURE_DROP, TEMPERATURE_SPIKE, RAIN_SURGE)
    for (let i = 1; i < daily.length; i++) {
      const prevDay = daily[i - 1];
      const currentDay = daily[i];

      // A. Queda brusca de temperatura (>= 8°C de queda na máxima)
      const tempDrop = Math.round(prevDay.temperatureMax - currentDay.temperatureMax);
      if (tempDrop >= 8) {
        const severity: WeatherAlertSeverity = tempDrop >= 12 ? 'CRITICAL' : 'WARNING';
        alerts.push({
          id: `alert-temp-drop-${currentDay.date}`,
          type: 'TEMPERATURE_DROP',
          severity,
          title: 'Queda Brusca de Temperatura (Frente Fria)',
          description: `Queda brusca de ${tempDrop}°C prevista entre ${prevDay.date} e ${currentDay.date}.`,
          date: currentDay.date,
          previousDate: prevDay.date,
          metricDelta: {
            from: prevDay.temperatureMax,
            to: currentDay.temperatureMax,
            unit: '°C',
          },
          recommendation:
            'Leve agasalhos adequados na bagagem e considere reorganizar passeios ao ar livre para dias mais amenos.',
        });
      }

      // B. Pico repentino de temperatura (>= 8°C de aumento na máxima)
      const tempSpike = Math.round(currentDay.temperatureMax - prevDay.temperatureMax);
      if (tempSpike >= 8) {
        const severity: WeatherAlertSeverity = tempSpike >= 12 ? 'CRITICAL' : 'WARNING';
        alerts.push({
          id: `alert-temp-spike-${currentDay.date}`,
          type: 'TEMPERATURE_SPIKE',
          severity,
          title: 'Pico Repentino de Temperatura (Onda de Calor)',
          description: `Aumento expressivo de ${tempSpike}°C previsto entre ${prevDay.date} e ${currentDay.date}.`,
          date: currentDay.date,
          previousDate: prevDay.date,
          metricDelta: {
            from: prevDay.temperatureMax,
            to: currentDay.temperatureMax,
            unit: '°C',
          },
          recommendation:
            'Mantenha-se hidratado, utilize protetor solar e evite atividades extenuantes sob sol forte.',
        });
      }

      // C. Virada repentina para chuva (salto de probabilidade <= 20% para >= 80%)
      const prevProb = prevDay.precipitationProbabilityMax ?? 0;
      const currentProb = currentDay.precipitationProbabilityMax ?? 0;
      if (prevProb <= 20 && currentProb >= 80) {
        alerts.push({
          id: `alert-rain-surge-${currentDay.date}`,
          type: 'RAIN_SURGE',
          severity: 'WARNING',
          title: 'Virada Repentina para Chuva',
          description: `Probabilidade de precipitação salta de ${prevProb}% para ${currentProb}% em 24h.`,
          date: currentDay.date,
          previousDate: prevDay.date,
          metricDelta: {
            from: prevProb,
            to: currentProb,
            unit: '%',
          },
          recommendation:
            'Tenha guarda-chuva ou capa de chuva sempre à mão e planeje visitas a museus ou centros gastronômicos.',
        });
      }
    }

    return alerts;
  };
}
