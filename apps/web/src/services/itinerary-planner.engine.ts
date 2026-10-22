import {
  PointOfInterest,
  DailyScore,
  TripItinerary,
  ItineraryDay,
  ItinerarySlot,
  PoiEnvironment,
  PoiCategory,
} from '@windrose/shared-types';

export class ItineraryPlannerEngine {
  /**
   * Builds an optimized travel itinerary combining liked places with weather forecasts.
   * Strategically reserves indoor attractions for adverse/rainy days and outdoor attractions for sunny days.
   */
  static buildSmartItinerary(
    city: string,
    likedPois: PointOfInterest[],
    dailyScores: DailyScore[]
  ): TripItinerary {
    if (!likedPois || likedPois.length === 0 || !dailyScores || dailyScores.length === 0) {
      return {
        city,
        days: [],
        totalPlacesScheduled: 0,
      };
    }

    // Segregate places into thematic pools
    const outdoorPool = likedPois.filter(
      (p) => p.environment === PoiEnvironment.OUTDOOR && p.category !== PoiCategory.BAR
    );
    const indoorPool = likedPois.filter(
      (p) => p.environment === PoiEnvironment.INDOOR || p.category === PoiCategory.MUSEUM
    );
    const diningPool = likedPois.filter(
      (p) =>
        p.category === PoiCategory.RESTAURANT ||
        p.category === PoiCategory.BAR ||
        p.environment === PoiEnvironment.HYBRID
    );
    const genericPool = likedPois.filter(
      (p) => !outdoorPool.includes(p) && !indoorPool.includes(p) && !diningPool.includes(p)
    );

    const scheduledPoiIds = new Set<string>();

    const popFrom = (pool: PointOfInterest[]): PointOfInterest | null => {
      const item = pool.find((p) => !scheduledPoiIds.has(p.id));
      if (item) {
        scheduledPoiIds.add(item.id);
        return item;
      }
      return null;
    };

    const popAny = (): PointOfInterest | null => {
      return (
        popFrom(outdoorPool) ||
        popFrom(indoorPool) ||
        popFrom(diningPool) ||
        popFrom(genericPool)
      );
    };

    const popAnyExceptIndoor = (): PointOfInterest | null => {
      return (
        popFrom(outdoorPool) ||
        popFrom(diningPool) ||
        popFrom(genericPool)
      );
    };

    // Pre-calculate which days are rainy/adverse
    const daySuitability = dailyScores.map((dayScore) => ({
      dayScore,
      isRainyOrAdverse: dayScore.score < 50 || dayScore.recommendationLevel === 'POOR',
    }));

    const hasRainyDays = daySuitability.some((d) => d.isRainyOrAdverse);

    const days: ItineraryDay[] = daySuitability.map(({ dayScore, isRainyOrAdverse }) => {
      const weekday = this.getWeekday(dayScore.date);
      const slots: ItinerarySlot[] = [];

      // Morning Slot (09:30 - 12:30)
      let morningPlace: PointOfInterest | null = null;
      let morningNote: string | undefined = undefined;

      if (isRainyOrAdverse) {
        morningPlace = popFrom(indoorPool) || popFrom(diningPool) || popAny();
        morningNote = morningPlace ? '🏛️ Programado para local coberto devido ao tempo adverso' : undefined;
      } else {
        // On a sunny day, prefer outdoor. Never drain indoor attractions if rainy days exist
        morningPlace = popFrom(outdoorPool) || (hasRainyDays ? popAnyExceptIndoor() : popAny());
        morningNote = morningPlace ? '☀️ Clima ideal para atividades ao ar livre' : undefined;
      }

      if (morningPlace) {
        slots.push({
          slot: 'MORNING',
          slotLabel: 'Manhã',
          startTime: '09:30',
          endTime: '12:30',
          place: morningPlace,
          weatherOptimizationNote: morningNote,
        });
      }

      // Afternoon Slot (14:00 - 17:30)
      let afternoonPlace: PointOfInterest | null = null;
      let afternoonNote: string | undefined = undefined;

      if (isRainyOrAdverse) {
        afternoonPlace = popFrom(indoorPool) || popFrom(diningPool) || popAny();
        afternoonNote = afternoonPlace ? '☕ Passeio e gastronomia protegidos do tempo' : undefined;
      } else {
        afternoonPlace = popFrom(outdoorPool) || (hasRainyDays ? popAnyExceptIndoor() : popAny());
      }

      if (afternoonPlace) {
        slots.push({
          slot: 'AFTERNOON',
          slotLabel: 'Tarde',
          startTime: '14:00',
          endTime: '17:30',
          place: afternoonPlace,
          weatherOptimizationNote: afternoonNote,
        });
      }

      // Evening Slot (19:30 - 22:30)
      const eveningPlace = popFrom(diningPool) || (hasRainyDays ? popAnyExceptIndoor() : popAny());
      if (eveningPlace) {
        slots.push({
          slot: 'EVENING',
          slotLabel: 'Noite',
          startTime: '19:30',
          endTime: '22:30',
          place: eveningPlace,
          weatherOptimizationNote: '🍷 Jantar e entretenimento noturno',
        });
      }

      return {
        date: dayScore.date,
        weekday,
        weatherScore: dayScore.score,
        recommendationLevel: dayScore.recommendationLevel,
        isRainyOrAdverse,
        slots,
      };
    });

    const activeDays = days.filter((d) => d.slots.length > 0);

    return {
      city,
      days: activeDays.length > 0 ? activeDays : days,
      totalPlacesScheduled: scheduledPoiIds.size,
    };
  }

  private static getWeekday(dateStr: string): string {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      const name = date.toLocaleDateString('pt-BR', { weekday: 'long' });
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      return dateStr;
    }
  }
}
