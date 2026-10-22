/**
 * High-level categories for points of interest in travel planning.
 */
export enum PoiCategory {
  ATTRACTION = 'ATTRACTION',
  BEACH = 'BEACH',
  PARK = 'PARK',
  MUSEUM = 'MUSEUM',
  RESTAURANT = 'RESTAURANT',
  BAR = 'BAR',
  CULTURE = 'CULTURE',
}

/**
 * Environmental context of a place (crucial for weather-based scheduling).
 */
export enum PoiEnvironment {
  OUTDOOR = 'OUTDOOR',
  INDOOR = 'INDOOR',
  HYBRID = 'HYBRID',
}

/**
 * Normalized Point of Interest representation for swipe discovery and itinerary generation.
 */
export interface PointOfInterest {
  id: string;
  name: string;
  category: PoiCategory;
  environment: PoiEnvironment;
  latitude: number;
  longitude: number;
  city: string;
  description: string;
  imageUrl: string;
  tags: string[];
  address?: string;
  website?: string;
}
