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

/**
 * Client for Wikimedia / Wikipedia REST API to enrich attractions with editorial summaries and photos.
 */
export class WikimediaClient {
  private static readonly cache = new Map<string, { summary?: string; imageUrl?: string }>();

  /**
   * Enrich a place with a Wikipedia summary and image if available.
   */
  static async enrichPlace(
    placeName: string,
    language = 'pt'
  ): Promise<{ summary?: string; imageUrl?: string }> {
    const key = placeName.trim().toLowerCase();
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    try {
      const sanitizedTitle = encodeURIComponent(placeName.trim().replace(/\s+/g, '_'));
      const url = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${sanitizedTitle}`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'WindroseApp-Edge/2.0 (Wikimedia-Enrichment)',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return {};
      }

      const json = (await res.json()) as WikiSummaryResponse;
      const result = {
        summary: json.extract,
        imageUrl: json.originalimage?.source || json.thumbnail?.source,
      };

      this.cache.set(key, result);
      return result;
    } catch {
      return {};
    }
  }
}
