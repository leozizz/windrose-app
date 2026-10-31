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
  /**
   * Duração da animação de saída fly-out em milissegundos.
   * Em ambiente de teste automatizado sem timers artificiais, o padrão é 0 para respostas instantâneas.
   */
  animationDuration?: number;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  places,
  isSwiped,
  onSwipe,
  onUndo,
  canUndo,
  onViewMatches,
  totalLikes,
  animationDuration = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 300,
}) => {
  const remainingPlaces = places.filter((p) => !isSwiped(p.id));
  const currentCard = remainingPlaces[0];
  const nextCard = remainingPlaces[1];

  // Drag interaction physics
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fly-out animation and depth interpolation state
  const [flyDirection, setFlyDirection] = useState<'liked' | 'rejected' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeButton, setActiveButton] = useState<'liked' | 'rejected' | null>(null);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending animation timer on unmount
  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) {
        clearTimeout(animTimeoutRef.current);
      }
    };
  }, []);

  const triggerSwipe = useCallback(
    (action: 'liked' | 'rejected') => {
      if (isAnimating || !currentCard) return;

      setIsAnimating(true);
      setFlyDirection(action);
      setActiveButton(action);

      if (animationDuration <= 0) {
        onSwipe(currentCard, action);
        setFlyDirection(null);
        setIsAnimating(false);
        setActiveButton(null);
        setDragOffset({ x: 0, y: 0 });
        return;
      }

      animTimeoutRef.current = setTimeout(() => {
        onSwipe(currentCard, action);
        setFlyDirection(null);
        setIsAnimating(false);
        setActiveButton(null);
        setDragOffset({ x: 0, y: 0 });
      }, animationDuration);
    },
    [isAnimating, currentCard, onSwipe, animationDuration]
  );

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isAnimating) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!isDragging || isAnimating) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - startPos.current.x;
      const deltaY = clientY - startPos.current.y;
      setDragOffset({ x: deltaX, y: deltaY });
    },
    [isDragging, isAnimating]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || isAnimating) return;
    setIsDragging(false);

    // Swipe decision threshold: 100px
    if (dragOffset.x > 100 && currentCard) {
      triggerSwipe('liked');
    } else if (dragOffset.x < -100 && currentCard) {
      triggerSwipe('rejected');
    } else {
      // Rebound back to center if threshold wasn't reached
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isDragging, isAnimating, dragOffset.x, currentCard, triggerSwipe]);

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
      if (!currentCard || isAnimating) return;
      if (e.key === 'ArrowRight' || e.key === 'l') {
        triggerSwipe('liked');
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        triggerSwipe('rejected');
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey) && canUndo) {
        onUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, isAnimating, triggerSwipe, canUndo, onUndo]);

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

  // Calculate dynamic rotation and drag progress based on horizontal offset
  const dragProgress = Math.min(1, Math.abs(dragOffset.x) / 110);
  const rotation = dragOffset.x * 0.08;
  const isLiking = dragOffset.x > 30 || flyDirection === 'liked';
  const isRejecting = dragOffset.x < -30 || flyDirection === 'rejected';

  // Opacity of decision stamps
  const stampOpacity =
    flyDirection !== null
      ? 1
      : isDragging
      ? Math.min(1, Math.max(0, (Math.abs(dragOffset.x) - 30) / 70))
      : 0;

  // Transform styling for the active current card
  let currentCardTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`;
  let currentCardOpacity = 1;
  let currentCardTransition = isDragging
    ? 'none'
    : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out';

  if (flyDirection === 'liked') {
    currentCardTransform = `translate3d(140%, ${dragOffset.y || 0}px, 0) rotate(22deg)`;
    currentCardOpacity = 0;
    currentCardTransition = `transform ${animationDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity ${animationDuration}ms ease-out`;
  } else if (flyDirection === 'rejected') {
    currentCardTransform = `translate3d(-140%, ${dragOffset.y || 0}px, 0) rotate(-22deg)`;
    currentCardOpacity = 0;
    currentCardTransition = `transform ${animationDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity ${animationDuration}ms ease-out`;
  }

  // Transform styling for the underlying next card (depth interpolation)
  let nextCardScale = 0.94;
  let nextCardTranslateY = 18;
  let nextCardOpacity = 0.75;
  let nextCardTransition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out';

  if (flyDirection !== null) {
    nextCardScale = 1;
    nextCardTranslateY = 0;
    nextCardOpacity = 1;
    nextCardTransition = `transform ${animationDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity ${animationDuration}ms ease-out`;
  } else if (isDragging) {
    nextCardScale = 0.94 + dragProgress * 0.06;
    nextCardTranslateY = 18 - dragProgress * 18;
    nextCardOpacity = 0.75 + dragProgress * 0.25;
    nextCardTransition = 'none';
  }

  return (
    <div className="swipe-deck-container">
      <div className="cards-stack-area">
        {/* Next Card underneath for seamless depth reveal */}
        {nextCard && (
          <div
            className="swipe-card is-next"
            aria-hidden="true"
            style={{
              transform: `translate3d(0, ${nextCardTranslateY}px, 0) scale(${nextCardScale})`,
              opacity: nextCardOpacity,
              transition: nextCardTransition,
            }}
          >
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

        {/* Current Active Card with Tinder Fly-Out Physics */}
        <div
          className={`swipe-card is-current ${flyDirection ? `flying-${flyDirection}` : ''}`}
          style={{
            transform: currentCardTransform,
            opacity: currentCardOpacity,
            transition: currentCardTransition,
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

            {/* Visual Decision Stamp Overlays */}
            {isLiking && (
              <div
                className="swipe-stamp like"
                data-testid="stamp-like"
                style={{ opacity: stampOpacity }}
              >
                CURTIR
              </div>
            )}
            {isRejecting && (
              <div
                className="swipe-stamp reject"
                data-testid="stamp-reject"
                style={{ opacity: stampOpacity }}
              >
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
          disabled={!canUndo || isAnimating}
          title="Desfazer última decisão (Ctrl+Z)"
          aria-label="Desfazer"
        >
          <RotateCcw size={18} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          className={`action-circle-btn btn-reject ${
            activeButton === 'rejected' ? 'btn-pulse-reject' : ''
          }`}
          onClick={() => triggerSwipe('rejected')}
          disabled={isAnimating}
          title="Não tenho interesse (Seta Esquerda)"
          aria-label="Rejeitar"
        >
          <X size={24} strokeWidth={2.4} />
        </button>

        <button
          type="button"
          className={`action-circle-btn btn-like ${
            activeButton === 'liked' ? 'btn-pulse-like' : ''
          }`}
          onClick={() => triggerSwipe('liked')}
          disabled={isAnimating}
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
