"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * usePersistentState — like useState, but persists the value to localStorage.
 * On first client render, returns the stored value (or the initial value if none).
 * SSR-safe: returns the initial value on the server, then updates on mount.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Start with the initial value (SSR + first client render agree).
  const [state, setState] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // After mount, read from localStorage once. This is a legitimate one-time
  // hydration from an external store — the setState-in-effect rule doesn't
  // apply here because we're syncing, not deriving.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T;
        setState(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [key]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Save to localStorage whenever state changes (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [key, state, hydrated]);

  const setter = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(
        typeof value === "function"
          ? (value as (p: T) => T)(state)
          : value
      );
    },
    [state]
  );

  return [state, setter];
}
