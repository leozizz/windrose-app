import React from 'react';
import { PointOfInterest, PoiEnvironment } from '@windrose/shared-types';

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
            seu roteiro
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
                🗺️ Ver Roteiro Inteligente →
              </button>
              <button
                type="button"
                className="action-button-danger"
                onClick={onClearMatches}
                title="Limpar todos os matches desta cidade"
              >
                Limpar Lista
              </button>
            </>
          )}
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="empty-matches-card">
          <div className="empty-matches-icon">💔</div>
          <h3>Nenhum match ainda</h3>
          <p>
            Explore os cartões e clique no coração ❤️ ou deslize para a direita para salvar os lugares
            que você deseja visitar!
          </p>
          <button
            type="button"
            className="action-button-primary"
            onClick={onBackToSwipe}
          >
            Começar a Explorar
          </button>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((place) => (
            <div key={place.id} className="match-card">
              <div className="match-thumbnail-wrapper">
                <img
                  src={place.imageUrl}
                  alt={place.name}
                  className="match-thumbnail-img"
                  loading="lazy"
                />
                <span className="match-category-pill">{place.category}</span>
              </div>
              <div className="match-body">
                <div className="match-title-row">
                  <h4 className="match-name">{place.name}</h4>
                  <span
                    className={`card-env-pill ${
                      place.environment === PoiEnvironment.OUTDOOR
                        ? 'pill-outdoor'
                        : place.environment === PoiEnvironment.INDOOR
                        ? 'pill-indoor'
                        : 'pill-hybrid'
                    }`}
                  >
                    {place.environment === PoiEnvironment.OUTDOOR
                      ? 'Ao Ar Livre'
                      : place.environment === PoiEnvironment.INDOOR
                      ? 'Indoor'
                      : 'Híbrido'}
                  </span>
                </div>
                <p className="match-description">{place.description}</p>
                {place.tags && (
                  <div className="card-tags-row">
                    {place.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="card-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
