import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { InteractiveMap } from './InteractiveMap';
import { PointOfInterest, PoiCategory, PoiEnvironment } from '@windrose/shared-types';

describe('InteractiveMap Component', () => {
  const mockPlaces: PointOfInterest[] = [
    {
      id: 'poi-1',
      name: 'Praia da Joaquina',
      category: PoiCategory.BEACH,
      environment: PoiEnvironment.OUTDOOR,
      latitude: -27.62,
      longitude: -48.44,
      city: 'Florianópolis',
      description: 'Dunas e surf',
      imageUrl: 'https://example.com/beach.jpg',
      tags: ['Praia'],
      address: 'Avenida das Rendeiras, Lagoa da Conceição',
    },
  ];

  it('deve renderizar o wrapper do mapa sem estilos inline estáticos hardcoded', () => {
    const { container } = render(<InteractiveMap places={mockPlaces} />);
    const mapWrapper = container.querySelector('.interactive-map-wrapper');
    expect(mapWrapper).toBeDefined();

    const styleAttr = mapWrapper?.getAttribute('style') || '';
    expect(styleAttr).not.toContain('position');
    expect(styleAttr).not.toContain('isolation');
    expect(styleAttr).not.toContain('border-radius');
    expect(styleAttr).not.toContain('width');
  });

  it('deve aplicar altura customizada via CSS Variable quando fornecida', () => {
    const { container } = render(<InteractiveMap places={mockPlaces} height="500px" />);
    const mapWrapper = container.querySelector('.interactive-map-wrapper');
    expect(mapWrapper?.getAttribute('style')).toContain('--map-custom-height: 500px');
  });

  it('o container do mapa interno deve possuir a classe semântica map-container-inner', () => {
    const { container } = render(<InteractiveMap places={mockPlaces} />);
    const innerMap = container.querySelector('.map-container-inner');
    expect(innerMap).toBeDefined();
    // Verifica que não há estilos inline de dimensões injetados via JSX (agora delegados à classe CSS)
    const styleAttr = innerMap?.getAttribute('style') || '';
    expect(styleAttr).not.toContain('height');
    expect(styleAttr).not.toContain('width');
  });
});
