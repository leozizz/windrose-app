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
            <div className="nav-tabs" style={{ padding: '0.2rem', boxShadow: 'none' }}>
              <button
                type="button"
                className={`nav-tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={15} style={{ marginRight: '6px' }} />
                <span>Grade</span>
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${viewMode === 'map' ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}
                onClick={() => setViewMode('map')}
              >
                <Map size={15} style={{ marginRight: '6px' }} />
                <span>Mapa</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className="action-button-secondary"
            onClick={onBackToSwipe}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            <span>Continuar Explorando</span>
          </button>
          {matches.length > 0 && (
            <>
              <button
                type="button"
                className="action-button-primary"
                onClick={onGenerateItinerary}
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                <Sparkles size={16} style={{ marginRight: '6px' }} />
                <span>Gerar Roteiro Personalizado →</span>
              </button>
              <button
                type="button"
                className="action-button-danger"
                onClick={onClearMatches}
                title="Limpar todos os matches desta cidade"
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                <Trash2 size={14} style={{ marginRight: '4px' }} />
                <span>Limpar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="empty-deck-card">
          <div className="empty-deck-icon">
            <Compass size={44} style={{ color: 'var(--primary)' }} />
          </div>
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
                  <span className="category-tag">{formatCategory(poi.category)}</span>
                </div>
              </div>
              <div className="match-card-body">
                <h3 className="match-card-title">{poi.name}</h3>
                {poi.address && (
                  <p className="match-card-address">
                    <MapPin size={13} style={{ flexShrink: 0, opacity: 0.9 }} />
                    <span>{poi.address}</span>
                  </p>
                )}
                <p className="match-card-desc">{poi.description}</p>
                <div className="match-card-footer">
                  <span className="environment-tag">
                    {poi.environment === 'OUTDOOR' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Sun size={12} />
                        <span>Ao Ar Livre</span>
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
                      className="action-button-secondary"
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
