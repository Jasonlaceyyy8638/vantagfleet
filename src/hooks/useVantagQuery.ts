'use client';

import { useMemo } from 'react';
import { useDemoMode } from '@/src/contexts/DemoModeContext';
import { resolveDemoPage, type DemoPageKey } from '@/src/constants/demoData';

/**
 * When the interactive sandbox is active (`vf_demo` cookie), returns pre-seeded demo payloads
 * for the given page key; otherwise `demoSnapshot` is null and callers should use Supabase.
 */
export function useVantagQuery(page: DemoPageKey) {
  const { isDemoMode, demoRole } = useDemoMode();
  const demoSnapshot = useMemo(() => {
    if (!isDemoMode) return null;
    return resolveDemoPage(demoRole, page);
  }, [isDemoMode, demoRole, page]);

  return { isDemoMode, demoRole, demoSnapshot };
}
