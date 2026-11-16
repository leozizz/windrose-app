import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QrCodeSvg } from './QrCodeSvg';

describe('QrCodeSvg Component', () => {
  const sampleUrl = 'https://www.google.com/maps/search/?api=1&query=Roteiro%20Florianopolis';

  it('deve renderizar elemento SVG com role="img", aria-label e data-testid apropriados', () => {
    render(
      <QrCodeSvg
        value={sampleUrl}
        ariaLabel="QR Code para roteiro em Florianópolis"
        dataTestId="itinerary-companion-qr-svg"
      />
    );

    const svgElement = screen.getByTestId('itinerary-companion-qr-svg');
    expect(svgElement).toBeDefined();
    expect(svgElement.tagName.toLowerCase()).toBe('svg');
    expect(svgElement.getAttribute('role')).toBe('img');
    expect(svgElement.getAttribute('aria-label')).toBe('QR Code para roteiro em Florianópolis');
  });

  it('deve gerar elementos gráficos vetoriais válidos sem disparar requisições HTTP', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    render(
      <QrCodeSvg
        value={sampleUrl}
        dataTestId="itinerary-companion-qr-svg"
      />
    );

    const svgElement = screen.getByTestId('itinerary-companion-qr-svg');
    const path = svgElement.querySelector('path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('d')).toMatch(/^M\d+/);
    expect(path?.getAttribute('fill')).toBe('#0f172a');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('deve respeitar tamanho, classes CSS e atributos visuais informados via props', () => {
    render(
      <QrCodeSvg
        value={sampleUrl}
        size={140}
        className="companion-qr-svg custom-test-class"
        dataTestId="itinerary-companion-qr-svg"
      />
    );

    const svgElement = screen.getByTestId('itinerary-companion-qr-svg');
    expect(svgElement.getAttribute('width')).toBe('140');
    expect(svgElement.getAttribute('height')).toBe('140');
    expect(svgElement.getAttribute('class')).toContain('companion-qr-svg');
    expect(svgElement.getAttribute('class')).toContain('custom-test-class');
  });

  it('deve incluir margem integrada de segurança (quiet zone) no viewBox por padrão', () => {
    render(
      <QrCodeSvg
        value={sampleUrl}
        includeMargin={true}
        dataTestId="itinerary-companion-qr-svg"
      />
    );

    const svgElement = screen.getByTestId('itinerary-companion-qr-svg');
    const viewBox = svgElement.getAttribute('viewBox');
    expect(viewBox).toBeDefined();
    expect(viewBox).toMatch(/^0 0 \d+ \d+$/);
  });

  it('deve renderizar fallback amigável quando o valor fornecido for vazio', () => {
    render(
      <QrCodeSvg
        value=""
        dataTestId="itinerary-companion-qr-svg"
        fallbackTestId="qr-fallback"
      />
    );

    expect(screen.queryByTestId('itinerary-companion-qr-svg')).toBeNull();
    const fallback = screen.getByTestId('qr-fallback');
    expect(fallback).toBeDefined();
  });
});
