import { PointOfInterest } from './places.interface';

export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface ItinerarySlot {
  slot: TimeSlot;
  slotLabel: string;
  startTime: string; // "09:30"
  endTime: string;   // "12:30"
  place: PointOfInterest;
  weatherOptimizationNote?: string;
}

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
