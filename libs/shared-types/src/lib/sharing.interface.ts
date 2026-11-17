import { ActivityType } from './activity.enum';

/**
 * Representação mínima de uma atração para serialização compacta na URL.
 */
export interface SharedPlaceItem {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  rating?: number;
  address?: string;
  imageUrl?: string;
}

/**
 * Payload canônico versionado para compartilhamento estático de viagens via URL Hash.
 */
export interface SharedTripPayload {
  /** Versão do schema de compartilhamento (ex: 1) para migrações futuras */
  v: number;
  /** Nome da cidade/destino da viagem */
  c: string;
  /** Tipo de atividade selecionada no momento do planejamento */
  a?: ActivityType;
  /** Lista compacta de locais de interesse curtidos */
  p: SharedPlaceItem[];
}
