import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItineraryView } from './ItineraryView';
import { TripItinerary, PoiCategory, PoiEnvironment } from '@windrose/shared-types';
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

  it('deve renderizar a capa editorial e o card de QR Code para acesso no celular', () => {
    render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

    expect(screen.getByText(/Guia de Viagem Personalizado/i)).toBeDefined();
    expect(screen.getByText(/Leve seu guia de viagem no bolso/i)).toBeDefined();
    const qrImg = screen.getByRole('img', { name: /QR Code para roteiro em Florianópolis/i });
    expect(qrImg).toBeDefined();
    expect(screen.getByTestId('itinerary-companion-maps-link')).toBeDefined();
  });

  it('deve exibir fallback amigável caso o QR code falhe ao carregar', () => {
    render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

    const qrImg = screen.getByRole('img', { name: /QR Code para roteiro em Florianópolis/i });
    fireEvent.error(qrImg);

    expect(screen.getByTestId('qr-fallback')).toBeDefined();
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
});
