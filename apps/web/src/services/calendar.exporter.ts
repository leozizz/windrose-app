import { TripItinerary, ItinerarySlot } from '@windrose/shared-types';

export class CalendarExporter {
  /**
   * Generates a standard RFC 5545 .ics iCalendar file string for the trip.
   */
  static generateIcs(itinerary: TripItinerary): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Windrose App//Weather Itinerary Planner//PT-BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Roteiro Windrose — ${itinerary.city}`,
      'X-WR-TIMEZONE:UTC',
    ];

    for (const day of itinerary.days) {
      const cleanDate = day.date.replace(/-/g, '');

      for (const slot of day.slots) {
        const startClean = slot.startTime.replace(/:/g, '') + '00';
        const endClean = slot.endTime.replace(/:/g, '') + '00';

        const dtStart = `${cleanDate}T${startClean}`;
        const dtEnd = `${cleanDate}T${endClean}`;
        const uid = `windrose-${day.date}-${slot.slot}-${slot.place.id}@windrose.app`;

        const desc = [
          slot.place.description,
          slot.weatherOptimizationNote ? `Nota: ${slot.weatherOptimizationNote}` : '',
          'Gerado por Windrose App',
        ]
          .filter(Boolean)
          .join('\\n');

        lines.push(
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:${slot.place.name} (${slot.slotLabel})`,
          `DESCRIPTION:${desc}`,
          `LOCATION:${slot.place.name}, ${itinerary.city}`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      }
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Triggers a browser download of the generated .ics file.
   */
  static downloadIcsFile(itinerary: TripItinerary): void {
    const icsContent = this.generateIcs(itinerary);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `roteiro-${itinerary.city.toLowerCase().replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a 1-click Google Calendar add link for a single slot.
   */
  static getGoogleCalendarUrl(slot: ItinerarySlot, dateStr: string, city: string): string {
    const cleanDate = dateStr.replace(/-/g, '');
    const startClean = slot.startTime.replace(/:/g, '') + '00';
    const endClean = slot.endTime.replace(/:/g, '') + '00';

    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', `${slot.place.name} (${slot.slotLabel}) - ${city}`);
    url.searchParams.set('dates', `${cleanDate}T${startClean}/${cleanDate}T${endClean}`);
    url.searchParams.set(
      'details',
      `${slot.place.description}\n\n${slot.weatherOptimizationNote || ''}\nPlanejado via Windrose App`
    );
    url.searchParams.set('location', `${slot.place.name}, ${city}`);

    return url.toString();
  }
}
