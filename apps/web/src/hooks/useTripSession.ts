import { useState, useEffect, useCallback, useMemo } from 'react';
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

export function useTripSession(city: string) {
  const storageKey = `${STORAGE_PREFIX}${city.trim().toLowerCase()}`;

  const [state, setState] = useState<TripSessionState>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore storage read errors
    }
    return {
      city,
      swipes: {},
      history: [],
    };
  });

  // Sync to local storage on state update
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore storage write errors
    }
  }, [state, storageKey]);

  // When city changes, reload session for that city
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setState(JSON.parse(stored));
      } else {
        setState({
          city,
          swipes: {},
          history: [],
        });
      }
    } catch {
      setState({
        city,
        swipes: {},
        history: [],
      });
    }
  }, [city, storageKey]);

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
    setState({
      city,
      swipes: {},
      history: [],
    });
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [city, storageKey]);

  const likedPois = useMemo(() => {
    return Object.values(state.swipes)
      .filter((record) => record.action === 'liked')
      .map((record) => record.poi);
  }, [state.swipes]);

  const isSwiped = useCallback(
    (poiId: string) => {
      return Boolean(state.swipes[poiId]);
    },
    [state.swipes]
  );

  return {
    city,
    swipes: state.swipes,
    likedPois,
    totalLikes: likedPois.length,
    canUndo: state.history.length > 0,
    swipe,
    undo,
    clearSession,
    isSwiped,
  };
}
