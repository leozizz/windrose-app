import {
  ActivityType,
  PointOfInterest,
  SharedPlaceItem,
  SharedTripPayload,
} from '@windrose/shared-types';

const MAX_HASH_PAYLOAD_BYTES = 32 * 1024; // 32 KB

/**
 * Converte string UTF-8 com suporte completo a acentuação em string binária segura para btoa.
 */
const utf8ToBinaryString = (str: string): string => {
  return encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1: string) => {
    return String.fromCharCode(parseInt(p1, 16));
  });
};

/**
 * Converte string binária gerada por atob de volta em UTF-8 com decodificação segura.
 */
const binaryStringToUtf8 = (binary: string): string => {
  const percentEncoded = Array.from(binary)
    .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
    .join('');
  return decodeURIComponent(percentEncoded);
};

/**
 * Serializa um payload canônico de viagem em string Base64 URL-safe.
 */
export const serializeTripToHash = (payload: SharedTripPayload): string => {
  const jsonString = JSON.stringify(payload);
  const binaryString = utf8ToBinaryString(jsonString);
  const base64 = btoa(binaryString);

  // Conversão para URL-Safe: substitui '+' por '-', '/' por '_' e remove padding '='
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Valida se um objeto satisfaz o contrato SharedPlaceItem e possui coordenadas válidas.
 */
const isValidSharedPlaceItem = (item: unknown): item is SharedPlaceItem => {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const record = item as Record<string, unknown>;
  const hasValidId = typeof record.id === 'string' && record.id.trim().length > 0;
  const hasValidName = typeof record.name === 'string' && record.name.trim().length > 0;
  const hasValidCategory = typeof record.category === 'string';
  const hasValidLat =
    typeof record.lat === 'number' &&
    !Number.isNaN(record.lat) &&
    record.lat >= -90 &&
    record.lat <= 90;
  const hasValidLon =
    typeof record.lon === 'number' &&
    !Number.isNaN(record.lon) &&
    record.lon >= -180 &&
    record.lon <= 180;

  return hasValidId && hasValidName && hasValidCategory && hasValidLat && hasValidLon;
};

/**
 * Deserializa defensivamente uma string de hash ou fragmento em SharedTripPayload.
 * Retorna null para payloads inválidos, corrompidos ou maliciosos sem lançar exceções.
 */
export const deserializeTripFromHash = (rawInput: string): SharedTripPayload | null => {
  if (!rawInput || typeof rawInput !== 'string') {
    return null;
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return null;
  }

  // Previne DoS descartando payloads maiores que 32 KB
  if (trimmed.length > MAX_HASH_PAYLOAD_BYTES) {
    return null;
  }

  // Remove eventuais prefixos '#trip=' ou 'trip='
  let cleanHash = trimmed;
  if (cleanHash.startsWith('#trip=')) {
    cleanHash = cleanHash.slice(6);
  } else if (cleanHash.startsWith('trip=')) {
    cleanHash = cleanHash.slice(5);
  } else if (cleanHash.startsWith('#')) {
    cleanHash = cleanHash.slice(1);
  }

  if (!cleanHash) {
    return null;
  }

  // Recompõe Base64 canônico a partir do formato URL-safe
  let base64 = cleanHash.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  // Valida caracteres permitidos em Base64
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
    return null;
  }

  try {
    const binary = atob(base64);
    const jsonString = binaryStringToUtf8(binary);
    const parsed: unknown = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const payloadObj = parsed as Record<string, unknown>;

    // Validação estrita do schema canônico
    if (payloadObj.v !== 1) {
      return null;
    }

    if (typeof payloadObj.c !== 'string' || !payloadObj.c.trim()) {
      return null;
    }

    if (!Array.isArray(payloadObj.p)) {
      return null;
    }

    // Filtra apenas atrações que atendem estritamente às validações de coordenadas e atributos
    const validPlaces: SharedPlaceItem[] = [];
    for (const place of payloadObj.p) {
      if (isValidSharedPlaceItem(place)) {
        validPlaces.push({
          id: place.id,
          name: place.name,
          category: place.category,
          lat: place.lat,
          lon: place.lon,
          ...(typeof place.rating === 'number' ? { rating: place.rating } : {}),
          ...(typeof place.address === 'string' ? { address: place.address } : {}),
          ...(typeof place.imageUrl === 'string' ? { imageUrl: place.imageUrl } : {}),
        });
      }
    }

    const result: SharedTripPayload = {
      v: 1,
      c: payloadObj.c.trim(),
      p: validPlaces,
    };

    if (typeof payloadObj.a === 'string' && Object.values(ActivityType).includes(payloadObj.a as ActivityType)) {
      result.a = payloadObj.a as ActivityType;
    }

    return result;
  } catch {
    return null;
  }
};

/**
 * Constrói a URL completa compartilhável contendo o fragmento #trip=<hash>.
 */
export const buildShareableTripUrl = (
  city: string,
  activity: ActivityType,
  likedPlaces: PointOfInterest[]
): string => {
  const sharedPlaces: SharedPlaceItem[] = likedPlaces.map((poi) => ({
    id: poi.id,
    name: poi.name,
    category: poi.category,
    lat: poi.latitude,
    lon: poi.longitude,
    ...(poi.address ? { address: poi.address } : {}),
    ...(poi.imageUrl ? { imageUrl: poi.imageUrl } : {}),
  }));

  const payload: SharedTripPayload = {
    v: 1,
    c: city,
    a: activity,
    p: sharedPlaces,
  };

  const hash = serializeTripToHash(payload);

  const baseUrl =
    typeof window !== 'undefined' && window.location && window.location.origin
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://windrose.app/';

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}`;
  return `${normalizedBase}#trip=${hash}`;
};
