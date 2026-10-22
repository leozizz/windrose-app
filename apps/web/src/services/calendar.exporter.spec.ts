import { describe, it, expect } from 'vitest';
import { CalendarExporter } from './calendar.exporter';
import { TripItinerary, PoiCategory, PoiEnvironment } from '@windrose/shared-types';

describe('CalendarExporter', () => {
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
            weatherOptimizationNote: 'Clima ideal',
            place: {
              id: 'poi-1',
              name: 'Praia da Joaquina',
              category: PoiCategory.BEACH,
              environment: PoiEnvironment.OUTDOOR,
              latitude: -27.62,
              longitude: -48.44,
              city: 'Florianópolis',
              description: 'Dunas e mar',
              imageUrl: 'https://example.com/beach.jpg',
              tags: ['Surf'],
            },
          },
        ],
      },
    ],
  };

  it('deve gerar conteúdo no padrão iCalendar RFC 5545 com VCALENDAR e VEVENT', () => {
    const ics = CalendarExporter.generateIcs(mockItinerary);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Praia da Joaquina (Manhã)');
    expect(ics).toContain('DTSTART:20261023T093000');
    expect(ics).toContain('DTEND:20261023T123000');
    expect(ics).toContain('LOCATION:Praia da Joaquina, Florianópolis');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('deve gerar deep link do Google Calendar com parâmetros corretos', () => {
    const slot = mockItinerary.days[0].slots[0];
    const url = CalendarExporter.getGoogleCalendarUrl(slot, '2026-10-23', 'Florianópolis');

    expect(url).toContain('https://calendar.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('dates=20261023T093000%2F20261023T123000');
    expect(url).toContain('Praia+da+Joaquina');
  });
});
