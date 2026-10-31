import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, X, Heart, MapPin, Sun, Landmark, Sparkles } from 'lucide-react';
import { PointOfInterest } from '@windrose/shared-types';
import { formatCategory } from '../utils/labels';

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
  const remainingPlaces = places.filter((p) => !isSwiped(p.id));
  const currentCard = remainingPlaces[0];
  const nextCard = remainingPlaces[1];

  // Drag interaction physics
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

    // Swipe threshold: 110px
    if (dragOffset.x > 110 && currentCard) {
      onSwipe(currentCard, 'liked');
    } else if (dragOffset.x < -110 && currentCard) {
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard) return;
      if (e.key === 'ArrowRight' || e.key === 'l') {
        onSwipe(currentCard, 'liked');
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        onSwipe(currentCard, 'rejected');
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey) && canUndo) {
        onUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, onSwipe, canUndo, onUndo]);

  if (!currentCard) {
    return (
      <div className="swipe-deck-container">
        <div className="empty-deck-card">
          <div className="empty-deck-icon">
            <Sparkles size={44} style={{ color: 'var(--primary)' }} />
          </div>
          <h3>Você explorou todos os locais!</h3>
          <p>
            {totalLikes > 0
              ? `Você curtiu ${totalLikes} ${totalLikes === 1 ? 'local' : 'locais'} incríveis. Vamos montar o seu roteiro?`
              : 'Nenhum local foi curtido nesta cidade. Que tal reiniciar e rever as opções?'}
          </p>
          <div className="matches-actions-group" style={{ justifyContent: 'center' }}>
            {canUndo && (
              <button
                type="button"
                className="action-button-secondary"
                onClick={onUndo}
              >
                <RotateCcw size={15} style={{ marginRight: '6px' }} />
                <span>Desfazer Última Escolha</span>
              </button>
            )}
            {totalLikes > 0 && (
              <button
                type="button"
                className="action-button-primary"
                onClick={onViewMatches}
              >
                <span>Ver {totalLikes} Matches →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calculate dynamic rotation and opacity based on horizontal drag
  const rotation = dragOffset.x * 0.08;
  const isLiking = dragOffset.x > 35;
  const isRejecting = dragOffset.x < -35;

  return (
    <div className="swipe-deck-container">
      <div className="cards-stack-area">
        {/* Next Card underneath for depth */}
        {nextCard && (
          <div className="swipe-card is-next" aria-hidden="true">
            <div className="card-image-wrapper">
              <img
                src={nextCard.imageUrl}
                alt={nextCard.name}
                className="card-image"
                loading="lazy"
              />
              <div className="card-gradient-overlay" />
              <div className="card-content-overlay">
                <h3 className="card-title">{nextCard.name}</h3>
                {nextCard.address && (
                  <p className="card-address">
                    <MapPin size={13} style={{ flexShrink: 0, opacity: 0.85 }} />
                    <span>{nextCard.address}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Current Active Card */}
        <div
          className="swipe-card is-current"
          style={{
            transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
          onMouseDown={handleTouchStart}
          onTouchStart={handleTouchStart}
          data-testid="swipe-card"
        >
          <div className="card-image-wrapper">
            <img
              src={currentCard.imageUrl}
              alt={currentCard.name}
              className="card-image"
              draggable={false}
            />
            <div className="card-gradient-overlay" />

            {/* Top Badges */}
            <div className="card-top-badges">
              <span className="category-tag">{formatCategory(currentCard.category)}</span>
              <span className="environment-tag">
                {currentCard.environment === 'OUTDOOR' ? (
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
            </div>

            {/* Stamp Feedback */}
            {isLiking && (
              <div className="swipe-stamp like" data-testid="stamp-like">
                CURTIR
              </div>
            )}
            {isRejecting && (
              <div className="swipe-stamp reject" data-testid="stamp-reject">
                PASSAR
              </div>
            )}

            {/* Bottom Content Overlay */}
            <div className="card-content-overlay">
              <h2 className="card-title">{currentCard.name}</h2>
              {currentCard.address && (
                <p className="card-address">
                  <MapPin size={14} style={{ flexShrink: 0, opacity: 0.9 }} />
                  <span>{currentCard.address}</span>
                </p>
              )}
              <p className="card-description">{currentCard.description}</p>
              {currentCard.tags && currentCard.tags.length > 0 && (
                <div className="card-tags">
                  {currentCard.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="card-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tactile Bottom Action Controls */}
      <div className="swipe-action-controls">
        <button
          type="button"
          className="action-circle-btn btn-undo"
          onClick={onUndo}
          disabled={!canUndo}
          title="Desfazer última decisão (Ctrl+Z)"
          aria-label="Desfazer"
        >
          <RotateCcw size={18} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          className="action-circle-btn btn-reject"
          onClick={() => onSwipe(currentCard, 'rejected')}
          title="Não tenho interesse (Seta Esquerda)"
          aria-label="Rejeitar"
        >
          <X size={24} strokeWidth={2.4} />
        </button>

        <button
          type="button"
          className="action-circle-btn btn-like"
          onClick={() => onSwipe(currentCard, 'liked')}
          title="Curtir e adicionar ao roteiro (Seta Direita)"
          aria-label="Curtir"
        >
          <Heart size={24} strokeWidth={2.4} />
        </button>

        <button
          type="button"
          className="btn-matches-pill"
          onClick={onViewMatches}
          aria-label={`Ver matches (${totalLikes})`}
        >
          <span>Matches</span>
          <span className="nav-badge-count">{totalLikes}</span>
        </button>
      </div>
    </div>
  );
};
