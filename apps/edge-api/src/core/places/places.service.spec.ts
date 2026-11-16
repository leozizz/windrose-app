import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlacesService } from './places.service';
import { OverpassClient } from '../../infrastructure/places/overpass.client';
import { NominatimClient } from '../../infrastructure/places/nominatim.client';
import { WikimediaClient } from '../../infrastructure/places/wikimedia.client';
import { PoiCategory, PoiEnvironment } from '@windrose/shared-types';

describe('PlacesService Domain Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve retornar POIs curados e prioritários para cidades conhecidas (ex: Florianópolis)', async () => {
    vi.spyOn(NominatimClient, 'fetchCityPois').mockResolvedValueOnce([]);
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockResolvedValueOnce([]);

    const deck = await PlacesService.getDeckForCity('Florianópolis', -27.59, -48.54);

    expect(deck.length).toBeGreaterThanOrEqual(5);
    const joaquina = deck.find((p) => p.name.includes('Praia da Joaquina'));
    expect(joaquina).toBeDefined();
    expect(joaquina?.category).toBe(PoiCategory.BEACH);
    expect(joaquina?.environment).toBe(PoiEnvironment.OUTDOOR);
  });

  it('deve mesclar POIs do OpenStreetMap sem duplicar nomes', async () => {
    vi.spyOn(NominatimClient, 'fetchCityPois').mockResolvedValueOnce([]);
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockResolvedValueOnce([
      {
        id: 'osm-1',
        name: 'Praia da Joaquina', // Duplicado de curated
        category: PoiCategory.BEACH,
        environment: PoiEnvironment.OUTDOOR,
        latitude: -27.62,
        longitude: -48.44,
        city: 'Florianópolis',
        description: 'Descrição OSM',
        imageUrl: 'https://example.com/joaquina.jpg',
        tags: ['Praia'],
      },
      {
        id: 'osm-2',
        name: 'Mirante do Ponto de Vista',
        category: PoiCategory.ATTRACTION,
        environment: PoiEnvironment.OUTDOOR,
        latitude: -27.61,
        longitude: -48.47,
        city: 'Florianópolis',
        description: 'Mirante com vista incrível',
        imageUrl: 'https://example.com/mirante.jpg',
        tags: ['Ponto de Vista'],
      },
    ]);

    const deck = await PlacesService.getDeckForCity('Florianópolis', -27.59, -48.54);

    // Deve conter Mirante do Ponto de Vista e apenas uma instância da Joaquina
    const mirante = deck.find((p) => p.name === 'Mirante do Ponto de Vista');
    expect(mirante).toBeDefined();

    const joaquinaMatches = deck.filter((p) => p.name.toLowerCase().includes('praia da joaquina'));
    expect(joaquinaMatches).toHaveLength(1);
  });

  it('deve buscar locais reais e formatar endereços via NominatimClient para qualquer cidade', async () => {
    vi.spyOn(NominatimClient, 'fetchCityPois').mockResolvedValueOnce([
      {
        id: 'osm-nom-123',
        name: 'Memorial Árabe',
        category: PoiCategory.ATTRACTION,
        environment: PoiEnvironment.OUTDOOR,
        latitude: -25.423,
        longitude: -49.268,
        city: 'Curitiba',
        description: 'Ponto turístico real.',
        imageUrl: 'https://images.unsplash.com/photo-fallback',
        tags: ['Ponto Turístico'],
        address: 'Rua Barão de Antonina, Centro, Curitiba',
      },
    ]);
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockResolvedValueOnce([]);
    vi.spyOn(WikimediaClient, 'enrichPlace').mockResolvedValueOnce({
      summary: 'Resumo sobre o Memorial Árabe.',
      imageUrl: 'https://images.unsplash.com/photo-fallback',
    });

    const deck = await PlacesService.getDeckForCity('Curitiba', -25.42, -49.27);
    const memorial = deck.find((p) => p.name === 'Memorial Árabe');

    expect(memorial).toBeDefined();
    expect(memorial?.address).toBe('Rua Barão de Antonina, Centro, Curitiba');
  });

  it('deve utilizar fallback genérico para cidades desconhecidas quando as APIs externas falham', async () => {
    vi.spyOn(NominatimClient, 'fetchCityPois').mockResolvedValueOnce([]);
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockRejectedValueOnce(
      new Error('Overpass Gateway Timeout')
    );

    const deck = await PlacesService.getDeckForCity('CidadeFicticia', 10.0, 20.0);

    expect(deck.length).toBeGreaterThanOrEqual(4);
    expect(deck.some((p) => p.environment === PoiEnvironment.OUTDOOR)).toBe(true);
    expect(deck.some((p) => p.environment === PoiEnvironment.INDOOR)).toBe(true);
  });

  it('deve enriquecer POIs com imagem da Wikimedia quando disponível', async () => {
    vi.spyOn(NominatimClient, 'fetchCityPois').mockResolvedValueOnce([]);
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockResolvedValueOnce([
      {
        id: 'osm-museum',
        name: 'Museu Nacional de Belas Artes',
        category: PoiCategory.MUSEUM,
        environment: PoiEnvironment.INDOOR,
        latitude: -22.9,
        longitude: -43.1,
        city: 'Rio de Janeiro',
        description: 'Museu de artes',
        imageUrl: 'https://images.unsplash.com/photo-fallback',
        tags: ['Museu'],
      },
    ]);

    vi.spyOn(WikimediaClient, 'enrichPlace').mockResolvedValueOnce({
      summary: 'Resumo oficial da Wikipedia sobre o museu.',
      imageUrl: 'https://upload.wikimedia.org/museum.jpg',
    });

    const deck = await PlacesService.getDeckForCity('Rio de Janeiro', -22.9, -43.1);

    const museu = deck.find((p) => p.name === 'Museu Nacional de Belas Artes');
    expect(museu).toBeDefined();
    expect(museu?.description).toBe('Resumo oficial da Wikipedia sobre o museu.');
    expect(museu?.imageUrl).toBe('https://upload.wikimedia.org/museum.jpg');
  });

  it('deve recorrer ao pool temático determinístico quando Wikimedia não possuir foto', async () => {
    vi.spyOn(NominatimClient, 'fetchCityPois').mockResolvedValueOnce([]);
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockResolvedValueOnce([
      {
        id: 'osm-praia-rara',
        name: 'Praia Remota Secreta',
        category: PoiCategory.BEACH,
        environment: PoiEnvironment.OUTDOOR,
        latitude: -23.1,
        longitude: -44.2,
        city: 'Paraty',
        description: 'Praia isolada',
        imageUrl: undefined as unknown as string,
        tags: ['Praia'],
      },
    ]);

    vi.spyOn(WikimediaClient, 'enrichPlace').mockResolvedValueOnce({
      summary: undefined,
      imageUrl: undefined,
    });

    const deck = await PlacesService.getDeckForCity('Paraty', -23.1, -44.2);
    const praia = deck.find((p) => p.name === 'Praia Remota Secreta');

    expect(praia).toBeDefined();
    expect(praia?.imageUrl).toBeDefined();
    expect(praia?.imageUrl).toContain('images.unsplash.com');
  });

  it('deve anexar beachMetadata aos POIs da categoria BEACH', async () => {
    vi.spyOn(NominatimClient, 'fetchCityPois').mockResolvedValueOnce([]);
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockResolvedValueOnce([
      {
        id: 'osm-praia-lagoinha',
        name: 'Praia da Lagoinha',
        category: PoiCategory.BEACH,
        environment: PoiEnvironment.OUTDOOR,
        latitude: -27.4,
        longitude: -48.4,
        city: 'Florianópolis',
        description: 'Praia de águas calmas',
        imageUrl: 'https://images.unsplash.com/lagoinha.jpg',
        tags: ['Praia', 'supervised=yes'],
      },
    ]);

    const deck = await PlacesService.getDeckForCity('Florianópolis', -27.59, -48.54);
    const lagoinha = deck.find((p) => p.name === 'Praia da Lagoinha');

    expect(lagoinha).toBeDefined();
    expect(lagoinha?.beachMetadata).toBeDefined();
    expect(lagoinha?.beachMetadata?.profile).toBe('CALM_WATERS');
    expect(lagoinha?.beachMetadata?.lifeguardAvailable).toBe(true);
  });

  it('deve priorizar praias no deck quando category=BEACH for informada', async () => {
    vi.spyOn(NominatimClient, 'fetchCityPois').mockResolvedValueOnce([]);
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockResolvedValueOnce([]);

    const deck = await PlacesService.getDeckForCity(
      'Florianópolis',
      -27.59,
      -48.54,
      10,
      PoiCategory.BEACH
    );

    expect(deck.length).toBeGreaterThan(0);
    // Primeiro item deve ser da categoria BEACH se houver praias em Florianópolis
    expect(deck[0].category).toBe(PoiCategory.BEACH);
    expect(deck[0].beachMetadata).toBeDefined();
  });

  it('deve controlar concorrência em no máximo 4 workers simultâneos ao enriquecer 20 POIs', async () => {
    const mockPois = Array.from({ length: 20 }, (_, i) => ({
      id: `osm-poi-${i}`,
      name: `Atração ${i}`,
      category: PoiCategory.ATTRACTION,
      environment: PoiEnvironment.OUTDOOR,
      latitude: -27.5 + i * 0.01,
      longitude: -48.5 + i * 0.01,
      city: 'CidadeSemCuradoria',
      description: `Descrição ${i}`,
      imageUrl: 'https://images.unsplash.com/photo-fallback',
      tags: ['Ponto Turístico'],
    }));

    vi.spyOn(NominatimClient, 'fetchCityPois').mockResolvedValueOnce(mockPois);
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockResolvedValueOnce([]);

    let activeConcurrency = 0;
    let maxConcurrency = 0;

    vi.spyOn(WikimediaClient, 'enrichPlace').mockImplementation(async () => {
      activeConcurrency++;
      if (activeConcurrency > maxConcurrency) {
        maxConcurrency = activeConcurrency;
      }
      await new Promise((resolve) => setTimeout(resolve, 15));
      activeConcurrency--;
      return { summary: 'Resumo enriquecido', imageUrl: 'https://upload.wikimedia.org/img.jpg' };
    });

    const deck = await PlacesService.getDeckForCity('CidadeSemCuradoria', -27.59, -48.54, 20);

    expect(deck).toHaveLength(20);
    expect(maxConcurrency).toBeGreaterThan(0);
    expect(maxConcurrency).toBeLessThanOrEqual(4);
  });

  it('deve preservar imagens curadas ou autênticas sem invocar WikimediaClient', async () => {
    const verifiedPoi = {
      id: 'custom-poi-verified',
      name: 'Monumento Histórico Autêntico',
      category: PoiCategory.ATTRACTION,
      environment: PoiEnvironment.OUTDOOR,
      latitude: -27.59,
      longitude: -48.54,
      city: 'CidadeSemCuradoria',
      description: 'Descrição autêntica',
      imageUrl: 'https://images.unsplash.com/photo-verified-custom-12345?w=800',
      tags: ['História'],
    };

    vi.spyOn(NominatimClient, 'fetchCityPois').mockResolvedValueOnce([verifiedPoi]);
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockResolvedValueOnce([]);

    const enrichSpy = vi.spyOn(WikimediaClient, 'enrichPlace');

    const deck = await PlacesService.getDeckForCity('CidadeSemCuradoria', -27.59, -48.54, 5);

    expect(deck).toHaveLength(1);
    expect(deck[0].imageUrl).toBe('https://images.unsplash.com/photo-verified-custom-12345?w=800');
    // Para POI com imagem autêntica verificada (não-placeholder), não deve chamar WikimediaClient
    expect(enrichSpy).not.toHaveBeenCalled();
  });

  it('deve manter a ordenação estável e prioritária dos POIs após o enriquecimento concorrente', async () => {
    const mockPois = Array.from({ length: 10 }, (_, i) => ({
      id: `poi-order-${i}`,
      name: `Ordem Atração ${i}`,
      category: PoiCategory.ATTRACTION,
      environment: PoiEnvironment.OUTDOOR,
      latitude: -27.5 + i * 0.01,
      longitude: -48.5 + i * 0.01,
      city: 'CidadeSemCuradoria',
      description: `Descrição original ${i}`,
      imageUrl: 'https://images.unsplash.com/photo-fallback',
      tags: ['Ponto Turístico'],
    }));

    vi.spyOn(NominatimClient, 'fetchCityPois').mockResolvedValueOnce(mockPois);
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockResolvedValueOnce([]);

    // Respostas com tempos variados para testar que a ordem de retorno não se perde
    vi.spyOn(WikimediaClient, 'enrichPlace').mockImplementation(async (name) => {
      const idx = parseInt(name.replace('Ordem Atração ', ''), 10);
      const delay = (10 - idx) * 5; // Revert delay
      await new Promise((resolve) => setTimeout(resolve, delay));
      return { summary: `Resumo ${idx}` };
    });

    const deck = await PlacesService.getDeckForCity('CidadeSemCuradoria', -27.59, -48.54, 10);

    for (let i = 0; i < 10; i++) {
      expect(deck[i].name).toBe(`Ordem Atração ${i}`);
    }
  });
});
