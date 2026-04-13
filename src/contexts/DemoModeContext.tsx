'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type DemoRole = 'carrier' | 'broker';

export type DemoModeValue = {
  isDemoMode: boolean;
  demoRole: DemoRole;
};

const DemoModeContext = createContext<DemoModeValue | null>(null);

export function DemoModeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DemoModeValue;
}) {
  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

/** Returns defaults when not inside demo sandbox (logged-in app). */
export function useDemoMode(): DemoModeValue {
  const ctx = useContext(DemoModeContext);
  return ctx ?? { isDemoMode: false, demoRole: 'carrier' };
}
