import React, { useState } from 'react';
import {
  Sunrise,
  Sun,
  Moon,
  MapPin,
  Calendar,
  FileDown,
  ExternalLink,
  Map,
  CloudRain,
  Sparkles,
  Lightbulb,
  Footprints,
  Car,
  Share2,
  Check,
} from 'lucide-react';
import {
  TripItinerary,
  PoiSlot,
  ActivityType,
  PointOfInterest,
} from '@windrose/shared-types';
import { CalendarExporter } from '../services/calendar.exporter';
import { buildShareableTripUrl } from '../services/trip-serializer.service';
import { InteractiveMap } from './InteractiveMap';
import { QrCodeSvg } from './QrCodeSvg';
import { WeatherAlertBanner } from './WeatherAlertBanner';
import { formatCategory, formatRecommendation } from '../utils/labels';

interface ItineraryViewProps {
  itinerary: TripItinerary;
  onBackToSwipe: () => void;
  activity?: ActivityType;
  likedPlaces?: PointOfInterest[];
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  itinerary,
  onBackToSwipe,
  activity,
  likedPlaces,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadIcs = () => {
    CalendarExporter.downloadIcsFile(itinerary);
  };

  // Collect all unique scheduled places for map display and fallback sharing
  const allScheduledPlaces = itinerary.days.flatMap((d) => d.slots.map((s) => s.place));
  const placesForShare = likedPlaces && likedPlaces.length > 0 ? likedPlaces : allScheduledPlaces;

  const shareTripUrl = buildShareableTripUrl(
    itinerary.city,
    activity ?? ActivityType.OUTDOOR_SIGHTSEEING,
    placesForShare
  );

  const handleShareTrip = async () => {
    let success = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareTripUrl);
        success = true;
      }
    } catch {
      // Falha permissiva: prossegue para fallback
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareTripUrl;
        textArea.setAttribute('readonly', '');
        textArea.className = 'sr-only-clipboard';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        // Fallback defensivo silencioso
      }
    }

    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  if (!itinerary.days || itinerary.days.length === 0) {
    return (
      <div className="empty-deck-card">
        <div className="empty-deck-icon">
          <Map size={44} />
        </div>
        <h3>Nenhum roteiro gerado ainda</h3>
        <p>
          Você ainda não deu Match em nenhum lugar. Vá para a aba <strong>Descoberta</strong> e
          curta os pontos turísticos e restaurantes para gerarmos um roteiro inteligente adaptado ao clima!
        </p>
        <button
          type="button"
          className="action-button-primary"
          onClick={onBackToSwipe}
          data-testid="itinerary-empty-explore-btn"
        >
          Explorar Lugares no Swipe →
        </button>
      </div>
    );
  }

  const getSlotIcon = (slotType: string) => {
    switch (slotType.toUpperCase()) {
      case 'MORNING':
        return <Sunrise size={18} />;
      case 'AFTERNOON':
        return <Sun size={18} />;
      case 'EVENING':
      case 'NIGHT':
        return <Moon size={18} />;
      default:
        return <MapPin size={18} />;
    }
  };

  const firstDate = itinerary.days[0]?.date;
  const lastDate = itinerary.days[itinerary.days.length - 1]?.date;
  const formattedDateRange = firstDate && lastDate
    ? firstDate === lastDate
      ? new Date(firstDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
      : `${new Date(firstDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} — ${new Date(lastDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : '';

  const mapsQueryUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Roteiro ' + itinerary.city)}`;

  return (
    <div className="itinerary-container">
      {/* Magazine Style Header Cover */}
      <section className="itinerary-magazine-cover">
        <div className="itinerary-cover-top">
          <span className="itinerary-cover-badge">Guia de Viagem Personalizado</span>
          <span className="itinerary-cover-edition">Roteiro Inteligente</span>
        </div>

        <h1 className="itinerary-cover-title">Roteiro em {itinerary.city}</h1>

        <p className="itinerary-cover-subtitle">
          {itinerary.totalPlacesScheduled} locais imperdíveis distribuídos estrategicamente em{' '}
          {itinerary.days.length} {itinerary.days.length === 1 ? 'dia' : 'dias'}, combinados harmoniosamente com as previsões climáticas em tempo real.
        </p>

        <div className="itinerary-meta-bar">
          <div className="itinerary-meta-details">
            <div className="meta-pill">
              <span className="meta-label">Destino</span>
              <strong className="meta-value">{itinerary.city}</strong>
            </div>
            <div className="meta-pill">
              <span className="meta-label">Duração</span>
              <strong className="meta-value">{itinerary.days.length} {itinerary.days.length === 1 ? 'Dia' : 'Dias'}</strong>
            </div>
            {formattedDateRange && (
              <div className="meta-pill">
                <span className="meta-label">Período</span>
                <strong className="meta-value">{formattedDateRange}</strong>
              </div>
            )}
          </div>

          <div className="itinerary-actions-row no-print">
            <button
              type="button"
              className={`action-button-secondary btn-share ${copied ? 'is-copied' : ''}`}
              onClick={handleShareTrip}
              title="Copiar link estático para compartilhar este roteiro com amigos"
              data-testid={copied ? 'itinerary-share-btn-copied' : 'itinerary-share-btn'}
              aria-live="polite"
            >
              {copied ? (
                <>
                  <Check size={17} className="btn-icon-start" />
                  <span>Link Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 size={17} className="btn-icon-start" />
                  <span>Compartilhar Roteiro</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="action-button-primary btn-print"
              onClick={handlePrintPdf}
              title="Salvar como PDF ou Imprimir este roteiro"
              data-testid="itinerary-print-pdf-btn"
            >
              <FileDown size={17} className="btn-icon-start" />
              <span>Baixar PDF do Roteiro</span>
            </button>
            <button
              type="button"
              className="action-button-secondary btn-calendar"
              onClick={handleDownloadIcs}
              title="Adicionar horários e paradas à sua agenda do celular"
              data-testid="itinerary-export-ics-btn"
            >
              <Calendar size={17} className="btn-icon-start" />
              <span>Exportar Calendário (.ICS)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Weather Abrupt Change Alert Banner */}
      {itinerary.alerts && itinerary.alerts.length > 0 && (
        <WeatherAlertBanner alerts={itinerary.alerts} className="itinerary-weather-alert-banner" />
      )}

      {/* QR Code Companion Card (Both Screen & Print Friendly) */}
      <section className="itinerary-companion-card">
        <div className="companion-qr-wrapper">
          <QrCodeSvg
            value={shareTripUrl}
            ariaLabel={`QR Code para roteiro em ${itinerary.city}`}
            dataTestId="itinerary-companion-qr-svg"
            className="companion-qr-svg"
          />
        </div>
        <div className="companion-text-content">
          <span className="companion-tag">Navegação Móvel Instantânea</span>
          <h3 className="companion-title">Leve seu guia de viagem no bolso</h3>
          <p className="companion-desc">
            Aponte a câmera do seu smartphone para o QR Code para abrir este roteiro compartilhado e adaptado ao clima diretamente no seu celular.
          </p>
          <div className="companion-links-row no-print">
            <a
              href={shareTripUrl}
              className="companion-link companion-link-share"
              data-testid="itinerary-companion-share-link"
            >
              <span>Abrir Roteiro Compartilhado</span>
              <ExternalLink size={13} className="btn-icon-end" />
            </a>
            <a
              href={mapsQueryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="companion-link companion-link-maps"
              data-testid="itinerary-companion-maps-link"
            >
              <span>Ver no Google Maps</span>
              <ExternalLink size={13} className="btn-icon-end" />
            </a>
          </div>
        </div>
      </section>

      {/* Map of Itinerary Route (Interactive on Web, hidden on Print) */}
      {allScheduledPlaces.length > 0 && (
        <section className="itinerary-map-section no-print">
          <div className="section-header-flex">
            <div>
              <h3 className="itinerary-section-heading itinerary-map-title-icon">
                <Map size={20} />
                <span>Mapa Geral do Roteiro</span>
              </h3>
              <p className="itinerary-section-subheading">
                Visualize a distribuição geográfica de todas as suas paradas programadas.
              </p>
            </div>
            <span className="places-count-pill">{allScheduledPlaces.length} Paradas</span>
          </div>
          <InteractiveMap places={allScheduledPlaces} height="380px" />
        </section>
      )}

      {/* Days Timeline */}
      <div className="itinerary-timeline">
        {itinerary.days.map((day, dayIndex) => (
          <article key={day.date} className="itinerary-day-card">
            <header className="itinerary-day-header">
              <div className="day-title-group">
                <span className="day-number-label">DIA {dayIndex + 1}</span>
                <h3 className="day-name-heading">
                  {day.weekday}
                </h3>
                <p className="day-date-subheading">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="day-weather-badges">
                <span className={`suitability-badge ${day.recommendationLevel}`}>
                  Clima: {formatRecommendation(day.recommendationLevel)} ({day.weatherScore}/100)
                </span>
                {day.isRainyOrAdverse ? (
                  <span className="adverse-weather-badge">
                    <CloudRain size={13} className="weather-badge-icon" />
                    <span>Otimizado para Chuva</span>
                  </span>
                ) : (
                  <span className="ideal-weather-badge">
                    <Sun size={13} className="weather-badge-icon" />
                    <span>Ideal ao Ar Livre</span>
                  </span>
                )}
              </div>
            </header>

            <div className="day-period-timeline">
              {day.slots.map((slot: PoiSlot) => {
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  slot.place.name + ' ' + (slot.place.address || slot.place.city)
                )}`;

                return (
                  <div key={slot.slot} className="period-slot-wrapper">
                    {slot.transitFromPrevious && (
                      <div
                        className="period-transit-estimate"
                        data-testid="itinerary-transit-estimate"
                        aria-label={`Deslocamento a partir da parada anterior: ${slot.transitFromPrevious.formattedSummary}`}
                      >
                        <div className="transit-estimate-pill">
                          <Footprints size={13} className="transit-icon" aria-hidden="true" />
                          <Car size={13} className="transit-icon" aria-hidden="true" />
                          <span className="transit-label">
                            {slot.transitFromPrevious.formattedSummary}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="period-block">
                      <div className="period-indicator">
                        <div className="period-icon-circle">
                          {getSlotIcon(slot.slot)}
                        </div>
                        <span className="period-badge">{slot.slotLabel}</span>
                        <span className="period-time-range">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>

                      <div className="period-poi-card">
                        {slot.place.imageUrl ? (
                          <img
                            src={slot.place.imageUrl}
                            alt={slot.place.name}
                            className="period-poi-thumb"
                            loading="lazy"
                          />
                        ) : (
                          <div className="period-poi-thumb-placeholder">
                            {getSlotIcon(slot.slot)}
                          </div>
                        )}

                        <div className="period-poi-content">
                          <div className="period-poi-header">
                            <h4 className="period-poi-title">{slot.place.name}</h4>
                            <span className="category-tag">
                              {formatCategory(slot.place.category)}
                            </span>
                          </div>

                          {slot.place.address && (
                            <p className="period-poi-address">
                              <MapPin size={13} className="address-pin-icon" />
                              <span>{slot.place.address}</span>
                            </p>
                          )}

                          <p className="period-poi-desc">{slot.place.description}</p>

                          {slot.weatherOptimizationNote && (
                            <div className="period-poi-weather-note">
                              <Sparkles size={13} className="note-icon" />
                              <span>{slot.weatherOptimizationNote}</span>
                            </div>
                          )}

                          <div className="period-poi-actions no-print">
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-open-maps"
                              data-testid="period-poi-maps-link"
                            >
                              <span>Abrir no Google Maps</span>
                              <ExternalLink size={12} className="btn-icon-end" />
                            </a>
                          </div>
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

      {/* Guide Footer */}
      <footer className="itinerary-editorial-footer">
        <div className="footer-tip-box">
          <Lightbulb size={22} className="footer-tip-icon" />
          <p>
            <strong>Dica do Guia Windrose:</strong> As condições meteorológicas e horários de visitação podem variar.
            Confira a abertura dos atrativos antes do embarque e aproveite sua estadia em {itinerary.city}!
          </p>
        </div>
        <div className="footer-brand-signature">
          <span>Windrose • Planejador Inteligente de Viagens e Clima</span>
        </div>
      </footer>
    </div>
  );
};
