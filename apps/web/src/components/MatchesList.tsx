import React, { useState } from 'react';
import { PointOfInterest } from '@windrose/shared-types';
import { InteractiveMap } from './InteractiveMap';

interface MatchesListProps {
  city: string;
  matches: PointOfInterest[];
  onBackToSwipe: () => void;
  onClearMatches: () => void;
  onGenerateItinerary: () => void;
}

export const MatchesList: React.FC<MatchesListProps> = ({
  city,
  matches,
  onBackToSwipe,
  onClearMatches,
  onGenerateItinerary,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  return (
    <div className="matches-container">
      <div className="matches-header">
        <div>
          <h2 className="matches-title">Seus Matches em {city}</h2>
          <p className="matches-subtitle">
            {matches.length} {matches.length === 1 ? 'local selecionado' : 'locais selecionados'} para
            seu roteiro inteligente
          </p>
        </div>
        <div className="matches-actions-group">
          {matches.length > 0 && (
            <div className="nav-tabs" style={{ padding: '0.2rem', boxShadow: 'none' }}>
              <button
                type="button"
                className={`nav-tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => setViewMode('grid')}
              >
                🖼️ Grade
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${viewMode === 'map' ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => setViewMode('map')}
              >
                🗺️ Mapa
              </button>
            </div>
          )}

          <button
            type="button"
            className="action-button-secondary"
            onClick={onBackToSwipe}
          >
            ← Continuar Explorando
          </button>
          {matches.length > 0 && (
            <>
              <button
                type="button"
                className="action-button-primary"
                onClick={onGenerateItinerary}
              >
                ✨ Gerar Roteiro Editorial →
              </button>
              <button
                type="button"
                className="action-button-danger"
                onClick={onClearMatches}
                title="Limpar todos os matches desta cidade"
              >
                Limpar
              </button>
            </>
          )}
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="empty-deck-card">
          <div className="empty-deck-icon">🏖️</div>
          <h3>Nenhum local curtido ainda</h3>
          <p>Explore as atrações e dê match nos locais que você mais gostar para montar seu roteiro!</p>
          <button
            type="button"
            className="action-button-primary"
            onClick={onBackToSwipe}
          >
            Começar a Explorar →
          </button>
        </div>
      ) : viewMode === 'map' ? (
        <div style={{ marginTop: '1rem' }}>
          <InteractiveMap places={matches} height="520px" />
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((poi) => (
            <div key={poi.id} className="match-card">
              <div className="match-card-image-wrapper">
                <img
                  src={poi.imageUrl}
                  alt={poi.name}
                  className="match-card-image"
                  loading="lazy"
                />
                <div className="card-top-badges">
                  <span className="category-tag">{poi.category}</span>
                </div>
              </div>
              <div className="match-card-body">
                <h3 className="match-card-title">{poi.name}</h3>
                {poi.address && (
                  <p className="match-card-address">
                    <span>📍</span> {poi.address}
                  </p>
                )}
                <p className="match-card-desc">{poi.description}</p>
                <div className="match-card-footer">
                  <span className="environment-tag">
                    {poi.environment === 'OUTDOOR' ? '☀️ Ao Ar Livre' : '🏛️ Coberto'}
                  </span>
                  {poi.website && (
                    <a
                      href={poi.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-button-secondary"
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      Site ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
