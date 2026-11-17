import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItineraryView } from './ItineraryView';
import { TripItinerary, PoiCategory, PoiEnvironment, WeatherAlert } from '@windrose/shared-types';
import { CalendarExporter } from '../services/calendar.exporter';

describe('ItineraryView Component', () => {
  const mockItinerary: TripItinerary = {
    city: 'Florianópolis',
    totalPlacesScheduled: 1,
    days: [
      {
        date: '2026-10-23',
        weekday: 'Sexta-feira',
        weatherScore: 90,
        recommendationLevel: 'EXCELLENT',
        isRainyOrAdverse: false,
        slots: [
          {
            slot: 'MORNING',
            slotLabel: 'Manhã',
            startTime: '09:30',
            endTime: '12:30',
            weatherOptimizationNote: 'Clima ideal para praia',
            place: {
              id: 'poi-1',
              name: 'Praia da Joaquina',
              category: PoiCategory.BEACH,
              environment: PoiEnvironment.OUTDOOR,
              latitude: -27.62,
              longitude: -48.44,
              city: 'Florianópolis',
              description: 'Dunas e surf',
              imageUrl: 'https://example.com/beach.jpg',
              tags: ['Praia'],
              address: 'Avenida das Rendeiras, Lagoa da Conceição',
            },
          },
        ],
      },
    ],
  };

  it('deve renderizar os dias, horários e locais agendados', () => {
    render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

    expect(screen.getByText(/Roteiro em Florianópolis/i)).toBeDefined();
    expect(screen.getByText('Praia da Joaquina')).toBeDefined();
    expect(screen.getByText('09:30 - 12:30')).toBeDefined();
    expect(screen.getByText(/Clima ideal para praia/i)).toBeDefined();
    expect(screen.getByText(/Avenida das Rendeiras, Lagoa da Conceição/i)).toBeDefined();
  });

  it('deve renderizar a capa editorial e o card de QR Code SVG local para acesso no celular', () => {
    render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

    expect(screen.getByText(/Guia de Viagem Personalizado/i)).toBeDefined();
    expect(screen.getByText(/Leve seu guia de viagem no bolso/i)).toBeDefined();

    const qrSvg = screen.getByTestId('itinerary-companion-qr-svg');
    expect(qrSvg).toBeDefined();
    expect(qrSvg.tagName.toLowerCase()).toBe('svg');
    expect(qrSvg.getAttribute('role')).toBe('img');
    expect(qrSvg.getAttribute('aria-label')).toBe('QR Code para roteiro em Florianópolis');

    // Assegura que nenhuma tag img aponta para api.qrserver.com
    const externalImages = document.querySelectorAll('img[src*="api.qrserver.com"]');
    expect(externalImages.length).toBe(0);

    expect(screen.getByTestId('itinerary-companion-maps-link')).toBeDefined();
  });

  it('deve garantir que o QR Code SVG vetorial contém caminhos de desenho sem dependência de rede', () => {
    render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

    const qrSvg = screen.getByTestId('itinerary-companion-qr-svg');
    const path = qrSvg.querySelector('path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('d')).toBeDefined();
    expect(path?.getAttribute('fill')).toBe('#0f172a');
  });

  it('deve invocar o download do arquivo .ics ao clicar no botão de calendário com data-testid', () => {
    const downloadSpy = vi.spyOn(CalendarExporter, 'downloadIcsFile').mockImplementation(() => {});

    render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

    const calBtn = screen.getByTestId('itinerary-export-ics-btn');
    expect(calBtn.getAttribute('style')).toBeNull();
    fireEvent.click(calBtn);

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect(downloadSpy).toHaveBeenCalledWith(mockItinerary);
  });

  it('deve disparar window.print ao clicar no botão de impressão de PDF com data-testid', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

    const printBtn = screen.getByTestId('itinerary-print-pdf-btn');
    expect(printBtn.getAttribute('style')).toBeNull();
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar links de POI com data-testid', () => {
    render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

    const poiLink = screen.getByTestId('period-poi-maps-link');
    expect(poiLink).toBeDefined();
  });

  it('deve exibir estado vazio com botão de voltar com data-testid caso não haja dias agendados', () => {
    const handleBack = vi.fn();
    render(
      <ItineraryView
        itinerary={{ city: 'Florianópolis', days: [], totalPlacesScheduled: 0 }}
        onBackToSwipe={handleBack}
      />
    );

    expect(screen.getByText(/Nenhum roteiro gerado ainda/i)).toBeDefined();
    const backBtn = screen.getByTestId('itinerary-empty-explore-btn');
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  describe('Estimativa de deslocamento visual (transitFromPrevious)', () => {
    it('deve renderizar o badge com data-testid="itinerary-transit-estimate" quando o slot contiver transitFromPrevious', () => {
      const itineraryWithTransit: TripItinerary = {
        city: 'Florianópolis',
        totalPlacesScheduled: 2,
        days: [
          {
            date: '2026-10-23',
            weekday: 'Sexta-feira',
            weatherScore: 90,
            recommendationLevel: 'EXCELLENT',
            isRainyOrAdverse: false,
            slots: [
              mockItinerary.days[0].slots[0],
              {
                slot: 'AFTERNOON',
                slotLabel: 'Tarde',
                startTime: '14:00',
                endTime: '17:30',
                weatherOptimizationNote: 'Visita cultural em museu',
                transitFromPrevious: {
                  distanceKm: 11,
                  walkingMinutes: 138,
                  drivingMinutes: 26,
                  formattedDistance: '~11 km',
                  formattedSummary: '~11 km • 2 h 18 min a pé / 26 min de carro',
                },
                place: {
                  id: 'poi-2',
                  name: 'Museu Histórico Palácio Cruz e Sousa',
                  category: PoiCategory.MUSEUM,
                  environment: PoiEnvironment.INDOOR,
                  latitude: -27.59,
                  longitude: -48.54,
                  city: 'Florianópolis',
                  description: 'Museu histórico no centro',
                  imageUrl: 'https://example.com/museum.jpg',
                  tags: ['Cultura'],
                },
              },
            ],
          },
        ],
      };

      render(<ItineraryView itinerary={itineraryWithTransit} onBackToSwipe={vi.fn()} />);

      const transitBadge = screen.getByTestId('itinerary-transit-estimate');
      expect(transitBadge).toBeDefined();
      expect(transitBadge.textContent).toContain('~11 km • 2 h 18 min a pé / 26 min de carro');
    });

    it('não deve exibir estimativa de deslocamento para o primeiro slot (manhã)', () => {
      render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

      const transitBadge = screen.queryByTestId('itinerary-transit-estimate');
      expect(transitBadge).toBeNull();
    });
  });

  describe('Banner de alerta meteorológico (WeatherAlertBanner)', () => {
    const mockAlert: WeatherAlert = {
      id: 'alert-1',
      type: 'TEMPERATURE_DROP',
      severity: 'WARNING',
      title: 'Queda brusca de temperatura',
      description: 'Queda de 9°C prevista entre 2026-10-23 e 2026-10-24',
      date: '2026-10-24',
      previousDate: '2026-10-23',
      metricDelta: {
        from: 28,
        to: 19,
        unit: '°C',
      },
      recommendation: 'Leve agasalho e planeje atividades em locais cobertos.',
    };

    it('deve renderizar o banner com data-testid="weather-alert-banner" e role="region" quando itinerary.alerts contiver alertas', () => {
      const itineraryWithAlerts: TripItinerary = {
        ...mockItinerary,
        alerts: [mockAlert],
      };

      render(<ItineraryView itinerary={itineraryWithAlerts} onBackToSwipe={vi.fn()} />);

      const banner = screen.getByTestId('weather-alert-banner');
      expect(banner).toBeDefined();
      expect(banner.getAttribute('role')).toBe('region');
      expect(banner.getAttribute('aria-label')).toBe('Avisos meteorológicos');
      expect(screen.getByText('Queda brusca de temperatura')).toBeDefined();
      expect(screen.getByText(/Queda de 9°C prevista/i)).toBeDefined();
      expect(screen.getByText(/Leve agasalho e planeje atividades em locais cobertos/i)).toBeDefined();
    });

    it('não deve renderizar o banner quando itinerary.alerts for indefinido ou vazio', () => {
      render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

      expect(screen.queryByTestId('weather-alert-banner')).toBeNull();
    });
  });
});
