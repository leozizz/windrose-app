import {
  PointOfInterest,
  BeachProfileType,
  CrowdLevel,
  BeachMetadata,
} from '@windrose/shared-types';

export interface BeachClassificationContext {
  isWeekend?: boolean;
  tempMax?: number;
  isSunny?: boolean;
  tags?: Record<string, string> | string[];
}

/**
 * Pure domain classifier that categorizes beaches by profile, lifeguard availability, and estimated crowd level ($0.00).
 */
export class BeachClassifier {
  private static normalize = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  /**
   * Classify beach point of interest based on OSM tags and semantic coastal naming patterns.
   */
  static classify = (
    poi: Partial<PointOfInterest>,
    context?: BeachClassificationContext
  ): BeachMetadata => {
    const rawName = poi.name || '';
    const nameNorm = BeachClassifier.normalize(rawName);

    const poiTags = (poi.tags || []).map((t) => BeachClassifier.normalize(t));
    const extraTags = Array.isArray(context?.tags)
      ? context.tags.map((t) => BeachClassifier.normalize(t))
      : Object.entries(context?.tags || {}).map(([k, v]) => `${BeachClassifier.normalize(k)}=${BeachClassifier.normalize(v)}`);

    const allTags = [...poiTags, ...extraTags];

    // 1. Profile classification
    let profile = BeachProfileType.CALM_WATERS;

    const hasWildPattern =
      nameNorm.includes('trilha') ||
      nameNorm.includes('selvagem') ||
      nameNorm.includes('preservada') ||
      nameNorm.includes('isolada') ||
      nameNorm.includes('secreta') ||
      nameNorm.includes('deserta') ||
      nameNorm.includes('naufragados') ||
      nameNorm.includes('lagoinha do leste') ||
      nameNorm.includes('bonete') ||
      nameNorm.includes('castelhanos') ||
      nameNorm.includes('gravata') ||
      allTags.some((t) => t.includes('access=foot') || t.includes('trail') || t.includes('nature_reserve'));

    const hasDropOffPattern =
      nameNorm.includes('tombo') ||
      nameNorm.includes('brava') ||
      nameNorm.includes('itacoatiara') ||
      nameNorm.includes('arpoador') ||
      nameNorm.includes('arrebentacao') ||
      nameNorm.includes('mole');

    const hasSurfPattern =
      nameNorm.includes('surf') ||
      nameNorm.includes('joaquina') ||
      nameNorm.includes('campeche') ||
      nameNorm.includes('matadeiro') ||
      nameNorm.includes('ferrugem') ||
      nameNorm.includes('silveira') ||
      nameNorm.includes('rosado') ||
      nameNorm.includes('maresias') ||
      allTags.some((t) => t.includes('sport=surfing') || t.includes('surfing') || t.includes('kitesurfing'));

    const hasCalmPattern =
      nameNorm.includes('enseada') ||
      nameNorm.includes('baia') ||
      nameNorm.includes('lagoinha') ||
      nameNorm.includes('mansa') ||
      nameNorm.includes('calma') ||
      nameNorm.includes('protegida') ||
      nameNorm.includes('canasvieiras') ||
      nameNorm.includes('jurere') ||
      nameNorm.includes('ingleses') ||
      nameNorm.includes('porto') ||
      allTags.some((t) => t.includes('wave=none') || t.includes('water_speed=calm'));

    if (hasWildPattern) {
      profile = BeachProfileType.WILD_RESERVED;
    } else if (hasDropOffPattern) {
      profile = BeachProfileType.DEEP_DROP_OFF;
    } else if (hasSurfPattern) {
      profile = BeachProfileType.SURF_ACTIVE;
    } else if (hasCalmPattern) {
      profile = BeachProfileType.CALM_WATERS;
    } else {
      profile = BeachProfileType.CALM_WATERS;
    }

    // 2. Lifeguard availability
    const hasSupervisedTag = allTags.some(
      (t) => t.includes('supervised=yes') || t.includes('lifeguard')
    );
    const lifeguardAvailable =
      hasSupervisedTag ||
      (!hasWildPattern && (nameNorm.includes('central') || nameNorm.includes('quiosque')));

    // 3. Deterministic crowd level estimation ($0.00)
    let crowdEstimate = CrowdLevel.QUIET;

    if (profile === BeachProfileType.WILD_RESERVED) {
      crowdEstimate = CrowdLevel.QUIET;
    } else {
      const isWeekend = context?.isWeekend ?? false;
      const tempMax = context?.tempMax ?? 24;
      const isSunny = context?.isSunny ?? true;

      const isHotAndSunny = tempMax >= 28 && isSunny;

      if (isWeekend && isHotAndSunny) {
        crowdEstimate = CrowdLevel.BUZZING;
      } else if (isWeekend || isHotAndSunny) {
        crowdEstimate = CrowdLevel.MODERATE;
      } else {
        crowdEstimate = CrowdLevel.QUIET;
      }
    }

    return {
      profile,
      crowdEstimate,
      lifeguardAvailable,
      swimmingSuitabilityScore: profile === BeachProfileType.CALM_WATERS ? 90 : 75,
    };
  };
}
