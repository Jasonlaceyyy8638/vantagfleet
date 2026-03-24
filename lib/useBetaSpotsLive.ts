'use client';

import { useState, useEffect, useCallback } from 'react';

const POLL_MS = 8000;
const FALLBACK_CAP = 5;

type BetaSpotsPayload = { betaCount?: number; remaining?: number; cap?: number };

/**
 * Live founder-beta spot counter (max 5). Polls /api/beta-spots and refetches on tab focus / visibility.
 */
export function useBetaSpotsLive(enabled: boolean) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [betaCount, setBetaCount] = useState<number | null>(null);
  const [cap, setCap] = useState<number>(FALLBACK_CAP);

  const fetchSpots = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch('/api/beta-spots', { cache: 'no-store' });
      const data: BetaSpotsPayload = await res.json();
      const c = typeof data.cap === 'number' && data.cap > 0 ? data.cap : FALLBACK_CAP;
      setCap(c);
      setRemaining(typeof data.remaining === 'number' ? data.remaining : null);
      setBetaCount(typeof data.betaCount === 'number' ? data.betaCount : null);
    } catch {
      setRemaining(null);
      setBetaCount(null);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchSpots();
    const interval = setInterval(fetchSpots, POLL_MS);
    const onFocus = () => fetchSpots();
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchSpots();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [enabled, fetchSpots]);

  return { remaining, betaCount, cap, refetch: fetchSpots };
}
