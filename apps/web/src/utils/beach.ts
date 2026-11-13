import {
  BeachProfileType,
  CrowdLevel,
  WaveSafetyCondition,
} from '@windrose/shared-types';

export const BeachProfileLabels: Record<BeachProfileType, string> = {
  [BeachProfileType.CALM_WATERS]: 'Águas Calmas',
  [BeachProfileType.SURF_ACTIVE]: 'Surf & Ondas',
  [BeachProfileType.DEEP_DROP_OFF]: 'Praia de Tombo',
  [BeachProfileType.WILD_RESERVED]: 'Praia Selvagem',
};

export const BeachProfileDescriptions: Record<BeachProfileType, string> = {
  [BeachProfileType.CALM_WATERS]: 'Enseadas abrigadas e mar manso, ideal para famílias e crianças.',
  [BeachProfileType.SURF_ACTIVE]: 'Mar aberto com boa formação de ondas para surf e esportes náuticos.',
  [BeachProfileType.DEEP_DROP_OFF]: 'Declive acentuado e arrebentação forte próxima à faixa de areia.',
  [BeachProfileType.WILD_RESERVED]: 'Preservação natural com acesso por trilha e recantos isolados.',
};

export const CrowdLevelLabels: Record<CrowdLevel, string> = {
  [CrowdLevel.QUIET]: 'Tranquila',
  [CrowdLevel.MODERATE]: 'Movimento Moderado',
  [CrowdLevel.BUZZING]: 'Movimentada',
};

export const CrowdLevelDescriptions: Record<CrowdLevel, string> = {
  [CrowdLevel.QUIET]: 'Pouca movimentação e atmosfera tranquila.',
  [CrowdLevel.MODERATE]: 'Frequência agradável e equilibrada de banhistas.',
  [CrowdLevel.BUZZING]: 'Orla animada com alta concentração de frequentadores e quiosques.',
};

export const getBeachProfileLabel = (profile?: BeachProfileType): string => {
  if (!profile) return 'Praia';
  return BeachProfileLabels[profile] || 'Praia';
};

export const getBeachProfileDescription = (profile?: BeachProfileType): string => {
  if (!profile) return '';
  return BeachProfileDescriptions[profile] || '';
};

export const getCrowdLevelLabel = (crowd?: CrowdLevel): string => {
  if (!crowd) return 'Moderado';
  return CrowdLevelLabels[crowd] || 'Moderado';
};

export const getWaveSafetyInfo = (
  waveConditions?: WaveSafetyCondition
): { label: string; isSafe: boolean; warning?: string } => {
  if (!waveConditions) {
    return {
      label: 'Condição Normal',
      isSafe: true,
    };
  }

  const { safeForSwimming, heightMeters, safetyWarning } = waveConditions;

  if (!safeForSwimming) {
    return {
      label: heightMeters >= 2.0 ? 'Mar Revolto' : 'Arrebentação Forte',
      isSafe: false,
      warning:
        safetyWarning ||
        `Atenção: ondas de ${heightMeters.toFixed(1)}m. Banho recreativo desaconselhado.`,
    };
  }

  if (heightMeters <= 0.8) {
    return {
      label: 'Mar Calmo',
      isSafe: true,
    };
  }

  return {
    label: 'Mar Favorável',
    isSafe: true,
  };
};
