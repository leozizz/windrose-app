interface WikimediaSearchResult {
  batchcomplete?: string;
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        extract?: string;
        thumbnail?: {
          source: string;
          width: number;
          height: number;
        };
        originalimage?: {
          source: string;
        };
      }
    >;
  };
}

interface WikiSummaryResponse {
  title?: string;
  extract?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
  };
}

export interface PlaceEnrichmentResult {
  summary?: string;
  imageUrl?: string;
  source?: 'wikimedia-search' | 'wikimedia-summary' | 'pool' | 'osm';
}

/**
 * Resilient client for Wikimedia & Wikipedia Search APIs.
 * Discovers real encyclopedic photographs and editorial summaries for landmarks and points of interest.
 */
export class WikimediaClient {
  private static readonly cache = new Map<string, PlaceEnrichmentResult>();

  /**
   * Enriches a place with Wikipedia summary and high-resolution photo.
   * Performs full-text query disambiguation with place name + city.
   */
  static async enrichPlace(
    placeName: string,
    city?: string,
    language = 'pt'
  ): Promise<PlaceEnrichmentResult> {
    const cleanName = placeName.replace(/\(.*?\)/g, '').trim();
    const cacheKey = `${cleanName}:${city || ''}:${language}`.toLowerCase();

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // 1. First attempt: Search API with place name + city (best disambiguation)
      const searchQuery = city ? `${cleanName} ${city}` : cleanName;
      let result = await this.querySearchApi(searchQuery, language);

      // 2. Second attempt: Search API with clean place name only
      if (!result.imageUrl) {
        const fallbackResult = await this.querySearchApi(cleanName, language);
        if (fallbackResult.imageUrl || fallbackResult.summary) {
          result = {
            summary: result.summary || fallbackResult.summary,
            imageUrl: fallbackResult.imageUrl,
            source: 'wikimedia-search',
          };
        }
      }

      // 3. Third attempt: Direct REST summary endpoint
      if (!result.imageUrl) {
        const summaryResult = await this.queryRestSummary(cleanName, language);
        if (summaryResult.imageUrl || summaryResult.summary) {
          result = {
            summary: result.summary || summaryResult.summary,
            imageUrl: summaryResult.imageUrl,
            source: 'wikimedia-summary',
          };
        }
      }

      // 4. Fourth attempt: If language is pt and nothing found, try international en search
      if (!result.imageUrl && language === 'pt') {
        const enResult = await this.querySearchApi(searchQuery, 'en');
        if (enResult.imageUrl) {
          result = {
            summary: result.summary || enResult.summary,
            imageUrl: enResult.imageUrl,
            source: 'wikimedia-search',
          };
        }
      }

      this.cache.set(cacheKey, result);
      return result;
    } catch {
      return {};
    }
  }

  /**
   * Queries the Wikimedia OpenSearch / Generator Search API for rich pageimages and extracts.
   */
  private static async querySearchApi(
    queryText: string,
    language: string
  ): Promise<PlaceEnrichmentResult> {
    try {
      const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
      url.searchParams.set('action', 'query');
      url.searchParams.set('generator', 'search');
      url.searchParams.set('gsrsearch', queryText);
      url.searchParams.set('gsrlimit', '1');
      url.searchParams.set('prop', 'pageimages|extracts');
      url.searchParams.set('exintro', '1');
      url.searchParams.set('explaintext', '1');
      url.searchParams.set('exchars', '350');
      url.searchParams.set('pithumbsize', '800'); // High-resolution thumbnail
      url.searchParams.set('format', 'json');
      url.searchParams.set('origin', '*');

      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'WindroseApp-Edge/2.0 (Wikimedia-Enrichment; https://windrose-app.pages.dev)',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return {};
      }

      const data = (await res.json()) as WikimediaSearchResult;
      const pages = data.query?.pages;
      if (!pages) return {};

      // Get the first matching page
      const firstPageKey = Object.keys(pages)[0];
      const page = pages[firstPageKey];
      if (!page) return {};

      // Filter out disambiguation pages or irrelevant extracts
      const summary = page.extract?.trim();
      const imageUrl = page.thumbnail?.source || page.originalimage?.source;

      return {
        summary: summary && summary.length > 20 ? summary : undefined,
        imageUrl: imageUrl || undefined,
        source: 'wikimedia-search',
      };
    } catch {
      return {};
    }
  }

  /**
   * Fallback to direct REST page summary endpoint.
   */
  private static async queryRestSummary(
    placeName: string,
    language: string
  ): Promise<PlaceEnrichmentResult> {
    try {
      const sanitizedTitle = encodeURIComponent(placeName.replace(/\s+/g, '_'));
      const url = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${sanitizedTitle}`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'WindroseApp-Edge/2.0 (Wikimedia-Enrichment; https://windrose-app.pages.dev)',
          Accept: 'application/json',
        },
      });

      if (!res.ok) return {};

      const json = (await res.json()) as WikiSummaryResponse;
      return {
        summary: json.extract,
        imageUrl: json.originalimage?.source || json.thumbnail?.source,
        source: 'wikimedia-summary',
      };
    } catch {
      return {};
    }
  }
}
