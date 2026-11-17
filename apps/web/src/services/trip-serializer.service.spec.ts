import { describe, it, expect } from 'vitest';
import {
  serializeTripToHash,
  deserializeTripFromHash,
  buildShareableTripUrl,
} from './trip-serializer.service';
import {
  ActivityType,
  PoiCategory,
  PoiEnvironment,
  PointOfInterest,
  SharedTripPayload,
} from '@windrose/shared-types';

describe('TripSerializerService', () => {
  const samplePayload: SharedTripPayload = {
    v: 1,
    c: 'Ubatuba',
    a: ActivityType.BEACH_DAY,
    p: [
      {
        id: 'poi-1',
        name: 'Praia do Félix',
        category: 'BEACH',
        lat: -23.388,
        lon: -44.975,
        rating: 4.8,
        address: 'Ubatuba - SP',
      },
      {
        id: 'poi-2',
        name: 'Mirante da Praia Grande',
        category: 'ATTRACTION',
        lat: -23.471,
        lon: -45.068,
      },
    ],
  };

  it('deve serializar e deserializar com fidelidade profunda (roundtrip)', () => {
    const hash = serializeTripToHash(samplePayload);
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');

    const deserialized = deserializeTripFromHash(hash);
    expect(deserialized).toEqual(samplePayload);
  });

  it('deve preservar com precisão caracteres acentuados em português e símbolos', () => {
    const payloadWithAccents: SharedTripPayload = {
      v: 1,
      c: 'São Paulo',
      a: ActivityType.OUTDOOR_SIGHTSEEING,
      p: [
        {
          id: 'poi-br-1',
          name: 'Praça da Sé & Catedral Metropolitana',
          category: 'CULTURE',
          lat: -23.5505,
          lon: -46.6333,
          address: 'Praça da Sé, s/n - Centro Histórico',
        },
        {
          id: 'poi-br-2',
          name: 'Café & Açúcar do Bixiga',
          category: 'RESTAURANT',
          lat: -23.558,
          lon: -46.645,
        },
      ],
    };

    const hash = serializeTripToHash(payloadWithAccents);
    const result = deserializeTripFromHash(hash);

    expect(result).not.toBeNull();
    expect(result?.c).toBe('São Paulo');
    expect(result?.p[0].name).toBe('Praça da Sé & Catedral Metropolitana');
    expect(result?.p[1].name).toBe('Café & Açúcar do Bixiga');
  });

  it('deve gerar hash estritamente URL-safe sem caracteres +, / ou =', () => {
    const hash = serializeTripToHash(samplePayload);

    expect(hash).not.toContain('+');
    expect(hash).not.toContain('/');
    expect(hash).not.toContain('=');
    expect(hash).not.toMatch(/[\s?&#]/);
  });

  it('deve construir URL compartilhável completa contendo o fragmento #trip=', () => {
    const pois: PointOfInterest[] = [
      {
        id: 'poi-1',
        name: 'Praia de Maresias',
        category: PoiCategory.BEACH,
        environment: PoiEnvironment.OUTDOOR,
        latitude: -23.791,
        longitude: -45.556,
        city: 'São Sebastião',
        description: 'Praia famosa de surfe',
        imageUrl: 'https://example.com/beach.jpg',
        tags: ['Surf'],
      },
    ];

    const shareUrl = buildShareableTripUrl(
      'São Sebastião',
      ActivityType.SURFING,
      pois
    );

    expect(shareUrl).toContain('#trip=');
    const hashPart = shareUrl.split('#trip=')[1];
    expect(hashPart).toBeTruthy();

    const restored = deserializeTripFromHash(hashPart);
    expect(restored).not.toBeNull();
    expect(restored?.c).toBe('São Sebastião');
    expect(restored?.a).toBe(ActivityType.SURFING);
    expect(restored?.p).toHaveLength(1);
    expect(restored?.p[0].id).toBe('poi-1');
    expect(restored?.p[0].name).toBe('Praia de Maresias');
  });

  it('deve aceitar hash com ou sem prefixo "#trip=" ou "trip="', () => {
    const hash = serializeTripToHash(samplePayload);

    const fromHashOnly = deserializeTripFromHash(hash);
    const fromPrefix1 = deserializeTripFromHash(`#trip=${hash}`);
    const fromPrefix2 = deserializeTripFromHash(`trip=${hash}`);

    expect(fromHashOnly).toEqual(samplePayload);
    expect(fromPrefix1).toEqual(samplePayload);
    expect(fromPrefix2).toEqual(samplePayload);
  });

  it('deve retornar null de forma defensiva para entradas vazias ou nulas', () => {
    expect(deserializeTripFromHash('')).toBeNull();
    expect(deserializeTripFromHash('#trip=')).toBeNull();
    expect(deserializeTripFromHash('   ')).toBeNull();
  });

  it('deve retornar null para Base64 corrompido ou JSON malformado sem lançar exceção', () => {
    expect(deserializeTripFromHash('hash_invalido_totalmente_corrompido!!!')).toBeNull();
    // Base64 decodificável mas que não é JSON
    const notJsonBase64 = 'bm90IGEganNvbg';
    expect(deserializeTripFromHash(notJsonBase64)).toBeNull();
  });

  it('deve retornar null para payload com schema inválido ou campos obrigatórios faltantes', () => {
    // Falta versão
    const invalidSchema1 = 'eyJjIjoiUmlvIGRlIEphbmVpcm8iLCJwIjpbXX0'; // { c: "Rio de Janeiro", p: [] }
    expect(deserializeTripFromHash(invalidSchema1)).toBeNull();

    // Versão incompatível
    const futureVersion = 'eyJ2IjoyLCJjIjoiUmlvIiwicCI6W119'; // { v: 2, c: "Rio", p: [] }
    expect(deserializeTripFromHash(futureVersion)).toBeNull();

    // Falta cidade ou não é string
    const invalidCity = 'eyJ2IjoxLCJjIjoxMjMsInAiOltdfQ'; // { v: 1, c: 123, p: [] }
    expect(deserializeTripFromHash(invalidCity)).toBeNull();

    // Falta lista de locais
    const noPlaces = 'eyJ2IjoxLCJjIjoiUmlvIn0'; // { v: 1, c: "Rio" }
    expect(deserializeTripFromHash(noPlaces)).toBeNull();
  });

  it('deve descartar itens de atrações com coordenadas inválidas ou campos essenciais ausentes', () => {
    const payloadWithInvalidCoords: SharedTripPayload = {
      v: 1,
      c: 'Ubatuba',
      p: [
        {
          id: 'valid-poi',
          name: 'Praia Válida',
          category: 'BEACH',
          lat: -23.4,
          lon: -45.0,
        },
        {
          id: 'invalid-poi-lat',
          name: 'Coordenada Inválida',
          category: 'BEACH',
          lat: NaN,
          lon: -45.0,
        },
        {
          id: 'out-of-bounds-poi',
          name: 'Fora do Globo',
          category: 'BEACH',
          lat: 150, // Maior que 90
          lon: -45.0,
        },
      ],
    };

    const hash = serializeTripToHash(payloadWithInvalidCoords);
    const restored = deserializeTripFromHash(hash);

    expect(restored).not.toBeNull();
    expect(restored?.p).toHaveLength(1);
    expect(restored?.p[0].id).toBe('valid-poi');
  });

  it('deve rejeitar payloads maiores que 32 KB defensivamente para prevenir DoS', () => {
    const oversizedString = 'A'.repeat(33 * 1024);
    expect(deserializeTripFromHash(oversizedString)).toBeNull();
  });
});
