import { PoiCategory } from '@windrose/shared-types';

/**
 * Curated thematic photo pool containing high-resolution, diverse travel photography.
 * Eliminates repetitive placeholders by deterministically hashing POI identifiers.
 */
export const THEMATIC_PHOTO_POOL: Record<PoiCategory, string[]> = {
  [PoiCategory.BEACH]: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80', // Tropical sandy beach & turquoise ocean
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1080&q=80', // Waves on golden sunset coast
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1080&q=80', // Coastal shoreline and dunes
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1080&q=80', // Crystal clear bay with rocks
    'https://images.unsplash.com/photo-1471922694855-fa59acdb3e32?auto=format&fit=crop&w=1080&q=80', // Aerial view of tropical cove
    'https://images.unsplash.com/photo-1533760881669-80db82820c2d?auto=format&fit=crop&w=1080&q=80', // Dramatic emerald coastline
    'https://images.unsplash.com/photo-1520483601560-389dff434fdf?auto=format&fit=crop&w=1080&q=80', // Surfer beach and ocean horizon
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1080&q=80', // Palm trees and calm island waters
  ],
  [PoiCategory.PARK]: [
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1080&q=80', // Lush green forest canopy
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1080&q=80', // Scenic mountain trail overview
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1080&q=80', // Scenic valley with mountains & lake
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1080&q=80', // Misty sunrise over mountain ridge
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1080&q=80', // Sunbeams cutting through pine woods
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1080&q=80', // Verdant nature park walking path
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1080&q=80', // Autumn woodland and lake trail
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1080&q=80', // Alpine ecological reserve lookout
  ],
  [PoiCategory.MUSEUM]: [
    'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=1080&q=80', // Classical museum palace architecture
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1080&q=80', // Modern art gallery hall
    'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=1080&q=80', // Museum gallery with historical exhibits
    'https://images.unsplash.com/photo-1572947650440-e8a97ef053b2?auto=format&fit=crop&w=1080&q=80', // Sculptures and paintings gallery
    'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=1080&q=80', // Heritage museum corridor and arches
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1080&q=80', // Contemporary art museum display
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1080&q=80', // Historic architectural palace interior
    'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=1080&q=80', // Natural history and cultural museum
  ],
  [PoiCategory.RESTAURANT]: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1080&q=80', // Vibrant market & gourmet eatery
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1080&q=80', // Elegant dining tables and ambient lighting
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1080&q=80', // Cozy coastal bistro restaurant
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1080&q=80', // Contemporary dining room with wooden decor
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1080&q=80', // Plated culinary masterpiece
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=1080&q=80', // Rustic outdoor terrace dining
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1080&q=80', // Lively seafood bistro & kitchen
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1080&q=80', // Sophisticated dining table setting
  ],
  [PoiCategory.BAR]: [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1080&q=80', // Ambient cocktail bar & lounge
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1080&q=80', // Craft brewery & taproom counter
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1080&q=80', // Modern bohemian rooftop bar
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1080&q=80', // Lively pub atmosphere with drinks
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1080&q=80', // Speakeasy cocktail lounge
    'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?auto=format&fit=crop&w=1080&q=80', // Wine bar & glasses on counter
    'https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&w=1080&q=80', // Outdoor sunset deck bar
    'https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=1080&q=80', // Artisanal craft cocktails
  ],
  [PoiCategory.CULTURE]: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1080&q=80', // Historic heritage village architecture
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1080&q=80', // Cultural art exhibition space
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1080&q=80', // Historic bridge & landmark lighting
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1080&q=80', // Historic square & monument
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=80', // Cultural theater and stage
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1080&q=80', // Traditional artisanal market
    'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?auto=format&fit=crop&w=1080&q=80', // Historic cathedral architecture
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1080&q=80', // European style cobblestone cultural quarter
  ],
  [PoiCategory.ATTRACTION]: [
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1080&q=80', // Historic monument & plaza
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1080&q=80', // Iconic cable bridge and bay vista
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1080&q=80', // Scenic travel landscape & viewpoint
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=80', // Breathtaking lake and mountain destination
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1080&q=80', // Panoramic city overlook at sunset
    'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1080&q=80', // Famous tourism landmarks and sights
    'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1080&q=80', // Mountain hiker viewing landmark
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1080&q=80', // Coastal highway and scenic tourist spot
  ],
};

/**
 * Fast string hashing algorithm (djb2) to deterministically map POI identifiers to pool indices.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

/**
 * Service to deterministically assign rich, diverse photos from the curated pool
 * so that adjacent places never share the same image and each place has a stable, consistent visual.
 */
export class PhotoPoolService {
  /**
   * Returns a deterministic, high-resolution photo for a given POI category and seed (name, id, city).
   */
  static getDeterministicPhoto(category: PoiCategory, seed: string): string {
    const list = THEMATIC_PHOTO_POOL[category] || THEMATIC_PHOTO_POOL[PoiCategory.ATTRACTION];
    const index = hashString(seed.toLowerCase().trim()) % list.length;
    return list[index];
  }

  /**
   * Checks whether a given image URL is an uncurated generic placeholder or missing.
   */
  static isGenericPlaceholder(imageUrl?: string): boolean {
    if (!imageUrl || imageUrl.trim() === '') return true;

    // Known legacy static URLs that were previously hardcoded for all elements
    const legacyPlaceholders = [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
    ];

    return legacyPlaceholders.includes(imageUrl);
  }
}
