import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BeachFilterBar } from './BeachFilterBar';
import { BeachProfileType } from '@windrose/shared-types';

describe('BeachFilterBar Component', () => {
  it('deve renderizar todos os chips de filtro com seus respectivos data-testid', () => {
    render(
      <BeachFilterBar
        selectedFilter="ALL"
        onFilterChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('beach-filter-bar')).toBeDefined();
    expect(screen.getByTestId('beach-filter-all')).toBeDefined();
    expect(screen.getByTestId('beach-filter-calm')).toBeDefined();
    expect(screen.getByTestId('beach-filter-surf')).toBeDefined();
    expect(screen.getByTestId('beach-filter-dropoff')).toBeDefined();
    expect(screen.getByTestId('beach-filter-wild')).toBeDefined();
  });

  it('deve marcar o chip selecionado com classe ativa e aria-pressed', () => {
    render(
      <BeachFilterBar
        selectedFilter={BeachProfileType.CALM_WATERS}
        onFilterChange={vi.fn()}
      />
    );

    const calmBtn = screen.getByTestId('beach-filter-calm');
    expect(calmBtn.getAttribute('aria-pressed')).toBe('true');
    expect(calmBtn.className).toContain('active');

    const allBtn = screen.getByTestId('beach-filter-all');
    expect(allBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('deve disparar onFilterChange ao clicar em um chip de filtro', () => {
    const handleFilterChange = vi.fn();
    render(
      <BeachFilterBar
        selectedFilter="ALL"
        onFilterChange={handleFilterChange}
      />
    );

    const surfBtn = screen.getByTestId('beach-filter-surf');
    fireEvent.click(surfBtn);

    expect(handleFilterChange).toHaveBeenCalledTimes(1);
    expect(handleFilterChange).toHaveBeenCalledWith(BeachProfileType.SURF_ACTIVE);
  });

  it('deve exibir a contagem de praias quando beachCounts for fornecido', () => {
    render(
      <BeachFilterBar
        selectedFilter="ALL"
        onFilterChange={vi.fn()}
        beachCounts={{
          ALL: 8,
          [BeachProfileType.CALM_WATERS]: 3,
          [BeachProfileType.SURF_ACTIVE]: 2,
          [BeachProfileType.DEEP_DROP_OFF]: 1,
          [BeachProfileType.WILD_RESERVED]: 2,
        }}
      />
    );

    expect(screen.getByText('8')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });
});
