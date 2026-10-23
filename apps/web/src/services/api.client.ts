import {
  ActivityRankingResult,
  ActivityType,
  PointOfInterest,
} from '@windrose/shared-types';

const API_BASE_URL =
  (import.meta.env['VITE_API_URL'] as string)?.replace(/\/+$/, '') || '';

export interface PlacesDeckResponse {
  city: string;
  coordinates: { lat: number; lon: number };
  total: number;
  deck: PointOfInterest[];
}

function buildApiUrl(path: string): URL {
  if (API_BASE_URL) {
    return new URL(`${API_BASE_URL}${path}`);
  }
  // When running on the same origin (Cloudflare Pages or Vite dev server with proxy)
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:4200';
  return new URL(path, origin);
}

/**
 * Native typed HTTP client for Windrose Edge API.
 */
export const apiClient = {
  /**
   * Fetch 7-day weather activity suitability ranking for a destination.
   */
  async getRanking(
    city: string,
    activity: ActivityType = ActivityType.OUTDOOR_SIGHTSEEING
  ): Promise<ActivityRankingResult> {
    const url = buildApiUrl('/api/weather/rank');
    url.searchParams.set('city', city);
    url.searchParams.set('activity', activity);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch ranking: HTTP ${res.status}`);
    }

    return res.json();
  },

  /**
   * Fetch a deck of points of interest for swipe discovery.
   */
  async getPlacesDeck(
    city: string,
    lat: number,
    lon: number,
    limit = 20
  ): Promise<PlacesDeckResponse> {
    const url = buildApiUrl('/api/places/deck');
    url.searchParams.set('city', city);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('limit', limit.toString());

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch places deck: HTTP ${res.status}`);
    }

    return res.json();
  },
};
