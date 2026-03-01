'use client';

import { useEffect, useState } from 'react';

type UpdateInfo = {
  version: string;
  date?: string;
  body?: string;
  downloadAndInstall: (onEvent?: (event: unknown) => void) => Promise<void>;
};

export function TauriUpdateNotifier() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only run inside Tauri (desktop app)
    const isTauri = typeof (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== 'undefined';
    if (!isTauri) return;

    let cancelled = false;
    (async () => {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const updateResult = await check();
        if (cancelled || !updateResult) return;
        setUpdate(updateResult as UpdateInfo);
        setShowModal(true);
      } catch {
        // Not in Tauri or updater not available
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdate = async () => {
    if (!update) return;
    setInstalling(true);
    try {
      await update.downloadAndInstall();
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (e) {
      console.error('Update failed:', e);
      setInstalling(false);
    }
  };

  const handleLater = () => {
    setShowModal(false);
    setUpdate(null);
  };

  if (!showModal || !update) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl border border-cyber-amber/40 bg-midnight-ink shadow-2xl max-w-md w-full p-6 text-soft-cloud">
        <h3 className="text-lg font-semibold text-cyber-amber mb-2">
          Update available
        </h3>
        <p className="text-soft-cloud/90 mb-4">
          A new version of VantagFleet is available (v{update.version}). Update now?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleLater}
            disabled={installing}
            className="px-4 py-2 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={installing}
            className="px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-50 transition-colors"
          >
            {installing ? 'Installing…' : 'Update now'}
          </button>
        </div>
      </div>
    </div>
  );
}
