import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PointOfInterest, PoiEnvironment } from '@windrose/shared-types';

interface SwipeDeckProps {
  places: PointOfInterest[];
  isSwiped: (poiId: string) => boolean;
  onSwipe: (poi: PointOfInterest, action: 'liked' | 'rejected') => void;
  onUndo: () => void;
  canUndo: boolean;
  onViewMatches: () => void;
  totalLikes: number;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  places,
  isSwiped,
  onSwipe,
  onUndo,
  canUndo,
  onViewMatches,
  totalLikes,
}) => {
  // Filter out places that have already been swiped in this session
  const remainingPlaces = places.filter((p) => !isSwiped(p.id));
  const currentCard = remainingPlaces[0];
  const nextCard = remainingPlaces[1];

  // Drag interaction state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - startPos.current.x;
      const deltaY = clientY - startPos.current.y;
      setDragOffset({ x: deltaX, y: deltaY });
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;
    if (dragOffset.x > threshold && currentCard) {
      onSwipe(currentCard, 'liked');
    } else if (dragOffset.x < -threshold && currentCard) {
      onSwipe(currentCard, 'rejected');
    }

    setDragOffset({ x: 0, y: 0 });
  }, [isDragging, dragOffset.x, currentCard, onSwipe]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleTouchMove);
      window.addEventListener('mouseup', handleTouchEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleTouchMove);
      window.removeEventListener('mouseup', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard) return;
      if (e.key === 'ArrowRight') {
        onSwipe(currentCard, 'liked');
      } else if (e.key === 'ArrowLeft') {
        onSwipe(currentCard, 'rejected');
      } else if ((e.key === 'z' || e.key === 'Z') && canUndo) {
        onUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, canUndo, onSwipe, onUndo]);

  const rotation = dragOffset.x * 0.08;
  const likeOpacity = Math.min(1, Math.max(0, dragOffset.x / 80));
  const rejectOpacity = Math.min(1, Math.max(0, -dragOffset.x / 80));

  if (!currentCard) {
    return (
      <div className="empty-deck-card" role="region" aria-label="Deck concluído">
        <div className="empty-deck-icon">✨</div>
        <h3 className="empty-deck-title">Você explorou todos os lugares!</h3>
        <p className="empty-deck-text">
          Você curtiu <strong>{totalLikes}</strong> atrações e locais nesta cidade.
        </p>
        <div className="empty-deck-actions">
          {canUndo && (
            <button type="button" className="action-button-undo" onClick={onUndo}>
              ⏪ Desfazer Última
            </button>
          )}
          <button
            type="button"
            className="action-button-primary"
            onClick={onViewMatches}
          >
            Ver Meus Matches ({totalLikes}) →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="swipe-deck-container" role="region" aria-label="Deck de Descoberta de Locais">
      <div className="deck-progress-bar">
        <span>Lugares restantes: {remainingPlaces.length}</span>
        <button
          type="button"
          className="badge-matches-button"
          onClick={onViewMatches}
        >
          ❤️ {totalLikes} {totalLikes === 1 ? 'Match' : 'Matches'}
        </button>
      </div>

      <div className="deck-stage">
        {/* Next Card underneath for depth */}
        {nextCard && (
          <div className="swipe-card card-underneath" aria-hidden="true">
            <div
              className="card-media-background"
              style={{ backgroundImage: `url(${nextCard.imageUrl})` }}
            />
            <div className="card-gradient-overlay" />
            <div className="card-content">
              <span className="card-category-pill">{nextCard.category}</span>
              <h3 className="card-title">{nextCard.name}</h3>
            </div>
          </div>
        )}

        {/* Top Active Card */}
        <div
          className={`swipe-card card-active ${isDragging ? 'is-dragging' : ''}`}
          style={{
            transform: `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.4}px, 0) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
          }}
          onMouseDown={handleTouchStart}
          onTouchStart={handleTouchStart}
          role="article"
          aria-label={`${currentCard.name}, ${currentCard.category}`}
        >
          <div
            className="card-media-background"
            style={{ backgroundImage: `url(${currentCard.imageUrl})` }}
          />
          <div className="card-gradient-overlay" />

          {/* Swipe Action Visual Stamps */}
          <div
            className="swipe-stamp stamp-like"
            style={{ opacity: likeOpacity }}
            aria-hidden="true"
          >
            MATCH ❤️
          </div>
          <div
            className="swipe-stamp stamp-reject"
            style={{ opacity: rejectOpacity }}
            aria-hidden="true"
          >
            PASSAR ❌
          </div>

          <div className="card-content">
            <div className="card-badges-row">
              <span className="card-category-pill">{currentCard.category}</span>
              <span
                className={`card-env-pill ${
                  currentCard.environment === PoiEnvironment.OUTDOOR
                    ? 'pill-outdoor'
                    : currentCard.environment === PoiEnvironment.INDOOR
                    ? 'pill-indoor'
                    : 'pill-hybrid'
                }`}
              >
                {currentCard.environment === PoiEnvironment.OUTDOOR
                  ? '🌲 Ao Ar Livre'
                  : currentCard.environment === PoiEnvironment.INDOOR
                  ? '🏛️ Coberto (Indoor)'
                  : '✨ Híbrido'}
              </span>
            </div>

            <h3 className="card-title">{currentCard.name}</h3>
            <p className="card-description">{currentCard.description}</p>

            {currentCard.tags && currentCard.tags.length > 0 && (
              <div className="card-tags-row">
                {currentCard.tags.map((tag) => (
                  <span key={tag} className="card-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accessible Action Buttons */}
      <div className="swipe-controls">
        <button
          type="button"
          className="control-btn btn-reject"
          aria-label="Rejeitar este local"
          title="Passar (Seta Esquerda)"
          onClick={() => onSwipe(currentCard, 'rejected')}
        >
          ❌
        </button>

        <button
          type="button"
          className="control-btn btn-undo"
          aria-label="Desfazer última escolha"
          title="Desfazer (Z)"
          disabled={!canUndo}
          onClick={onUndo}
        >
          ⏪
        </button>

        <button
          type="button"
          className="control-btn btn-like"
          aria-label="Curtir este local"
          title="Curtir (Seta Direita)"
          onClick={() => onSwipe(currentCard, 'liked')}
        >
          ❤️
        </button>
      </div>

      <div className="swipe-keyboard-hint">
        <span>Dica: Use ⬅️ para passar e ➡️ para curtir</span>
      </div>
    </div>
  );
};
