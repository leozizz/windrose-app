import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { App } from './app';
import { apiClient } from '../services/api.client';
import { ActivityType, ActivityRankingResult, WeatherAlert } from '@windrose/shared-types';

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

  describe('Aba de Previsão 7 Dias com Alertas Meteorológicos', () => {
    const mockAlert: WeatherAlert = {
      id: 'alert-rain-2026-11-20',
      type: 'RAIN_SURGE',
      severity: 'WARNING',
      title: 'Salto repentino para chuva forte',
      description: 'Probabilidade de chuva salta de 10% para 85%',
      date: '2026-11-20',
      previousDate: '2026-11-19',
      metricDelta: {
        from: 10,
        to: 85,
        unit: '%',
      },
      recommendation: 'Leve guarda-chuva ou capa e prepare opções de passeio em locais cobertos.',
    };

    const mockRanking: ActivityRankingResult = {
      locationName: 'Florianópolis',
      latitude: -27.59,
      longitude: -48.54,
      activity: ActivityType.OUTDOOR_SIGHTSEEING,
      overallScore: 78,
      recommendationLevel: 'GOOD',
      alerts: [mockAlert],
      dailyScores: [
        {
          date: '2026-11-19',
          score: 85,
          recommendationLevel: 'EXCELLENT',
          reasons: ['Tempo ensolarado e seco'],
        },
        {
          date: '2026-11-20',
          score: 45,
          recommendationLevel: 'FAIR',
          reasons: ['Pancadas de chuva à tarde'],
          alerts: [mockAlert],
        },
      ],
    };

    it('deve exibir o banner de alertas e a badge nos cards impactados na aba de previsão', async () => {
      vi.spyOn(apiClient, 'getRanking').mockResolvedValue(mockRanking);
      vi.spyOn(apiClient, 'getPlacesDeck').mockResolvedValue({
        city: 'Florianópolis',
        coordinates: { lat: -27.59, lon: -48.54 },
        total: 0,
        deck: [],
      });

      render(<App />);

      // Busca por Florianópolis
      const searchInput = screen.getByTestId('header-search-input');
      const searchBtn = screen.getByTestId('header-search-btn');
      fireEvent.change(searchInput, { target: { value: 'Florianópolis' } });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(screen.getByText('Florianópolis')).toBeDefined();
      });

      // Alterna para a aba Previsão
      const weatherTabBtn = screen.getByTestId('tab-weather');
      fireEvent.click(weatherTabBtn);

      // Deve renderizar o banner de alerta no topo da aba Previsão
      const banner = await screen.findByTestId('weather-alert-banner');
      expect(banner).toBeDefined();
      expect(within(banner).getByText('Salto repentino para chuva forte')).toBeDefined();

      // Deve exibir badge no card do dia 2026-11-20
      const alertBadges = screen.getAllByTestId('daily-weather-alert-badge');
      expect(alertBadges.length).toBeGreaterThanOrEqual(1);
      expect(alertBadges[0].textContent).toContain('Salto repentino para chuva forte');
    });
  });

  describe('Compartilhamento e Hidratação de Roteiro via Hash da URL (Issue #52)', () => {
    it('deve hidratar a sessão, ativar a aba de roteiro e exibir banner editorial quando hash válido estiver presente', async () => {
      // Simula hash da URL com viagem para Ubatuba
      const validHash =
        '#trip=eyJ2IjoxLCJjIjoiVWJhdHViYSIsImEiOiJTVVJGSU5HIiwicCI6W3siaWQiOiJwb2ktMSIsIm5hbWUiOiJQcmFpYSBkbyBGw6lsaXgiLCJjYXRlZ29yeSI6IkJFQUNIIiwibGF0IjotMjMuMzg4LCJsb24iOi00NC45NzV9XX0';
      window.location.hash = validHash;

      const mockRankingUbatuba: ActivityRankingResult = {
        locationName: 'Ubatuba',
        latitude: -23.388,
        longitude: -44.975,
        activity: ActivityType.SURFING,
        overallScore: 82,
        recommendationLevel: 'EXCELLENT',
        dailyScores: [
          {
            date: '2026-11-20',
            score: 85,
            recommendationLevel: 'EXCELLENT',
            reasons: ['Ondas consistentes'],
          },
        ],
      };

      vi.spyOn(apiClient, 'getRanking').mockResolvedValue(mockRankingUbatuba);
      vi.spyOn(apiClient, 'getPlacesDeck').mockResolvedValue({
        city: 'Ubatuba',
        coordinates: { lat: -23.388, lon: -44.975 },
        total: 1,
        deck: [],
      });

      render(<App />);

      // Verifica exibição do banner editorial
      const banner = await screen.findByTestId('shared-trip-banner');
      expect(banner).toBeDefined();
      expect(banner.textContent).toContain('Ubatuba');

      // Botão de fechar banner
      const dismissBtn = screen.getByTestId('shared-trip-banner-dismiss');
      fireEvent.click(dismissBtn);
      expect(screen.queryByTestId('shared-trip-banner')).toBeNull();

      // Não deve cair no empty state de matches
      await waitFor(() => {
        expect(screen.queryByText(/Dê Match nos seus pontos favoritos/i)).toBeNull();
        expect(screen.getByText('Praia do Félix')).toBeDefined();
      });

      // Limpa hash
      window.location.hash = '';
    });

    it('deve limpar hash corrompido via replaceState e não quebrar a aplicação', () => {
      window.location.hash = '#trip=invalido_corrompido!!!';
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

      render(<App />);

      expect(replaceStateSpy).toHaveBeenCalled();
      expect(screen.queryByTestId('shared-trip-banner')).toBeNull();
      // Aplicação renderizada normalmente
      expect(screen.getByTestId('skip-link')).toBeDefined();

      window.location.hash = '';
    });
  });
});
