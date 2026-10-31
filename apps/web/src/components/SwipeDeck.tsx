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
   * Duração da animação de saída fly-out e elevação da pilha em milissegundos.
   * Em ambiente de teste automatizado sem timers artificiais, o padrão é 0 para respostas instantâneas.
   */
  animationDuration?: number;
}

interface FlyOutState {
  direction: 'liked' | 'rejected';
  startX: number;
  startY: number;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  places,
  isSwiped,
  onSwipe,
  onUndo,
  canUndo,
  onViewMatches,
  totalLikes,
  animationDuration = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 340,
}) => {
  const remainingPlaces = places.filter((p) => !isSwiped(p.id));
  const currentCard = remainingPlaces[0];
  const nextCard = remainingPlaces[1];
  const thirdCard = remainingPlaces[2];

  // Drag interaction physics
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fly-out trajectory and stack elevation state
  const [flyOut, setFlyOut] = useState<FlyOutState | null>(null);
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
      setActiveButton(action);
      setFlyOut({
        direction: action,
        startX: dragOffset.x,
        startY: dragOffset.y,
      });

      // In tests or instant mode (duration <= 0), resolve synchronously
      if (animationDuration <= 0) {
        onSwipe(currentCard, action);
        setIsAnimating(false);
        setActiveButton(null);
        setFlyOut(null);
        setDragOffset({ x: 0, y: 0 });
        return;
      }

      // Smooth coordinated exit: card fly-out + fade while underneath card elevates
      animTimeoutRef.current = setTimeout(() => {
        onSwipe(currentCard, action);
        setFlyOut(null);
        setIsAnimating(false);
        setActiveButton(null);
        setDragOffset({ x: 0, y: 0 });
      }, animationDuration);
    },
    [isAnimating, currentCard, dragOffset.x, dragOffset.y, onSwipe, animationDuration]
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
      // Gentle rebound back to center if threshold was not reached
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

  // Drag physics calculations
  const dragProgress = Math.min(1, Math.abs(dragOffset.x) / 110);
  const rotation = dragOffset.x * 0.08;
  const isLiking = (isDragging && dragOffset.x > 25) || flyOut?.direction === 'liked';
  const isRejecting = (isDragging && dragOffset.x < -25) || flyOut?.direction === 'rejected';

  // Smooth stamp opacity: 1 during flyOut, proportional during drag
  const stampOpacity = flyOut
    ? 1
    : isDragging
    ? Math.min(1, Math.max(0, (Math.abs(dragOffset.x) - 25) / 60))
    : 0;

  // 1. Current Card transformation & smooth fade-out
  let currentCardTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`;
  let currentCardOpacity = isDragging ? Math.max(0.65, 1 - dragProgress * 0.35) : 1;
  let currentCardTransition = isDragging
    ? 'none'
    : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out';

  if (flyOut) {
    const targetX = flyOut.direction === 'liked' ? '120vw' : '-120vw';
    const targetRot = flyOut.direction === 'liked' ? 24 : -24;
    currentCardTransform = `translate3d(${targetX}, ${flyOut.startY}px, 0) rotate(${targetRot}deg)`;
    currentCardOpacity = 0;
    currentCardTransition = `transform ${animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  }

  // 2. Next Card underneath (smooth elevation to top without stamps)
  let nextCardScale = 0.95;
  let nextCardTranslateY = 14;
  let nextCardOpacity = 0.8;
  let nextCardTransition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

  if (flyOut) {
    nextCardScale = 1;
    nextCardTranslateY = 0;
    nextCardOpacity = 1;
    nextCardTransition = `transform ${animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  } else if (isDragging) {
    nextCardScale = 0.95 + dragProgress * 0.05;
    nextCardTranslateY = 14 - dragProgress * 14;
    nextCardOpacity = 0.8 + dragProgress * 0.2;
    nextCardTransition = 'none';
  }

  // 3. Third Card in background
  let thirdCardScale = 0.9;
  let thirdCardTranslateY = 28;
  let thirdCardOpacity = 0.55;
  let thirdCardTransition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

  if (flyOut) {
    thirdCardScale = 0.95;
    thirdCardTranslateY = 14;
    thirdCardOpacity = 0.8;
    thirdCardTransition = `transform ${animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  } else if (isDragging) {
    thirdCardScale = 0.9 + dragProgress * 0.05;
    thirdCardTranslateY = 28 - dragProgress * 14;
    thirdCardOpacity = 0.55 + dragProgress * 0.25;
    thirdCardTransition = 'none';
  }

  return (
    <div className="swipe-deck-container">
      <div className="cards-stack-area">
        {/* 1. Third Card in the Background */}
        {thirdCard && (
          <div
            key={thirdCard.id}
            className="swipe-card is-third"
            aria-hidden="true"
            style={{
              transform: `translate3d(0, ${thirdCardTranslateY}px, 0) scale(${thirdCardScale})`,
              opacity: thirdCardOpacity,
              transition: thirdCardTransition,
            }}
          >
            <div className="card-image-wrapper">
              <img
                src={thirdCard.imageUrl}
                alt={thirdCard.name}
                className="card-image"
                loading="lazy"
              />
              <div className="card-gradient-overlay" />
            </div>
          </div>
        )}

        {/* 2. Next Card Underneath (Elevates smoothly to top, never receives stamps) */}
        {nextCard && (
          <div
            key={nextCard.id}
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

        {/* 3. Current Active Card (The single card that moves, fades, and holds the decision stamp) */}
        {currentCard && (
          <div
            key={currentCard.id}
            className={`swipe-card is-current ${flyOut ? `flying-${flyOut.direction}` : ''}`}
            style={{
              transform: currentCardTransform,
              opacity: currentCardOpacity,
              transition: currentCardTransition,
              pointerEvents: flyOut ? 'none' : 'auto',
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

              {/* Decision Stamp exclusively attached to the active swiped card */}
              {isLiking && (
                <div
                  className="swipe-stamp like"
                  data-testid="stamp-like"
                  style={{
                    opacity: stampOpacity,
                    transform: `rotate(15deg) scale(${0.85 + stampOpacity * 0.15})`,
                  }}
                >
                  CURTIR
                </div>
              )}
              {isRejecting && (
                <div
                  className="swipe-stamp reject"
                  data-testid="stamp-reject"
                  style={{
                    opacity: stampOpacity,
                    transform: `rotate(-15deg) scale(${0.85 + stampOpacity * 0.15})`,
                  }}
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
        )}
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
