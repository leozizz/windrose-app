import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WikimediaClient } from './wikimedia.client';

describe('WikimediaClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve enriquecer atração buscando via Wikimedia Search API com resolução 800px+', async () => {
    const mockSearchResponse = {
      query: {
        pages: {
          '12345': {
            pageid: 12345,
            title: 'Praia da Joaquina',
            extract: 'A Praia da Joaquina é uma praia oceânica da cidade de Florianópolis.',
            thumbnail: {
              source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/800px-Praia_da_Joaquina.jpg',
              width: 800,
              height: 533,
            },
          },
        },
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse,
    } as Response);

    const result = await WikimediaClient.enrichPlace('Praia da Joaquina', 'Florianópolis');

    expect(result.summary).toContain('Praia da Joaquina é uma praia oceânica');
    expect(result.imageUrl).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/800px-Praia_da_Joaquina.jpg'
    );
    expect(result.source).toBe('wikimedia-search');
  });

  it('deve usar cache em memória para consultas repetidas do mesmo local', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            '999': {
              title: 'Ponte Hercílio Luz',
              extract: 'Patrimônio histórico.',
              thumbnail: { source: 'https://upload.wikimedia.org/ponte.jpg' },
            },
          },
        },
      }),
    } as Response);

    const firstCall = await WikimediaClient.enrichPlace('Ponte Hercílio Luz', 'Florianópolis');
    const secondCall = await WikimediaClient.enrichPlace('Ponte Hercílio Luz', 'Florianópolis');

    expect(firstCall.imageUrl).toBe('https://upload.wikimedia.org/ponte.jpg');
    expect(secondCall.imageUrl).toBe('https://upload.wikimedia.org/ponte.jpg');
    // Deve chamar fetch apenas uma vez devido ao cache
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('deve retornar objeto vazio gracioso quando nenhuma página for encontrada', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ query: { pages: {} } }),
    } as Response);

    const result = await WikimediaClient.enrichPlace('Lugar Inexistente No Mundo 999');
    expect(result.imageUrl).toBeUndefined();
    expect(result.summary).toBeUndefined();
  });
});
