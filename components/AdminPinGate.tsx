'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'vantag_super_admin_verified';

export function AdminPinGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { __TAURI__?: unknown; __TAURI_INTERNAL__?: unknown };
    const isTauri = !!(w.__TAURI__ || w.__TAURI_INTERNAL__);
    if (!isTauri) {
      setVerified(true);
      return;
    }
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === '1') {
      setVerified(true);
      return;
    }
    setVerified(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const ok = await invoke<boolean>('verify_super_admin_pin', { pin });
      if (ok) {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setVerified(true);
      } else {
        setError('Invalid PIN.');
      }
    } catch {
      setError('Verification failed.');
    }
  };

  if (verified === null) {
    return (
      <div className="min-h-screen bg-midnight-ink flex items-center justify-center p-4">
        <div className="text-soft-cloud/60">Checking…</div>
      </div>
    );
  }

  if (verified === false) {
    return (
      <div className="min-h-screen bg-midnight-ink flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-semibold text-soft-cloud mb-2">Admin mode protected</h2>
          <p className="text-sm text-soft-cloud/60 mb-4">Enter super-admin PIN to continue.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber"
              autoFocus
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
