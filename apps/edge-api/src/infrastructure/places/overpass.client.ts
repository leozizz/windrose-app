import { PointOfInterest, PoiCategory, PoiEnvironment } from '@windrose/shared-types';

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

/**
 * OpenStreetMap Overpass API client for querying POIs by geographic radius.
 */
export class OverpassClient {
  private static readonly endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
  ];

  /**
   * Fetch points of interest within a given radius (meters) of coordinates.
   */
  static async fetchNearbyPois(
    lat: number,
    lon: number,
    city: string,
    radiusMeters = 10000,
    limit = 25
  ): Promise<PointOfInterest[]> {
    const query = `
      [out:json][timeout:4];
      (
        node["tourism"~"attraction|museum|viewpoint"](around:${radiusMeters},${lat},${lon});
        node["amenity"~"restaurant|bar|cafe"](around:${radiusMeters},${lat},${lon});
        node["leisure"~"park|beach_resort"](around:${radiusMeters},${lat},${lon});
        node["natural"~"beach"](around:${radiusMeters},${lat},${lon});
      );
      out center ${limit};
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const response = await fetch(this.endpoints[0], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'WindroseApp-Edge/2.0 (OpenStreetMap-Query)',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as OverpassResponse;
      if (!data.elements || data.elements.length === 0) {
        return [];
      }

      return data.elements
        .filter((el) => el.tags && el.tags.name)
        .map((el) => this.mapElementToPoi(el, city));
    } catch {
      clearTimeout(timeoutId);
      return [];
    }
  }

  private static mapElementToPoi(element: OverpassElement, city: string): PointOfInterest {
    const tags = element.tags || {};
    const name = tags.name || 'Ponto de Interesse';

    let category = PoiCategory.ATTRACTION;
    let environment = PoiEnvironment.OUTDOOR;

    if (tags.amenity === 'restaurant') {
      category = PoiCategory.RESTAURANT;
      environment = PoiEnvironment.HYBRID;
    } else if (tags.amenity === 'bar' || tags.amenity === 'cafe') {
      category = PoiCategory.BAR;
      environment = PoiEnvironment.HYBRID;
    } else if (tags.tourism === 'museum') {
      category = PoiCategory.MUSEUM;
      environment = PoiEnvironment.INDOOR;
    } else if (tags.natural === 'beach' || tags.leisure === 'beach_resort') {
      category = PoiCategory.BEACH;
      environment = PoiEnvironment.OUTDOOR;
    } else if (tags.leisure === 'park') {
      category = PoiCategory.PARK;
      environment = PoiEnvironment.OUTDOOR;
    }

    const tagList: string[] = [];
    if (tags.cuisine) tagList.push(tags.cuisine);
    if (tags.sport) tagList.push(tags.sport);
    if (tagList.length === 0) {
      tagList.push(this.getFriendlyCategoryName(category));
    }

    const imageUrl = this.getDefaultCategoryPhoto(category);
    const friendlyCategoryName = this.getFriendlyCategoryName(category);

    return {
      id: `osm-${element.id}`,
      name,
      category,
      environment,
      latitude: element.lat,
      longitude: element.lon,
      city,
      description: tags.description || `${friendlyCategoryName} situado em ${city}.`,
      imageUrl,
      tags: tagList,
      website: tags.website || tags['contact:website'],
      address: tags['addr:street'] ? `${tags['addr:street']}, ${tags['addr:housenumber'] || ''}` : undefined,
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
