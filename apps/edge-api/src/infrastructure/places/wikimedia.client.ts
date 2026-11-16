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

interface InternalSearchResult extends PlaceEnrichmentResult {
  hasPages: boolean;
}

/**
 * Resilient client for Wikimedia & Wikipedia Search APIs.
 * Discovers real encyclopedic photographs and editorial summaries for landmarks and points of interest.
 * Implements in-flight deduplication, negative caching, strict concurrency limits, and 1500ms timeout.
 */
export class WikimediaClient {
  private static readonly MAX_CACHE_SIZE = 500;
  private static readonly REQUEST_TIMEOUT_MS = 1500;
  private static readonly cache = new Map<string, PlaceEnrichmentResult>();
  private static readonly inFlight = new Map<string, Promise<PlaceEnrichmentResult>>();

  /**
   * Resets the in-memory cache and in-flight tracking (useful for testing).
   */
  static clearCache = (): void => {
    WikimediaClient.cache.clear();
    WikimediaClient.inFlight.clear();
  };

  /**
   * Returns current count of cached enrichment items.
   */
  static getCacheSize = (): number => {
    return WikimediaClient.cache.size;
  };

  /**
   * Inserts or refreshes an entry in cache, evicting the oldest key if limit is reached.
   */
  private static setCache = (key: string, value: PlaceEnrichmentResult): void => {
    if (WikimediaClient.cache.has(key)) {
      WikimediaClient.cache.delete(key);
    } else if (WikimediaClient.cache.size >= WikimediaClient.MAX_CACHE_SIZE) {
      const oldestKey = WikimediaClient.cache.keys().next().value;
      if (oldestKey) {
        WikimediaClient.cache.delete(oldestKey);
      }
    }
    WikimediaClient.cache.set(key, value);
  };

  /**
   * Enriches a place with Wikipedia summary and high-resolution photo.
   * Performs in-flight deduplication and negative caching to protect Cloudflare Workers subrequest budget.
   */
  static enrichPlace = async (
    placeName: string,
    city?: string,
    language = 'pt'
  ): Promise<PlaceEnrichmentResult> => {
    const cleanName = placeName.replace(/\(.*?\)/g, '').trim();
    const cacheKey = `${cleanName}:${city || ''}:${language}`.toLowerCase();

    if (WikimediaClient.cache.has(cacheKey)) {
      return WikimediaClient.cache.get(cacheKey)!;
    }

    const existingPromise = WikimediaClient.inFlight.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const enrichmentPromise = WikimediaClient.executeEnrichmentWithFallback(
      cleanName,
      city,
      language,
      cacheKey
    );

    WikimediaClient.inFlight.set(cacheKey, enrichmentPromise);
    return enrichmentPromise;
  };

  /**
   * Orchestrates enrichment execution with in-flight cleanup and negative cache retention.
   */
  private static executeEnrichmentWithFallback = async (
    cleanName: string,
    city: string | undefined,
    language: string,
    cacheKey: string
  ): Promise<PlaceEnrichmentResult> => {
    try {
      const result = await WikimediaClient.performEnrichment(cleanName, city, language);
      WikimediaClient.setCache(cacheKey, result);
      return result;
    } catch (_err: unknown) {
      const emptyResult: PlaceEnrichmentResult = {};
      WikimediaClient.setCache(cacheKey, emptyResult);
      return emptyResult;
    } finally {
      WikimediaClient.inFlight.delete(cacheKey);
    }
  };

  /**
   * Executes network queries with immediate fallback pruning to save subrequests.
   */
  private static performEnrichment = async (
    cleanName: string,
    city: string | undefined,
    language: string
  ): Promise<PlaceEnrichmentResult> => {
    // 1. First attempt: Search API with place name + city (best disambiguation)
    const searchQuery = city ? `${cleanName} ${city}` : cleanName;
    const firstResult = await WikimediaClient.querySearchApi(searchQuery, language);

    // Immediate prune: if initial search returned empty, avoid redundant retries for obscure POIs
    if (!firstResult.hasPages) {
      return {};
    }

    let result: PlaceEnrichmentResult = {
      summary: firstResult.summary,
      imageUrl: firstResult.imageUrl,
      source: firstResult.source,
    };

    // 2. Second attempt: If article was found but lacks image, query direct REST summary
    if (!result.imageUrl) {
      const summaryResult = await WikimediaClient.queryRestSummary(cleanName, language);
      if (summaryResult.imageUrl || summaryResult.summary) {
        result = {
          summary: result.summary || summaryResult.summary,
          imageUrl: summaryResult.imageUrl,
          source: 'wikimedia-summary',
        };
      }
    }

    // 3. Third attempt: If still without image and language is pt, try international en search
    if (!result.imageUrl && language === 'pt') {
      const enResult = await WikimediaClient.querySearchApi(searchQuery, 'en');
      if (enResult.imageUrl) {
        result = {
          summary: result.summary || enResult.summary,
          imageUrl: enResult.imageUrl,
          source: 'wikimedia-search',
        };
      }
    }

    return result;
  };

  /**
   * Queries the Wikimedia OpenSearch / Generator Search API for rich pageimages and extracts with 1500ms timeout.
   */
  private static querySearchApi = async (
    queryText: string,
    language: string
  ): Promise<InternalSearchResult> => {
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
        signal: AbortSignal.timeout(WikimediaClient.REQUEST_TIMEOUT_MS),
        headers: {
          'User-Agent': 'WindroseApp-Edge/2.0 (Wikimedia-Enrichment; https://windrose-app.pages.dev)',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return { hasPages: false };
      }

      const data = (await res.json()) as WikimediaSearchResult;
      const pages = data.query?.pages;
      if (!pages || Object.keys(pages).length === 0) {
        return { hasPages: false };
      }

      const firstPageKey = Object.keys(pages)[0];
      const page = pages[firstPageKey];
      if (!page || (firstPageKey === '-1' && !page.title)) {
        return { hasPages: false };
      }

      const summary = page.extract?.trim();
      const imageUrl = page.thumbnail?.source || page.originalimage?.source;

      return {
        hasPages: true,
        summary: summary && summary.length > 20 ? summary : undefined,
        imageUrl: imageUrl || undefined,
        source: 'wikimedia-search',
      };
    } catch (_err: unknown) {
      return { hasPages: false };
    }
  };

  /**
   * Fallback to direct REST page summary endpoint with 1500ms timeout.
   */
  private static queryRestSummary = async (
    placeName: string,
    language: string
  ): Promise<PlaceEnrichmentResult> => {
    try {
      const sanitizedTitle = encodeURIComponent(placeName.replace(/\s+/g, '_'));
      const url = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${sanitizedTitle}`;

      const res = await fetch(url, {
        signal: AbortSignal.timeout(WikimediaClient.REQUEST_TIMEOUT_MS),
        headers: {
          'User-Agent': 'WindroseApp-Edge/2.0 (Wikimedia-Enrichment; https://windrose-app.pages.dev)',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return {};
      }

      const json = (await res.json()) as WikiSummaryResponse;
      return {
        summary: json.extract,
        imageUrl: json.originalimage?.source || json.thumbnail?.source,
        source: 'wikimedia-summary',
      };
    } catch (_err: unknown) {
      return {};
    }
  };
}
