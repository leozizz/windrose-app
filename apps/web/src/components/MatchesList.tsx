import React, { useState } from 'react';
import { LayoutGrid, Map, ArrowLeft, Sparkles, Trash2, MapPin, Sun, Landmark, ExternalLink, Compass } from 'lucide-react';
import { PointOfInterest } from '@windrose/shared-types';
import { InteractiveMap } from './InteractiveMap';
import { formatCategory } from '../utils/labels';

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
            <div className="nav-tabs matches-nav-tabs">
              <button
                type="button"
                className={`nav-tab-btn matches-nav-tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                data-testid="matches-view-grid-tab"
              >
                <LayoutGrid size={15} className="btn-icon-start" />
                <span>Grade</span>
              </button>
              <button
                type="button"
                className={`nav-tab-btn matches-nav-tab-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                data-testid="matches-view-map-tab"
              >
                <Map size={15} className="btn-icon-start" />
                <span>Mapa</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className="action-button-secondary"
            onClick={onBackToSwipe}
            data-testid="matches-back-swipe-btn"
          >
            <ArrowLeft size={16} className="btn-icon-start" />
            <span>Continuar Explorando</span>
          </button>
          {matches.length > 0 && (
            <>
              <button
                type="button"
                className="action-button-primary"
                onClick={onGenerateItinerary}
                data-testid="matches-generate-itinerary-btn"
              >
                <Sparkles size={16} className="btn-icon-start" />
                <span>Gerar Roteiro Personalizado →</span>
              </button>
              <button
                type="button"
                className="action-button-danger"
                onClick={onClearMatches}
                title="Limpar todos os matches desta cidade"
                data-testid="matches-clear-btn"
              >
                <Trash2 size={14} className="btn-icon-start" />
                <span>Limpar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="empty-deck-card">
          <div className="empty-deck-icon">
            <Compass size={44} />
          </div>
          <h3>Nenhum local curtido ainda</h3>
          <p>Explore as atrações e dê match nos locais que você mais gostar para montar seu roteiro!</p>
          <button
            type="button"
            className="action-button-primary"
            onClick={onBackToSwipe}
            data-testid="matches-empty-explore-btn"
          >
            Começar a Explorar →
          </button>
        </div>
      ) : viewMode === 'map' ? (
        <div className="matches-map-container">
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
                  <span className="category-tag">{formatCategory(poi.category)}</span>
                </div>
              </div>
              <div className="match-card-body">
                <h3 className="match-card-title">{poi.name}</h3>
                {poi.address && (
                  <p className="match-card-address">
                    <MapPin size={13} className="address-pin-icon" />
                    <span>{poi.address}</span>
                  </p>
                )}
                <p className="match-card-desc">{poi.description}</p>
                <div className="match-card-footer">
                  <span className="environment-tag">
                    {poi.environment === 'OUTDOOR' ? (
                      <span className="match-card-environment-badge">
                        <Sun size={12} />
                        <span>Ao Ar Livre</span>
                      </span>
                    ) : (
                      <span className="match-card-environment-badge">
                        <Landmark size={12} />
                        <span>Coberto</span>
                      </span>
                    )}
                  </span>
                  {poi.website && (
                    <a
                      href={poi.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-button-secondary match-card-website-btn"
                      data-testid="match-card-website-link"
                    >
                      <span>Site</span>
                      <ExternalLink size={11} />
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
