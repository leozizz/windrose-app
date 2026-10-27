import { PointOfInterest, PoiCategory, PoiEnvironment } from '@windrose/shared-types';

interface NominatimPlace {
  place_id: number;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  class: string;
  type: string;
  address?: {
    road?: string;
    pedestrian?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

/**
 * OpenStreetMap Nominatim Client for structured POI and attraction searches by city.
 * Provides real-world landmarks, authentic names, exact coordinates, and street addresses.
 */
export class NominatimClient {
  private static readonly BASE_URL = 'https://nominatim.openstreetmap.org/search';

  /**
   * Search for real points of interest in a city.
   */
  static async fetchCityPois(
    city: string,
    lat?: number,
    lon?: number,
    limit = 15
  ): Promise<PointOfInterest[]> {
    const categoriesToQuery = [
      `attractions in ${city}`,
      `museums in ${city}`,
      `parks in ${city}`,
    ];

    const results: PointOfInterest[] = [];
    const seenNames = new Set<string>();

    for (const query of categoriesToQuery) {
      if (results.length >= limit) break;

      const url = new URL(this.BASE_URL);
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('limit', '8');

      // If coordinates are provided, bias the search to a 25km bounding box around the city
      if (lat !== undefined && lon !== undefined) {
        const delta = 0.25; // ~25km
        url.searchParams.set(
          'viewbox',
          `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`
        );
        url.searchParams.set('bounded', '1');
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(url.toString(), {
          headers: {
            'User-Agent': 'WindroseApp/2.0 (contact@windrose.app; https://windrose.pages.dev)',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) continue;

        const data = (await res.json()) as NominatimPlace[];

        for (const item of data) {
          const rawName = item.name || item.display_name.split(',')[0].trim();
          const normalized = rawName.toLowerCase();

          // Skip generic numbers or duplicated names
          if (!rawName || /^\d+$/.test(rawName) || seenNames.has(normalized)) {
            continue;
          }

          seenNames.add(normalized);
          results.push(this.mapNominatimToPoi(item, rawName, city));

          if (results.length >= limit) break;
        }
      } catch {
        // Silently continue to next query on timeout/network issue
      }
    }

    return results;
  }

  private static mapNominatimToPoi(
    item: NominatimPlace,
    name: string,
    city: string
  ): PointOfInterest {
    let category = PoiCategory.ATTRACTION;
    let environment = PoiEnvironment.OUTDOOR;

    if (item.type === 'museum' || item.class === 'museum') {
      category = PoiCategory.MUSEUM;
      environment = PoiEnvironment.INDOOR;
    } else if (item.type === 'park' || item.type === 'garden' || item.class === 'leisure') {
      category = PoiCategory.PARK;
      environment = PoiEnvironment.OUTDOOR;
    } else if (item.type === 'beach') {
      category = PoiCategory.BEACH;
      environment = PoiEnvironment.OUTDOOR;
    } else if (item.type === 'restaurant' || item.class === 'amenity') {
      category = PoiCategory.RESTAURANT;
      environment = PoiEnvironment.HYBRID;
    }

    // Format street-level address
    const addr = item.address;
    const addressParts: string[] = [];
    if (addr) {
      const street = addr.road || addr.pedestrian;
      const district = addr.suburb || addr.neighbourhood || addr.city_district;
      const cityName = addr.city || addr.town || addr.municipality || city;

      if (street) addressParts.push(street);
      if (district) addressParts.push(district);
      if (cityName) addressParts.push(cityName);
    }

    const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : undefined;

    const friendlyCategoryName = this.getFriendlyCategoryName(category);

    return {
      id: `osm-nom-${item.osm_id || item.place_id}`,
      name,
      category,
      environment,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      city,
      description: `${friendlyCategoryName} situado em ${city}.`,
      imageUrl: this.getDefaultCategoryPhoto(category),
      tags: [friendlyCategoryName, 'Ponto de Interesse'],
      address: formattedAddress,
    };
  }

  private static getFriendlyCategoryName(category: PoiCategory): string {
    switch (category) {
      case PoiCategory.BEACH:
        return 'Praia';
      case PoiCategory.PARK:
        return 'Parque Natural';
      case PoiCategory.MUSEUM:
        return 'Museu';
      case PoiCategory.RESTAURANT:
        return 'Restaurante';
      case PoiCategory.BAR:
        return 'Bar';
      case PoiCategory.CULTURE:
        return 'Espaço Cultural';
      default:
        return 'Ponto Turístico';
    }
  }

  private static getDefaultCategoryPhoto(category: PoiCategory): string {
    switch (category) {
      case PoiCategory.BEACH:
        return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
      case PoiCategory.PARK:
        return 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80';
      case PoiCategory.MUSEUM:
        return 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80';
      case PoiCategory.RESTAURANT:
        return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
      case PoiCategory.BAR:
        return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80';
      default:
        return 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80';
    }
  }
}
