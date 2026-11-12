import React from 'react';
import { Waves, Wind, AlertTriangle, Trees, Compass } from 'lucide-react';
import { BeachProfileType } from '@windrose/shared-types';

export interface BeachFilterBarProps {
  selectedFilter: BeachProfileType | 'ALL';
  onFilterChange: (filter: BeachProfileType | 'ALL') => void;
  beachCounts?: Partial<Record<BeachProfileType | 'ALL', number>>;
}

interface FilterOption {
  id: BeachProfileType | 'ALL';
  label: string;
  testId: string;
  icon: React.ReactNode;
}

export const BeachFilterBar: React.FC<BeachFilterBarProps> = ({
  selectedFilter,
  onFilterChange,
  beachCounts,
}) => {
  const options: FilterOption[] = [
    {
      id: 'ALL',
      label: 'Todas',
      testId: 'beach-filter-all',
      icon: <Compass size={14} className="filter-icon" />,
    },
    {
      id: BeachProfileType.CALM_WATERS,
      label: 'Águas Calmas',
      testId: 'beach-filter-calm',
      icon: <Waves size={14} className="filter-icon" />,
    },
    {
      id: BeachProfileType.SURF_ACTIVE,
      label: 'Surf & Ondas',
      testId: 'beach-filter-surf',
      icon: <Wind size={14} className="filter-icon" />,
    },
    {
      id: BeachProfileType.DEEP_DROP_OFF,
      label: 'Praia de Tombo',
      testId: 'beach-filter-dropoff',
      icon: <AlertTriangle size={14} className="filter-icon" />,
    },
    {
      id: BeachProfileType.WILD_RESERVED,
      label: 'Selvagens',
      testId: 'beach-filter-wild',
      icon: <Trees size={14} className="filter-icon" />,
    },
  ];

  return (
    <div
      className="beach-filter-bar"
      role="toolbar"
      aria-label="Filtro de perfil balnear"
      data-testid="beach-filter-bar"
    >
      <div className="beach-filter-scroll">
        {options.map((option) => {
          const isSelected = selectedFilter === option.id;
          const count = beachCounts ? beachCounts[option.id] : undefined;

          return (
            <button
              key={option.id}
              type="button"
              className={`beach-filter-chip ${isSelected ? 'active' : ''}`}
              onClick={() => onFilterChange(option.id)}
              aria-pressed={isSelected}
              data-testid={option.testId}
            >
              {option.icon}
              <span className="chip-label">{option.label}</span>
              {typeof count === 'number' && (
                <span className="chip-count" aria-label={`${count} disponíveis`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
