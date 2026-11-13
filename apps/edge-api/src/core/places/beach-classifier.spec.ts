import { describe, it, expect } from 'vitest';
import { BeachProfileType, CrowdLevel, PointOfInterest, PoiCategory, PoiEnvironment } from '@windrose/shared-types';
import { BeachClassifier } from './beach-classifier';

describe('BeachClassifier Domain Logic', () => {
  const createMockBeach = (name: string, tags: string[] = []): PointOfInterest => ({
    id: `poi-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    category: PoiCategory.BEACH,
    environment: PoiEnvironment.OUTDOOR,
    latitude: -27.5,
    longitude: -48.5,
    city: 'Florianópolis',
    description: 'Bela praia da região costeira.',
    imageUrl: 'https://images.unsplash.com/beach',
    tags,
  });

  describe('Classificação por Perfil de Praia (BeachProfileType)', () => {
    it('deve classificar praias com semântica de enseada/águas mansas como CALM_WATERS', () => {
      const enseada = createMockBeach('Praia da Enseada');
      const baia = createMockBeach('Baía dos Golfinhos');
      const mansa = createMockBeach('Praia Mansa');
      const lagoinha = createMockBeach('Praia da Lagoinha de Ponta das Canas');

      expect(BeachClassifier.classify(enseada).profile).toBe(BeachProfileType.CALM_WATERS);
      expect(BeachClassifier.classify(baia).profile).toBe(BeachProfileType.CALM_WATERS);
      expect(BeachClassifier.classify(mansa).profile).toBe(BeachProfileType.CALM_WATERS);
      expect(BeachClassifier.classify(lagoinha).profile).toBe(BeachProfileType.CALM_WATERS);
    });

    it('deve classificar praias de tombo ou arrebentação abrupta como DEEP_DROP_OFF', () => {
      const tombo = createMockBeach('Praia do Tombo');
      const brava = createMockBeach('Praia Brava de Itajaí');
      const itacoatiara = createMockBeach('Praia de Itacoatiara');

      expect(BeachClassifier.classify(tombo).profile).toBe(BeachProfileType.DEEP_DROP_OFF);
      expect(BeachClassifier.classify(brava).profile).toBe(BeachProfileType.DEEP_DROP_OFF);
      expect(BeachClassifier.classify(itacoatiara).profile).toBe(BeachProfileType.DEEP_DROP_OFF);
    });

    it('deve classificar praias com acesso por trilha ou áreas preservadas como WILD_RESERVED', () => {
      const trilha = createMockBeach('Praia da Trilha do Gravatá');
      const naufragados = createMockBeach('Praia dos Naufragados');
      const isolada = createMockBeach('Praia Selvagem do Sul', ['access=foot', 'trail']);

      expect(BeachClassifier.classify(trilha).profile).toBe(BeachProfileType.WILD_RESERVED);
      expect(BeachClassifier.classify(naufragados).profile).toBe(BeachProfileType.WILD_RESERVED);
      expect(BeachClassifier.classify(isolada).profile).toBe(BeachProfileType.WILD_RESERVED);
    });

    it('deve classificar praias com vocação para surf e ondas ativas como SURF_ACTIVE', () => {
      const joaquina = createMockBeach('Praia da Joaquina');
      const surfTag = createMockBeach('Praia do Meio', ['sport=surfing']);
      const maresias = createMockBeach('Praia de Maresias Surf Point');

      expect(BeachClassifier.classify(joaquina).profile).toBe(BeachProfileType.SURF_ACTIVE);
      expect(BeachClassifier.classify(surfTag).profile).toBe(BeachProfileType.SURF_ACTIVE);
      expect(BeachClassifier.classify(maresias).profile).toBe(BeachProfileType.SURF_ACTIVE);
    });
  });

  describe('Detecção de Salva-vidas (lifeguardAvailable)', () => {
    it('deve detectar presença de salva-vidas a partir de tags OSM supervised ou praias urbanas estruturadas', () => {
      const supervised = createMockBeach('Praia Central', ['supervised=yes', 'lifeguard']);
      const metadata = BeachClassifier.classify(supervised);

      expect(metadata.lifeguardAvailable).toBe(true);
    });

    it('deve indicar ausência de salva-vidas em praias selvagens e isoladas por padrão', () => {
      const selvagem = createMockBeach('Praia Deserta e Isolada', ['access=foot']);
      const metadata = BeachClassifier.classify(selvagem);

      expect(metadata.lifeguardAvailable).toBe(false);
    });
  });

  describe('Estimativa Determinística de Lotação (CrowdLevel)', () => {
    it('deve estimar BUZZING para fins de semana ensolarados e quentes em praias urbanas com quiosques', () => {
      const praiaUrbana = createMockBeach('Praia de Canasvieiras', ['quiosque', 'bar']);
      const metadata = BeachClassifier.classify(praiaUrbana, {
        isWeekend: true,
        tempMax: 31,
        isSunny: true,
      });

      expect(metadata.crowdEstimate).toBe(CrowdLevel.BUZZING);
    });

    it('deve estimar QUIET para praias de trilha/selvagens mesmo em fins de semana ensolarados', () => {
      const praiaTrilha = createMockBeach('Praia dos Naufragados', ['access=foot']);
      const metadata = BeachClassifier.classify(praiaTrilha, {
        isWeekend: true,
        tempMax: 29,
        isSunny: true,
      });

      expect(metadata.crowdEstimate).toBe(CrowdLevel.QUIET);
    });

    it('deve estimar QUIET para dias de semana com temperaturas moderadas', () => {
      const praiaUrbana = createMockBeach('Praia do Campeche');
      const metadata = BeachClassifier.classify(praiaUrbana, {
        isWeekend: false,
        tempMax: 22,
        isSunny: false,
      });

      expect(metadata.crowdEstimate).toBe(CrowdLevel.QUIET);
    });

    it('deve estimar MODERATE para condições intermediárias', () => {
      const praiaUrbana = createMockBeach('Praia dos Ingleses');
      const metadata = BeachClassifier.classify(praiaUrbana, {
        isWeekend: false,
        tempMax: 29,
        isSunny: true,
      });

      expect(metadata.crowdEstimate).toBe(CrowdLevel.MODERATE);
    });
  });
});
