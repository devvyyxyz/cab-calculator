"use client";

import { useState, useEffect } from "react";

/**
 * usePersistentState — like useState, but persists the value to localStorage.
 * On first client render, returns the stored value (or the initial value if none).
 * SSR-safe: returns the initial value on the server, then updates on mount.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T;
        setState(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [key]);

  // Save to localStorage whenever state changes (after mount)
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [key, state, mounted]);

  return [state, setState];
}
