import { describe, it, expect } from 'vitest';
import { PoiCategory } from '@windrose/shared-types';
import { PhotoPoolService, THEMATIC_PHOTO_POOL } from './photo-pool.service';

describe('PhotoPoolService', () => {
  it('deve retornar foto válida do pool para todas as categorias de POI', () => {
    const categories = [
      PoiCategory.BEACH,
      PoiCategory.PARK,
      PoiCategory.MUSEUM,
      PoiCategory.RESTAURANT,
      PoiCategory.BAR,
      PoiCategory.CULTURE,
      PoiCategory.ATTRACTION,
    ];

    for (const category of categories) {
      const photo = PhotoPoolService.getDeterministicPhoto(category, 'Ponto de Teste');
      expect(photo).toBeDefined();
      expect(photo).toContain('images.unsplash.com');
      expect(THEMATIC_PHOTO_POOL[category]).toContain(photo);
    }
  });

  it('deve ser determinístico: mesmo local e cidade geram sempre a mesma foto', () => {
    const photo1 = PhotoPoolService.getDeterministicPhoto(PoiCategory.BEACH, 'Praia Mole-Florianópolis');
    const photo2 = PhotoPoolService.getDeterministicPhoto(PoiCategory.BEACH, 'Praia Mole-Florianópolis');
    expect(photo1).toBe(photo2);
  });

  it('deve distribuir fotos distintas para locais diferentes da mesma categoria', () => {
    const locaisPraia = [
      'Praia da Joaquina',
      'Praia dos Ingleses',
      'Praia do Campeche',
      'Praia de Jurerê',
      'Praia Mole',
      'Praia da Armação',
    ];

    const fotos = locaisPraia.map((local) =>
      PhotoPoolService.getDeterministicPhoto(PoiCategory.BEACH, `${local}-Floripa`)
    );

    const fotosUnicas = new Set(fotos);
    // Deve haver diversidade e não todos com a mesma imagem
    expect(fotosUnicas.size).toBeGreaterThan(1);
  });

  it('deve identificar corretamente se uma imagem é um placeholder genérico', () => {
    expect(PhotoPoolService.isGenericPlaceholder('')).toBe(true);
    expect(PhotoPoolService.isGenericPlaceholder(undefined)).toBe(true);
    expect(
      PhotoPoolService.isGenericPlaceholder(
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
      )
    ).toBe(true);
    expect(
      PhotoPoolService.isGenericPlaceholder('https://upload.wikimedia.org/custom-image.jpg')
    ).toBe(false);
  });
});
