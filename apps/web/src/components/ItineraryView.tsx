import React from 'react';
import { TripItinerary } from '@windrose/shared-types';
import { CalendarExporter } from '../services/calendar.exporter';
import { InteractiveMap } from './InteractiveMap';
import { formatCategory, formatRecommendation } from '../utils/labels';

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

  // Collect all unique scheduled places for map display
  const allScheduledPlaces = itinerary.days.flatMap((d) => d.slots.map((s) => s.place));

  if (!itinerary.days || itinerary.days.length === 0) {
    return (
      <div className="empty-deck-card">
        <div className="empty-deck-icon">🗺️</div>
        <h3>Nenhum roteiro gerado ainda</h3>
        <p>
          Você ainda não deu Match em nenhum lugar. Vá para a aba <strong>Descoberta</strong> e
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
    <div className="itinerary-container">
      {/* Editorial Magazine Style Cover */}
      <section className="itinerary-magazine-cover">
        <div className="itinerary-cover-badge">Guia de Viagem Exclusivo</div>
        <h1 className="itinerary-cover-title">Roteiro em {itinerary.city}</h1>
        <p className="itinerary-cover-subtitle">
          {itinerary.totalPlacesScheduled} locais imperdíveis distribuídos estrategicamente em{' '}
          {itinerary.days.length} dias conforme a previsão do tempo.
        </p>

        <div className="itinerary-meta-bar">
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
            <div>
              <strong>Destino:</strong> {itinerary.city}
            </div>
            <div>
              <strong>Duração:</strong> {itinerary.days.length} Dias
            </div>
          </div>

          <div className="itinerary-actions-row no-print">
            <button
              type="button"
              className="action-button-primary"
              onClick={handlePrintPdf}
              title="Salvar como PDF ou Imprimir"
            >
              📄 Baixar PDF Editorial
            </button>
            <button
              type="button"
              className="action-button-secondary"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}
              onClick={handleDownloadIcs}
              title="Adicionar horários à sua agenda do celular"
            >
              📅 Exportar Calendário (.ICS)
            </button>
          </div>
        </div>
      </section>

      {/* Map of Itinerary Route */}
      {allScheduledPlaces.length > 0 && (
        <section className="itinerary-map-section no-print" style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            🗺️ Mapa Geral do Roteiro
          </h3>
          <InteractiveMap places={allScheduledPlaces} height="380px" />
        </section>
      )}

      {/* Days Timeline */}
      <div className="itinerary-timeline">
        {itinerary.days.map((day, dayIndex) => (
          <article key={day.date} className="itinerary-day-card">
            <div className="itinerary-day-header">
              <div className="day-title-group">
                <h3>
                  Dia {dayIndex + 1} • {day.weekday}
                </h3>
                <p>{new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`suitability-badge ${day.recommendationLevel}`}>
                  Clima: {formatRecommendation(day.recommendationLevel)} ({day.weatherScore}/100)
                </span>
                {day.isRainyOrAdverse && (
                  <span style={{ fontSize: '0.8rem', background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>
                    🌧️ Otimizado para Chuva
                  </span>
                )}
              </div>
            </div>

            <div className="day-period-timeline">
              {day.slots.map((slot) => {
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  slot.place.name + ' ' + slot.place.city
                )}`;

                return (
                  <div key={slot.slot} className="period-block">
                    <div className="period-indicator">
                      <span className="period-badge">{slot.slotLabel}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>

                    <div className="period-poi-card">
                      {slot.place.imageUrl && (
                        <img
                          src={slot.place.imageUrl}
                          alt={slot.place.name}
                          className="period-poi-thumb"
                          loading="lazy"
                        />
                      )}
                      <div className="period-poi-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 className="period-poi-title">{slot.place.name}</h4>
                          <span className="category-tag" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                            {formatCategory(slot.place.category)}
                          </span>
                        </div>

                        {slot.place.address && (
                          <p className="period-poi-address">
                            <span>📍</span> {slot.place.address}
                          </p>
                        )}

                        <p className="period-poi-desc">{slot.place.description}</p>

                        {slot.weatherOptimizationNote && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--primary-text)', background: 'var(--primary-subtle)', padding: '0.3rem 0.6rem', borderRadius: '6px', display: 'inline-block' }}>
                            {slot.weatherOptimizationNote}
                          </div>
                        )}

                        <div className="no-print" style={{ marginTop: '0.75rem' }}>
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--primary)',
                              textDecoration: 'none',
                              fontWeight: 600,
                            }}
                          >
                            Abrir no Mapa ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
