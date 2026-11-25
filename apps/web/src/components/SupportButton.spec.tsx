import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SupportButton } from './SupportButton';

describe('SupportButton', () => {
  it('deve renderizar botão com ícone de café, texto "Apoiar com Pix" e atributos acessíveis', () => {
    render(<SupportButton />);

    const button = screen.getByTestId('support-floating-button');
    expect(button).toBeDefined();
    expect(button.textContent).toContain('Apoiar com Pix');
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('não deve renderizar nada quando enablePix for false', () => {
    render(<SupportButton enablePix={false} />);
    expect(screen.queryByTestId('support-floating-button')).toBeNull();
  });

  it('deve aplicar classe de deslocamento acima da navegação mobile quando hasActiveCity for true', () => {
    render(<SupportButton hasActiveCity={true} />);

    const button = screen.getByTestId('support-floating-button');
    expect(button.classList.contains('support-floating-btn--above-nav')).toBe(true);
  });

  it('não deve aplicar classe de deslocamento quando hasActiveCity for false', () => {
    render(<SupportButton hasActiveCity={false} />);

    const button = screen.getByTestId('support-floating-button');
    expect(button.classList.contains('support-floating-btn--above-nav')).toBe(false);
  });

  it('deve abrir o SupportModal ao clicar e fechar ao acionar o botão de fechar', () => {
    render(<SupportButton />);

    const button = screen.getByTestId('support-floating-button');
    expect(screen.queryByTestId('support-modal')).toBeNull();

    fireEvent.click(button);
    expect(screen.getByTestId('support-modal')).toBeDefined();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByTestId('support-modal-close'));
    expect(screen.queryByTestId('support-modal')).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
