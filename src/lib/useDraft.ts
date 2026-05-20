"use client";
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Auto-save form state to localStorage so a refresh / screen-lock / accidental
 * navigation doesn't lose what the user typed.
 *
 * Usage:
 *   const { value, setValue, clear, restored, discard } = useDraft("workout-log", defaultState);
 *   // bind your form fields to `value` / `setValue`
 *   // on successful submit -> clear()
 *   // optionally show a banner when `restored` is true, with a "Почати заново" → discard()
 *
 * Hydration-safe: starts with `initial` on the server AND first client render,
 * then restores the draft inside an effect (so SSR markup matches).
 */
export function useDraft<T>(key: string, initial: T) {
  const fullKey = `kovalfit-draft:${key}`;
  const [value, setValueState] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  const loadedRef = useRef(false);
  const saveTimer = useRef<any>(null);

  // Restore once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        // Only restore if it actually has content (avoid restoring an empty draft)
        if (parsed && typeof parsed === "object" && Object.keys(parsed as any).length > 0) {
          setValueState(parsed);
          setRestored(true);
        }
      }
    } catch { /* ignore corrupt draft */ }
    loadedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change (debounced), but not before the initial restore ran
  useEffect(() => {
    if (!loadedRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(fullKey, JSON.stringify(value)); } catch { /* quota / private mode */ }
    }, 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [value, fullKey]);

  const setValue = useCallback((updater: T | ((prev: T) => T)) => {
    setValueState(updater as any);
  }, []);

  const clear = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try { localStorage.removeItem(fullKey); } catch {}
    setRestored(false);
  }, [fullKey]);

  // Discard the restored draft and reset to initial
  const discard = useCallback(() => {
    clear();
    setValueState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clear]);

  return { value, setValue, clear, restored, discard };
}

/** Small reusable banner shown when a draft was restored. */
export { DraftBanner } from "./DraftBanner";
