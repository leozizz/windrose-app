import { PointOfInterest } from '@windrose/shared-types';
import { OverpassClient } from '../../infrastructure/places/overpass.client';
import { WikimediaClient } from '../../infrastructure/places/wikimedia.client';
import {
  CURATED_CITY_POIS,
  generateGenericCityPois,
} from '../../infrastructure/places/curated-fallbacks';

/**
 * Domain service responsible for assembling, balancing, and enriching POI swipe decks.
 */
export class PlacesService {
  /**
   * Get an assembled deck of places for swipe discovery in a destination.
   */
  static async getDeckForCity(
    city: string,
    lat: number,
    lon: number,
    limit = 20
  ): Promise<PointOfInterest[]> {
    const cityKey = city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    const curated = CURATED_CITY_POIS[cityKey] || [];

    // Query Overpass API for real-world nodes around coordinates
    let osmPois: PointOfInterest[] = [];
    try {
      osmPois = await OverpassClient.fetchNearbyPois(lat, lon, city, 12000, limit);
    } catch {
      osmPois = [];
    }

    // Merge curated with OSM points, avoiding duplicate names
    const seenNames = new Set<string>();
    const combined: PointOfInterest[] = [];

    for (const poi of [...curated, ...osmPois]) {
      const normalizedName = poi.name.toLowerCase().trim();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        combined.push(poi);
      }
    }

    // If still empty (e.g. timeout on remote OSM), use generic high-quality generator
    if (combined.length === 0) {
      combined.push(...generateGenericCityPois(city, lat, lon));
    }

    // Enrich top attractions with Wikimedia if image is still fallback
    const enriched = await Promise.all(
      combined.slice(0, limit).map(async (poi) => {
        if (poi.imageUrl && !poi.imageUrl.includes('unsplash.com')) {
          return poi;
        }

        const wiki = await WikimediaClient.enrichPlace(poi.name);
        return {
          ...poi,
          description: wiki.summary || poi.description,
          imageUrl: wiki.imageUrl || poi.imageUrl,
        };
      })
    );

    return enriched;
  }
}
