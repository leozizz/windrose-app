import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { A11yAnnouncer } from './A11yAnnouncer';

describe('A11yAnnouncer Component', () => {
  it('deve renderizar elemento com role="status" ou aria-live="polite" e classe .sr-only', () => {
    render(<A11yAnnouncer message="Carregando locais..." />);
    const announcer = screen.getByTestId('a11y-announcer');

    expect(announcer).toBeDefined();
    expect(announcer.getAttribute('aria-live')).toBe('polite');
    expect(announcer.getAttribute('aria-atomic')).toBe('true');
    expect(announcer.classList.contains('sr-only')).toBe(true);
    expect(announcer.textContent).toBe('Carregando locais...');
  });

  it('deve renderizar vazio quando nenhuma mensagem for informada', () => {
    render(<A11yAnnouncer />);
    const announcer = screen.getByTestId('a11y-announcer');

    expect(announcer).toBeDefined();
    expect(announcer.textContent).toBe('');
  });

  it('deve atualizar o texto quando a prop message for alterada', () => {
    const { rerender } = render(<A11yAnnouncer message="Você curtiu Praia da Joaquina." />);
    const announcer = screen.getByTestId('a11y-announcer');
    expect(announcer.textContent).toBe('Você curtiu Praia da Joaquina.');

    rerender(<A11yAnnouncer message="Restam 5 locais no deck." />);
    expect(announcer.textContent).toBe('Restam 5 locais no deck.');
  });
});
