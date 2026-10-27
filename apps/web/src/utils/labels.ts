import { PoiCategory, ActivityType } from '@windrose/shared-types';

export const CategoryLabels: Record<PoiCategory, string> = {
  [PoiCategory.ATTRACTION]: 'Ponto Turístico',
  [PoiCategory.BEACH]: 'Praia',
  [PoiCategory.PARK]: 'Parque & Natureza',
  [PoiCategory.MUSEUM]: 'Museu & Cultura',
  [PoiCategory.RESTAURANT]: 'Gastronomia',
  [PoiCategory.BAR]: 'Bar & Noite',
  [PoiCategory.CULTURE]: 'Cultura & Patrimônio',
};

export const ActivityLabels: Record<ActivityType, string> = {
  [ActivityType.OUTDOOR_SIGHTSEEING]: 'Passeios ao Ar Livre',
  [ActivityType.SURFING]: 'Surfe e Praia',
};

export const RecommendationLabels: Record<string, string> = {
  EXCELLENT: 'Excelente',
  GOOD: 'Muito Bom',
  FAIR: 'Moderado',
  POOR: 'Desfavorável',
};

export function formatCategory(category?: PoiCategory | string): string {
  if (!category) return 'Atração';
  return CategoryLabels[category as PoiCategory] || category;
}

export function formatActivity(activity?: ActivityType | string): string {
  if (!activity) return 'Passeios ao Ar Livre';
  return ActivityLabels[activity as ActivityType] || activity;
}

export function formatRecommendation(level?: string): string {
  if (!level) return 'Favorável';
  return RecommendationLabels[level.toUpperCase()] || level;
}
