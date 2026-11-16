import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WikimediaClient } from './wikimedia.client';

describe('WikimediaClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    WikimediaClient.clearCache();
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

  it('deve deduplicar requisições em voo (in-flight) disparando apenas 1 fetch para chamadas concorrentes', async () => {
    let resolveNetwork: (response: Response) => void = () => {};
    const pendingNetwork = new Promise<Response>((resolve) => {
      resolveNetwork = resolve;
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(pendingNetwork);

    const call1 = WikimediaClient.enrichPlace('Ponte Hercílio Luz', 'Florianópolis');
    const call2 = WikimediaClient.enrichPlace('Ponte Hercílio Luz', 'Florianópolis');
    const call3 = WikimediaClient.enrichPlace('Ponte Hercílio Luz', 'Florianópolis');

    resolveNetwork({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            '999': {
              title: 'Ponte Hercílio Luz',
              extract: 'Patrimônio de Florianópolis.',
              thumbnail: { source: 'https://upload.wikimedia.org/hercilio.jpg' },
            },
          },
        },
      }),
    } as Response);

    const [res1, res2, res3] = await Promise.all([call1, call2, call3]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(res1.imageUrl).toBe('https://upload.wikimedia.org/hercilio.jpg');
    expect(res2.imageUrl).toBe('https://upload.wikimedia.org/hercilio.jpg');
    expect(res3.imageUrl).toBe('https://upload.wikimedia.org/hercilio.jpg');
  });

  it('deve tratar timeout e AbortError de forma resiliente retornando objeto vazio gracioso', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new DOMException('The operation was aborted due to timeout', 'AbortError')
    );

    const result = await WikimediaClient.enrichPlace('Lugar Lento Demais', 'Florianópolis');
    expect(result).toEqual({});
  });

  it('deve aplicar cache negativo evitando novas chamadas de rede para atrações inexistentes', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ query: { pages: {} } }),
    } as Response);

    const first = await WikimediaClient.enrichPlace('Bar do Zé Desconhecido', 'Florianópolis');
    const second = await WikimediaClient.enrichPlace('Bar do Zé Desconhecido', 'Florianópolis');

    expect(first).toEqual({});
    expect(second).toEqual({});
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('deve podar retries redundantes quando a busca primária não retornar páginas', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ query: { pages: {} } }),
    } as Response);

    const result = await WikimediaClient.enrichPlace('Ponto Obscuro Sem Wikipedia', 'Curitiba');
    expect(result).toEqual({});
    // Não deve disparar retentativas (cleanName, rest summary, en) quando a busca inicial for vazia
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('deve respeitar o teto máximo de 500 entradas no cache em memória', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            '1': {
              title: 'Lugar Teste',
              extract: 'Descrição de teste.',
              thumbnail: { source: 'https://example.com/img.jpg' },
            },
          },
        },
      }),
    } as Response);

    for (let i = 0; i < 505; i++) {
      await WikimediaClient.enrichPlace(`Local ${i}`, 'Cidade');
    }

    expect(WikimediaClient.getCacheSize()).toBeLessThanOrEqual(500);
  });
});
