import React from 'react';
import {
  AlertTriangle,
  CloudRain,
  Wind,
  Zap,
  Info,
} from 'lucide-react';
import { WeatherAlert, WeatherAlertType } from '@windrose/shared-types';

export interface WeatherAlertBannerProps {
  alerts?: WeatherAlert[];
  className?: string;
  compact?: boolean;
}

const getAlertIcon = (type: WeatherAlertType): React.ReactElement => {
  switch (type) {
    case 'TEMPERATURE_DROP':
    case 'TEMPERATURE_SPIKE':
      return <AlertTriangle size={18} aria-hidden="true" />;
    case 'RAIN_SURGE':
      return <CloudRain size={18} aria-hidden="true" />;
    case 'WIND_GUST':
      return <Wind size={18} aria-hidden="true" />;
    case 'STORM':
      return <Zap size={18} aria-hidden="true" />;
    default:
      return <Info size={18} aria-hidden="true" />;
  }
};

const formatAlertDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const formatted = d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return dateStr;
  }
};

export const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({
  alerts,
  className = '',
  compact = false,
}) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <section
      role="region"
      aria-label="Avisos meteorológicos"
      className={`weather-alert-banner ${compact ? 'compact' : ''} ${className}`}
      data-testid="weather-alert-banner"
    >
      <div className="weather-alert-banner-header">
        <div className="weather-alert-banner-title-group">
          <span className="weather-alert-icon-wrapper" aria-hidden="true">
            <AlertTriangle size={20} className="weather-alert-main-icon" />
          </span>
          <div className="weather-alert-banner-title-text">
            <h4 className="weather-alert-banner-heading">
              Avisos de Mudança Brusca no Clima
            </h4>
            <span className="weather-alert-banner-subheading">
              {alerts.length === 1
                ? '1 variação meteorológica importante detectada para sua viagem'
                : `${alerts.length} variações meteorológicas importantes detectadas`}
            </span>
          </div>
        </div>
      </div>

      <div className="weather-alert-cards-list">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const severityLabel = isCritical ? 'Crítico' : 'Atenção';

          return (
            <article
              key={alert.id}
              className={`weather-alert-item ${isCritical ? 'critical' : 'warning'}`}
            >
              <div className="weather-alert-item-header">
                <span className="weather-alert-item-type">
                  {getAlertIcon(alert.type)}
                  <span className="weather-alert-item-title">{alert.title}</span>
                </span>
                <div className="weather-alert-item-meta">
                  <span
                    className={`weather-alert-severity-tag ${isCritical ? 'critical' : 'warning'}`}
                  >
                    {severityLabel}
                  </span>
                  <span className="weather-alert-item-date">
                    {formatAlertDate(alert.date)}
                  </span>
                </div>
              </div>

              <p className="weather-alert-item-desc">{alert.description}</p>

              {alert.recommendation && (
                <div className="weather-alert-item-recommendation">
                  <span className="recommendation-lead">Recomendação:</span>{' '}
                  {alert.recommendation}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
