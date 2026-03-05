'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker so the site can be "Added to Home Screen".
 * Served from /service-worker.js (public folder).
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => {})
      .catch(() => {});
  }, []);
  return null;
}
