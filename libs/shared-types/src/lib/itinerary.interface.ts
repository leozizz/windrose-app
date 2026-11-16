import { PointOfInterest } from './places.interface';

/**
 * Estimativa de tempo e distância de deslocamento entre duas atrações consecutivas.
 */
export interface TravelEstimate {
  /** Distância geodésica em quilômetros (arredondada a 1 casa decimal) */
  distanceKm: number;
  /** Tempo estimado de caminhada a pé em minutos */
  walkingMinutes: number;
  /** Tempo estimado de trajeto em automóvel em minutos */
  drivingMinutes: number;
  /** Distância amigável formatada (ex: "~1.2 km" ou "~650 m") */
  formattedDistance: string;
  /** Resumo completo formatado em português (ex: "~1.2 km • 15 min a pé / 5 min de carro") */
  formattedSummary: string;
}

export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface ItinerarySlot {
  slot: TimeSlot;
  slotLabel: string;
  startTime: string; // "09:30"
  endTime: string;   // "12:30"
  place: PointOfInterest;
  weatherOptimizationNote?: string;
  /** Estimativa de deslocamento a partir da atração imediatamente anterior do mesmo dia */
  transitFromPrevious?: TravelEstimate;
}

// Alias de retrocompatibilidade para componentes que utilizavam PoiSlot
export type PoiSlot = ItinerarySlot;

export interface ItineraryDay {
  date: string;
  weekday: string;
  weatherScore: number;
  recommendationLevel: string;
  isRainyOrAdverse: boolean;
  slots: ItinerarySlot[];
}

export interface TripItinerary {
  city: string;
  days: ItineraryDay[];
  totalPlacesScheduled: number;
}

