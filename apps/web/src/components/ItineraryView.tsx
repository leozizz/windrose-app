import React from 'react';
import { TripItinerary } from '@windrose/shared-types';
import { CalendarExporter } from '../services/calendar.exporter';

interface ItineraryViewProps {
  itinerary: TripItinerary;
  onBackToSwipe: () => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  itinerary,
  onBackToSwipe,
}) => {
  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadIcs = () => {
    CalendarExporter.downloadIcsFile(itinerary);
  };

  if (!itinerary.days || itinerary.days.length === 0) {
    return (
      <div className="empty-itinerary-card">
        <div className="empty-itinerary-icon">🗺️</div>
        <h3 className="empty-itinerary-title">Nenhum roteiro gerado ainda</h3>
        <p className="empty-itinerary-text">
          Você ainda não deu Match em nenhum lugar. Vá para a aba <strong>Explorar Lugares</strong> e
          curta os pontos turísticos e restaurantes para gerarmos um roteiro inteligente adaptado ao clima!
        </p>
        <button
          type="button"
          className="action-button-primary"
          onClick={onBackToSwipe}
        >
          Explorar Lugares no Swipe →
        </button>
      </div>
    );
  }

  return (
    <div className="itinerary-wrapper">
      {/* Header and Action Toolbar */}
      <div className="itinerary-header">
        <div>
          <span className="itinerary-badge">Roteiro Otimizado por Clima</span>
          <h2 className="itinerary-title">Sua Viagem em {itinerary.city}</h2>
          <p className="itinerary-subtitle">
            {itinerary.totalPlacesScheduled} locais organizados em {itinerary.days.length} dias
            conforme a previsão meteorológica.
          </p>
        </div>

        <div className="itinerary-export-bar">
          <button
            type="button"
            className="export-btn btn-calendar"
            onClick={handleDownloadIcs}
            title="Baixar arquivo .ics para Apple Calendar, Google Calendar e Outlook"
          >
            📅 Baixar Calendário (.ics)
          </button>

          <button
            type="button"
            className="export-btn btn-pdf"
            onClick={handlePrintPdf}
            title="Imprimir ou Salvar como PDF customizado"
          >
            📄 Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Days Timeline */}
      <div className="itinerary-days-timeline">
        {itinerary.days.map((day, dayIndex) => (
          <section key={day.date} className="itinerary-day-section">
            <div className="day-meta-header">
              <div className="day-title-group">
                <span className="day-counter">Dia {dayIndex + 1}</span>
                <h3 className="day-heading">
                  {day.weekday}, {formatDisplayDate(day.date)}
                </h3>
              </div>

              <div className="day-weather-status">
                <span
                  className={`recommendation-tag ${
                    day.weatherScore >= 80
                      ? 'tag-excellent'
                      : day.weatherScore >= 60
                      ? 'tag-good'
                      : day.weatherScore >= 40
                      ? 'tag-fair'
                      : 'tag-poor'
                  }`}
                >
                  Clima: {day.weatherScore}/100 ({day.recommendationLevel})
                </span>
                {day.isRainyOrAdverse && (
                  <span className="weather-alert-tag">
                    🌧️ Otimizado para chuva/vento
                  </span>
                )}
              </div>
            </div>

            {/* Slots Cards */}
            <div className="slots-grid">
              {day.slots.map((slot) => {
                const googleCalUrl = CalendarExporter.getGoogleCalendarUrl(
                  slot,
                  day.date,
                  itinerary.city
                );

                return (
                  <div key={slot.place.id} className="itinerary-slot-card">
                    <div className="slot-badge-column">
                      <span className="slot-period-tag">{slot.slotLabel}</span>
                      <span className="slot-time">
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>

                    <div className="slot-image-container">
                      <img
                        src={slot.place.imageUrl}
                        alt={slot.place.name}
                        className="slot-cover-image"
                        loading="lazy"
                      />
                      <span className="slot-category-chip">{slot.place.category}</span>
                    </div>

                    <div className="slot-details">
                      <h4 className="slot-place-name">{slot.place.name}</h4>
                      <p className="slot-place-desc">{slot.place.description}</p>

                      {slot.weatherOptimizationNote && (
                        <div className="slot-optimization-note">
                          <span>{slot.weatherOptimizationNote}</span>
                        </div>
                      )}

                      <div className="slot-footer-actions">
                        {slot.place.tags && (
                          <div className="slot-tags">
                            {slot.place.tags.slice(0, 2).map((t) => (
                              <span key={t} className="card-tag">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                        <a
                          href={googleCalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-add-gcal"
                          title="Adicionar este horário ao Google Calendar"
                        >
                          + Google Calendar
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
