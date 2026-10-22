import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlacesService } from './places.service';
import { OverpassClient } from '../../infrastructure/places/overpass.client';
import { WikimediaClient } from '../../infrastructure/places/wikimedia.client';
import { PoiCategory, PoiEnvironment } from '@windrose/shared-types';

describe('PlacesService Domain Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve retornar POIs curados e prioritários para cidades conhecidas (ex: Florianópolis)', async () => {
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockResolvedValueOnce([]);

    const deck = await PlacesService.getDeckForCity('Florianópolis', -27.59, -48.54);

    expect(deck.length).toBeGreaterThanOrEqual(5);
    const joaquina = deck.find((p) => p.name.includes('Praia da Joaquina'));
    expect(joaquina).toBeDefined();
    expect(joaquina?.category).toBe(PoiCategory.BEACH);
    expect(joaquina?.environment).toBe(PoiEnvironment.OUTDOOR);
  });

  it('deve mesclar POIs do OpenStreetMap sem duplicar nomes', async () => {
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
        tags: ['Beach'],
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
        tags: ['Viewpoint'],
      },
    ]);

    const deck = await PlacesService.getDeckForCity('Florianópolis', -27.59, -48.54);

    // Deve conter Mirante do Ponto de Vista e apenas uma instância da Joaquina
    const mirante = deck.find((p) => p.name === 'Mirante do Ponto de Vista');
    expect(mirante).toBeDefined();

    const joaquinaMatches = deck.filter((p) => p.name.toLowerCase().includes('praia da joaquina'));
    expect(joaquinaMatches).toHaveLength(1);
  });

  it('deve utilizar fallback genérico para cidades desconhecidas quando a Overpass falha', async () => {
    vi.spyOn(OverpassClient, 'fetchNearbyPois').mockRejectedValueOnce(
      new Error('Overpass Gateway Timeout')
    );

    const deck = await PlacesService.getDeckForCity('CidadeFicticia', 10.0, 20.0);

    expect(deck.length).toBeGreaterThanOrEqual(4);
    expect(deck.some((p) => p.environment === PoiEnvironment.OUTDOOR)).toBe(true);
    expect(deck.some((p) => p.environment === PoiEnvironment.INDOOR)).toBe(true);
  });

  it('deve enriquecer POIs com imagem da Wikimedia quando disponível', async () => {
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
        tags: ['Museum'],
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
});
