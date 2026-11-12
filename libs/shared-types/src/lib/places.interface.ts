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
 * Coastal and beach morphological/experience profile.
 */
export enum BeachProfileType {
  CALM_WATERS = 'CALM_WATERS',
  SURF_ACTIVE = 'SURF_ACTIVE',
  DEEP_DROP_OFF = 'DEEP_DROP_OFF',
  WILD_RESERVED = 'WILD_RESERVED',
}

/**
 * Estimated deterministic crowd level ($0.00).
 */
export enum CrowdLevel {
  QUIET = 'QUIET',
  MODERATE = 'MODERATE',
  BUZZING = 'BUZZING',
}

/**
 * Marine safety condition for recreational swimming.
 */
export interface WaveSafetyCondition {
  heightMeters: number;
  periodSeconds: number;
  safeForSwimming: boolean;
  safetyWarning?: string;
}

/**
 * Enriched beach metadata for coastal destinations.
 */
export interface BeachMetadata {
  profile: BeachProfileType;
  crowdEstimate: CrowdLevel;
  lifeguardAvailable: boolean;
  waveConditions?: WaveSafetyCondition;
  swimmingSuitabilityScore: number;
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
  beachMetadata?: BeachMetadata;
}
