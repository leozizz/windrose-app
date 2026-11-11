import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { App } from './app';

describe('App Component - Acessibilidade e Skip Link', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('deve renderizar o Skip Link apontando para #main-content com classe skip-link', () => {
    render(<App />);

    const skipLink = screen.getByTestId('skip-link');
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(skipLink.classList.contains('skip-link')).toBe(true);
    expect(skipLink.textContent).toContain('Pular para o conteúdo principal');
  });

  it('deve renderizar a tag main com id="main-content" e tabIndex=-1', () => {
    render(<App />);

    const mainElement = document.getElementById('main-content');
    expect(mainElement).not.toBeNull();
    expect(mainElement?.getAttribute('tabindex')).toBe('-1');
  });

  it('deve renderizar o A11yAnnouncer para feedback acessível de leitores de tela', () => {
    render(<App />);

    const announcer = screen.getByTestId('a11y-announcer');
    expect(announcer).toBeDefined();
    expect(announcer.getAttribute('aria-live')).toBe('polite');
  });
});
