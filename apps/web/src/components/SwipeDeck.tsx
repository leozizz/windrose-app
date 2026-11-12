import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  RotateCcw,
  X,
  Heart,
  MapPin,
  Sun,
  Landmark,
  Sparkles,
  Waves,
  Users,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { PointOfInterest, PoiCategory, BeachProfileType } from '@windrose/shared-types';
import { formatCategory } from '../utils/labels';
import { BeachFilterBar } from './BeachFilterBar';
import {
  getBeachProfileLabel,
  getCrowdLevelLabel,
  getWaveSafetyInfo,
} from '../utils/beach';

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
  /**
   * Callback opcional para propagar mensagens de acessibilidade a leitores de tela.
   */
  onAnnounce?: (message: string) => void;
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
  onAnnounce,
}) => {
  const [beachFilter, setBeachFilter] = useState<BeachProfileType | 'ALL'>('ALL');

  const hasBeaches = useMemo(
    () => places.some((p) => p.category === PoiCategory.BEACH || Boolean(p.beachMetadata)),
    [places]
  );

  const unswipedPlaces = useMemo(
    () => places.filter((p) => !isSwiped(p.id)),
    [places, isSwiped]
  );

  const beachCounts = useMemo(() => {
    if (!hasBeaches) return undefined;
    const counts: Partial<Record<BeachProfileType | 'ALL', number>> = {
      ALL: unswipedPlaces.length,
      [BeachProfileType.CALM_WATERS]: 0,
      [BeachProfileType.SURF_ACTIVE]: 0,
      [BeachProfileType.DEEP_DROP_OFF]: 0,
      [BeachProfileType.WILD_RESERVED]: 0,
    };

    unswipedPlaces.forEach((p) => {
      if (p.beachMetadata?.profile) {
        counts[p.beachMetadata.profile] = (counts[p.beachMetadata.profile] || 0) + 1;
      }
    });

    return counts;
  }, [hasBeaches, unswipedPlaces]);

  const remainingPlaces = useMemo(() => {
    if (!hasBeaches || beachFilter === 'ALL') {
      return unswipedPlaces;
    }
    return unswipedPlaces.filter((p) => p.beachMetadata?.profile === beachFilter);
  }, [hasBeaches, beachFilter, unswipedPlaces]);

  const currentCard = remainingPlaces[0];
  const nextCard = remainingPlaces[1];
  const thirdCard = remainingPlaces[2];

  // A11y live region state
  const [announcement, setAnnouncement] = useState<string>('');

  const handleFilterChange = useCallback(
    (filter: BeachProfileType | 'ALL') => {
      setBeachFilter(filter);
      const filterLabel = filter === 'ALL' ? 'Todas' : getBeachProfileLabel(filter);
      const matchingCount =
        filter === 'ALL'
          ? unswipedPlaces.length
          : unswipedPlaces.filter((p) => p.beachMetadata?.profile === filter).length;
      const msg = `Filtro de praias: ${filterLabel} selecionado. ${matchingCount} ${
        matchingCount === 1 ? 'local disponível' : 'locais disponíveis'
      }.`;
      setAnnouncement(msg);
      onAnnounce?.(msg);
    },
    [unswipedPlaces, onAnnounce]
  );

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

  const handleUndo = useCallback(() => {
    if (!canUndo || isAnimating) return;
    const msg = 'Última decisão desfeita.';
    setAnnouncement(msg);
    onAnnounce?.(msg);
    onUndo();
  }, [canUndo, isAnimating, onAnnounce, onUndo]);

  const triggerSwipe = useCallback(
    (action: 'liked' | 'rejected') => {
      if (isAnimating || !currentCard) return;

      const actionText = action === 'liked' ? 'curtiu' : 'rejeitou';
      const remainingCount = remainingPlaces.length - 1;
      const nextCardName = remainingPlaces[1]?.name;
      const msg = `Você ${actionText} ${currentCard.name}. ${
        remainingCount > 0 && nextCardName
          ? `Próximo: ${nextCardName}. Restam ${remainingCount} ${remainingCount === 1 ? 'local' : 'locais'}.`
          : 'Você explorou todos os locais!'
      }`;
      setAnnouncement(msg);
      onAnnounce?.(msg);

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
    [
      isAnimating,
      currentCard,
      remainingPlaces,
      onAnnounce,
      dragOffset.x,
      dragOffset.y,
      animationDuration,
      onSwipe,
    ]
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

  // Keyboard navigation & accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard || isAnimating) return;

      // Do not intercept navigation shortcuts if typing in inputs or contenteditable elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        triggerSwipe('liked');
      } else if (e.key === 'ArrowLeft' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        triggerSwipe('rejected');
      } else if (
        (e.key === 'ArrowUp' || e.key === 'z' || e.key === 'Z') &&
        canUndo
      ) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, isAnimating, triggerSwipe, canUndo, handleUndo]);

  if (unswipedPlaces.length === 0) {
    return (
      <div
        className="swipe-deck-container"
        role="region"
        aria-label="Descoberta de locais"
        data-testid="swipe-deck-empty"
      >
        <div className="empty-deck-card">
          <div className="empty-deck-icon">
            <Sparkles size={44} />
          </div>
          <h3>Você explorou todos os locais!</h3>
          <p>
            {totalLikes > 0
              ? `Você curtiu ${totalLikes} ${totalLikes === 1 ? 'local' : 'locais'} incríveis. Vamos montar o seu roteiro?`
              : 'Nenhum local foi curtido nesta cidade. Que tal reiniciar e rever as opções?'}
          </p>
          <div className="matches-actions-group">
            {canUndo && (
              <button
                type="button"
                className="action-button-secondary"
                onClick={handleUndo}
                data-testid="btn-empty-undo"
              >
                <RotateCcw size={15} />
                <span>Desfazer Última Escolha</span>
              </button>
            )}
            {totalLikes > 0 && (
              <button
                type="button"
                className="action-button-primary"
                onClick={onViewMatches}
                data-testid="btn-empty-view-matches"
              >
                <span>Ver {totalLikes} Matches →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div
        className="swipe-deck-container"
        role="region"
        aria-label="Descoberta de locais"
        data-testid="swipe-deck-empty-filter"
      >
        {hasBeaches && (
          <BeachFilterBar
            selectedFilter={beachFilter}
            onFilterChange={handleFilterChange}
            beachCounts={beachCounts}
          />
        )}
        <div className="empty-deck-card">
          <div className="empty-deck-icon">
            <Waves size={44} />
          </div>
          <h3>Nenhuma atração com este perfil</h3>
          <p>Não há locais restantes para o perfil selecionado. Que tal explorar outros perfis?</p>
          <div className="matches-actions-group">
            <button
              type="button"
              className="action-button-primary"
              onClick={() => handleFilterChange('ALL')}
              data-testid="btn-reset-beach-filter"
            >
              <span>Ver Todas as Opções</span>
            </button>
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

  // Stamp opacity: 1 during flyOut, proportional during drag
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

  // 2. Next Card underneath (smooth elevation to top, full content pre-rendered)
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

  // 3. Third Card in background (full content pre-rendered)
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

  // Render unified card content across all layers to prevent content pop-in
  const renderCardContent = (poi: PointOfInterest, isCurrent: boolean) => {
    const safetyInfo = poi.beachMetadata?.waveConditions
      ? getWaveSafetyInfo(poi.beachMetadata.waveConditions)
      : null;

    return (
      <div className="card-image-wrapper">
        <img
          src={poi.imageUrl}
          alt={poi.name}
          className="card-image"
          draggable={false}
          loading={isCurrent ? 'eager' : 'lazy'}
        />
        <div className="card-gradient-overlay" />

        {/* Top Badges */}
        <div className="card-top-badges">
          <span className="category-tag">{formatCategory(poi.category)}</span>
          <span className="environment-tag">
            {poi.environment === 'OUTDOOR' ? (
              <span className="badge-content-inline">
                <Sun size={12} />
                <span>Ao Ar Livre</span>
              </span>
            ) : (
              <span className="badge-content-inline">
                <Landmark size={12} />
                <span>Coberto</span>
              </span>
            )}
          </span>
        </div>

        {/* Bottom Content Overlay with full details */}
        <div className="card-content-overlay">
          {/* Coastal Badges if beach */}
          {poi.beachMetadata && (
            <div className="beach-card-chips">
              <span
                className="beach-chip profile"
                data-testid="badge-beach-profile"
              >
                <Waves size={12} className="chip-inline-icon" />
                <span>{getBeachProfileLabel(poi.beachMetadata.profile)}</span>
              </span>
              <span
                className="beach-chip crowd"
                data-testid="badge-crowd-estimate"
              >
                <Users size={12} className="chip-inline-icon" />
                <span>{getCrowdLevelLabel(poi.beachMetadata.crowdEstimate)}</span>
              </span>
              {safetyInfo && (
                <span
                  className={`beach-chip wave-safety ${
                    safetyInfo.isSafe ? 'is-safe' : 'is-hazard'
                  }`}
                  data-testid="badge-wave-safety"
                >
                  {safetyInfo.isSafe ? (
                    <ShieldCheck size={12} className="chip-inline-icon" />
                  ) : (
                    <AlertTriangle size={12} className="chip-inline-icon" />
                  )}
                  <span>{safetyInfo.label}</span>
                </span>
              )}
            </div>
          )}

          {/* Safety Warning Banner if sea conditions are hazardous */}
          {safetyInfo && !safetyInfo.isSafe && (
            <div
              className="beach-safety-warning-banner"
              data-testid="beach-safety-warning"
              role="alert"
            >
              <AlertTriangle size={14} className="warning-banner-icon" />
              <span>{safetyInfo.warning}</span>
            </div>
          )}

          <h2 className="card-title">{poi.name}</h2>
          {poi.address && (
            <p className="card-address">
              <MapPin size={14} className="card-address-icon" />
              <span>{poi.address}</span>
            </p>
          )}
          <p className="card-description">{poi.description}</p>
          {poi.tags && poi.tags.length > 0 && (
            <div className="card-tags">
              {poi.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="card-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="swipe-deck-container"
      role="region"
      aria-label="Descoberta de locais"
      aria-roledescription="carrossel de descoberta interativo"
      data-testid="swipe-deck-container"
    >
      {hasBeaches && (
        <BeachFilterBar
          selectedFilter={beachFilter}
          onFilterChange={handleFilterChange}
          beachCounts={beachCounts}
        />
      )}

      <div className="sr-only" aria-live="polite" data-testid="swipe-live-region">
        {announcement ||
          `Local ${currentCard.name}, categoria ${formatCategory(currentCard.category)}. Use seta direita para curtir ou seta esquerda para passar.`}
      </div>

      <div className="cards-stack-area">
        {/* 1. Third Card in the Background (Fully populated details) */}
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
            {renderCardContent(thirdCard, false)}
          </div>
        )}

        {/* 2. Next Card Underneath (Fully populated details, elevating seamlessly without pop-in) */}
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
            {renderCardContent(nextCard, false)}
          </div>
        )}

        {/* 3. Current Active Card (Interactive, holding the decision stamp exclusively) */}
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
            {renderCardContent(currentCard, true)}

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
          </div>
        )}
      </div>

      {/* Tactile Bottom Action Controls */}
      <div className="swipe-action-controls">
        <button
          type="button"
          className="action-circle-btn btn-undo"
          onClick={handleUndo}
          disabled={!canUndo || isAnimating}
          title="Desfazer última decisão (Seta Cima ou Z)"
          aria-label="Desfazer"
          data-testid="btn-undo"
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
          data-testid="btn-reject"
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
          data-testid="btn-like"
        >
          <Heart size={24} strokeWidth={2.4} />
        </button>

        <button
          type="button"
          className="btn-matches-pill"
          onClick={onViewMatches}
          aria-label={`Ver matches (${totalLikes})`}
          data-testid="btn-matches"
        >
          <span>Matches</span>
          <span className="nav-badge-count">{totalLikes}</span>
        </button>
      </div>
    </div>
  );
};
