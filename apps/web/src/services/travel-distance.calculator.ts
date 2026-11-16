import { TravelEstimate } from '@windrose/shared-types';

const EARTH_RADIUS_KM = 6371;
const AVERAGE_WALKING_SPEED_KMH = 4.8;
const AVERAGE_DRIVING_SPEED_KMH = 25.0;

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const isValidCoordinate = (coord: GeoCoordinate | null | undefined): boolean => {
  if (!coord) return false;
  const { latitude, longitude } = coord;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
};

const formatTimeDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${remainingMinutes} min`;
};

export class TravelDistanceCalculator {
  /**
   * Calcula a distância geodésica em quilômetros entre dois pontos usando a fórmula de Haversine pura.
   */
  static haversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    if (lat1 === lat2 && lon1 === lon2) {
      return 0;
    }

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const radLat1 = toRadians(lat1);
    const radLat2 = toRadians(lat2);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  };

  /**
   * Converte uma distância em quilômetros em estimativas de tempo em minutos para caminhada e automóvel.
   */
  static estimateTravelTimes = (
    distanceKm: number
  ): { walkingMinutes: number; drivingMinutes: number } => {
    if (distanceKm <= 0) {
      return { walkingMinutes: 1, drivingMinutes: 1 };
    }

    const walkingMinutes = Math.max(
      1,
      Math.round((distanceKm / AVERAGE_WALKING_SPEED_KMH) * 60)
    );

    const baseDriving = (distanceKm / AVERAGE_DRIVING_SPEED_KMH) * 60;
    // Buffer urbano de até 2 min para manobras, semáforos e estacionamento em trechos urbanos
    const urbanBuffer = distanceKm < 5 && distanceKm >= 0.5 ? 2 : 0;
    const drivingMinutes = Math.max(1, Math.round(baseDriving + urbanBuffer));

    return { walkingMinutes, drivingMinutes };
  };

  /**
   * Formata a distância para exibição editorial amigável (ex: "~800 m" ou "~1.2 km").
   */
  static formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      const meters = Math.max(1, Math.round(distanceKm * 1000));
      return `~${meters} m`;
    }
    const rounded = Math.round(distanceKm * 10) / 10;
    return `~${rounded} km`;
  };

  /**
   * Formata o resumo do trajeto no padrão editorial Windrose Wanderlust.
   * Exemplo: "~1.2 km • 15 min a pé / 5 min de carro" ou "~11 km • 2 h 18 min a pé / 26 min de carro"
   */
  static formatTravelSummary = (
    formattedDistance: string,
    walkingMinutes: number,
    drivingMinutes: number
  ): string => {
    const walkingText = `${formatTimeDuration(walkingMinutes)} a pé`;
    const drivingText = `${formatTimeDuration(drivingMinutes)} de carro`;
    return `${formattedDistance} • ${walkingText} / ${drivingText}`;
  };

  /**
   * Calcula o objeto completo TravelEstimate entre dois pontos geográficos.
   * Retorna null se qualquer coordenada for inválida.
   */
  static calculateTransitEstimate = (
    from: GeoCoordinate | null | undefined,
    to: GeoCoordinate | null | undefined
  ): TravelEstimate | null => {
    if (!isValidCoordinate(from) || !isValidCoordinate(to)) {
      return null;
    }

    const rawDistanceKm = TravelDistanceCalculator.haversineDistance(
      from!.latitude,
      from!.longitude,
      to!.latitude,
      to!.longitude
    );

    const distanceKm = Math.round(rawDistanceKm * 10) / 10;
    const { walkingMinutes, drivingMinutes } =
      TravelDistanceCalculator.estimateTravelTimes(rawDistanceKm);
    const formattedDistance = TravelDistanceCalculator.formatDistance(rawDistanceKm);
    const formattedSummary = TravelDistanceCalculator.formatTravelSummary(
      formattedDistance,
      walkingMinutes,
      drivingMinutes
    );

    return {
      distanceKm,
      walkingMinutes,
      drivingMinutes,
      formattedDistance,
      formattedSummary,
    };
  };
}
