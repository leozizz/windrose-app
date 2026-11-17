import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PointOfInterest } from '@windrose/shared-types';

export interface SwipeRecord {
  poi: PointOfInterest;
  action: 'liked' | 'rejected';
  timestamp: number;
}

export interface TripSessionState {
  city: string;
  swipes: Record<string, SwipeRecord>;
  history: string[]; // List of POI IDs in order of action for undo
}

const STORAGE_PREFIX = 'windrose_trip_v2_';

export const useTripSession = (city: string) => {
  const normalizedCity = city.trim().toLowerCase();
  const storageKey = normalizedCity ? `${STORAGE_PREFIX}${normalizedCity}` : '';

  const prevPropCityRef = useRef<string>(city);
  const cityRef = useRef<string>(city);
  useEffect(() => {
    cityRef.current = city;
  }, [city]);

  const [state, setState] = useState<TripSessionState>(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Ignore storage read errors
      }
    }
    return {
      city,
      swipes: {},
      history: [],
    };
  });

  // Adjust state synchronously during render if `city` prop changes, preventing race conditions
  if (prevPropCityRef.current !== city) {
    prevPropCityRef.current = city;
    if (state.city.trim().toLowerCase() !== normalizedCity) {
      let nextState: TripSessionState = {
        city,
        swipes: {},
        history: [],
      };
      if (storageKey) {
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            nextState = JSON.parse(stored);
          }
        } catch {
          // Ignore storage read errors
        }
      }
      setState(nextState);
    }
  }

  // Sync to local storage only when state matches the active city and city is non-empty
  useEffect(() => {
    if (!city.trim() || !storageKey) return;
    // CRITICAL: Prevent saving state to storage if it belongs to a different city!
    if (state.city.trim().toLowerCase() !== normalizedCity) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore storage write errors
    }
  }, [state, storageKey, city, normalizedCity]);

  const swipe = useCallback((poi: PointOfInterest, action: 'liked' | 'rejected') => {
    setState((prev) => {
      const newSwipes = {
        ...prev.swipes,
        [poi.id]: {
          poi,
          action,
          timestamp: Date.now(),
        },
      };

      const newHistory = [...prev.history.filter((id) => id !== poi.id), poi.id];

      return {
        ...prev,
        swipes: newSwipes,
        history: newHistory,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.history.length === 0) return prev;
      const lastId = prev.history[prev.history.length - 1];
      const newHistory = prev.history.slice(0, -1);
      const newSwipes = { ...prev.swipes };
      delete newSwipes[lastId];

      return {
        ...prev,
        swipes: newSwipes,
        history: newHistory,
      };
    });
  }, []);

  const clearSession = useCallback(() => {
    const currentCity = cityRef.current;
    const currentKey = currentCity.trim()
      ? `${STORAGE_PREFIX}${currentCity.trim().toLowerCase()}`
      : '';

    setState({
      city: currentCity,
      swipes: {},
      history: [],
    });
    if (currentKey) {
      try {
        localStorage.removeItem(currentKey);
      } catch {
        // ignore
      }
    }
  }, []);

  const hydrateLikedPlaces = useCallback(
    (pois: PointOfInterest[], overrideCity?: string) => {
      const targetCity = (overrideCity !== undefined ? overrideCity : cityRef.current).trim();
      const targetNormalized = targetCity.toLowerCase();
      const targetKey = targetNormalized ? `${STORAGE_PREFIX}${targetNormalized}` : '';
      const timestamp = Date.now();
      const newSwipes: Record<string, SwipeRecord> = {};
      const newHistory: string[] = [];

      for (const poi of pois) {
        newSwipes[poi.id] = {
          poi,
          action: 'liked',
          timestamp,
        };
        newHistory.push(poi.id);
      }

      const newState: TripSessionState = {
        city: targetCity,
        swipes: newSwipes,
        history: newHistory,
      };

      setState(newState);

      if (targetKey) {
        try {
          localStorage.setItem(targetKey, JSON.stringify(newState));
        } catch {
          // ignore storage errors
        }
      }
    },
    []
  );

  const likedPois = useMemo(() => {
    return Object.values(state.swipes || {})
      .filter((record) => record.action === 'liked')
      .map((record) => record.poi);
  }, [state.swipes]);

  const isSwiped = useCallback(
    (poiId: string) => {
      return Boolean(state.swipes?.[poiId]);
    },
    [state.swipes]
  );

  return {
    city: state.city || city,
    swipes: state.swipes,
    likedPois,
    likedPlaces: likedPois, // Alias for backward compatibility
    totalLikes: likedPois.length,
    canUndo: state.history.length > 0,
    swipe,
    likePlace: (poi: PointOfInterest) => swipe(poi, 'liked'),
    rejectPlace: (poi: PointOfInterest) => swipe(poi, 'rejected'),
    undo,
    undoLastAction: undo,
    clearSession,
    clearCitySession: clearSession,
    isSwiped,
    hydrateLikedPlaces,
  };
};
