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
  });

  it('deve invocar o download do arquivo .ics ao clicar no botão de calendário', () => {
    const downloadSpy = vi.spyOn(CalendarExporter, 'downloadIcsFile').mockImplementation(() => {});

    render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

    const calBtn = screen.getByRole('button', { name: /Exportar Calendário \(\.ICS\)/i });
    fireEvent.click(calBtn);

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect(downloadSpy).toHaveBeenCalledWith(mockItinerary);
  });

  it('deve disparar window.print ao clicar no botão de impressão de PDF', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<ItineraryView itinerary={mockItinerary} onBackToSwipe={vi.fn()} />);

    const printBtn = screen.getByRole('button', { name: /Baixar PDF Editorial/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('deve exibir estado vazio com botão de voltar caso não haja dias agendados', () => {
    const handleBack = vi.fn();
    render(
      <ItineraryView
        itinerary={{ city: 'Florianópolis', days: [], totalPlacesScheduled: 0 }}
        onBackToSwipe={handleBack}
      />
    );

    expect(screen.getByText(/Nenhum roteiro gerado ainda/i)).toBeDefined();
    const backBtn = screen.getByRole('button', { name: /Explorar Lugares no Swipe/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
