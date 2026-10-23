import React from 'react';
import { PointOfInterest } from '@windrose/shared-types';

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
