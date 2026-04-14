'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Joyride, STATUS, type Step } from 'react-joyride';
import { useDemoMode } from '@/src/contexts/DemoModeContext';

const JOY_STEPS: Step[] = [
  {
    target: '#demo-joyride-dispatch',
    title: 'Dispatch',
    content: 'Create loads, assign drivers, and run the board—same UI as production.',
  },
  {
    target: '#demo-joyride-compliance',
    title: 'Compliance',
    content: 'Med cards, documents, and safety workflows stay next to operations.',
  },
  {
    target: '#demo-joyride-accounting',
    title: 'Accounting',
    content: 'Settlements and driver pay—back-office without leaving the TMS.',
  },
];

export function DemoSandboxChrome({ children }: { children: ReactNode }) {
  const { isDemoMode } = useDemoMode();
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (!isDemoMode) return;
    const id = window.setTimeout(() => setRunTour(true), 1000);
    return () => window.clearTimeout(id);
  }, [isDemoMode]);

  if (!isDemoMode) return <>{children}</>;

  return (
    <>
      {children}
      <div
        className="pointer-events-none fixed inset-0 z-[110] flex items-start justify-center pt-16 md:pt-6"
        aria-hidden
      >
        <div className="rounded-lg border border-cyber-amber/35 bg-midnight-ink/55 px-4 py-2 text-center shadow-lg backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-cyber-amber/95">Demo sandbox</p>
          <p className="text-[10px] text-soft-cloud/40 mt-1">Sample data · no database writes</p>
        </div>
      </div>
      <Joyride
        steps={JOY_STEPS}
        run={runTour}
        continuous
        scrollToFirstStep
        onEvent={(data) => {
          if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
            setRunTour(false);
          }
        }}
        options={{
          showProgress: true,
          zIndex: 200,
          primaryColor: '#c4f135',
          textColor: '#e8edf5',
          backgroundColor: '#0c1222',
          arrowColor: '#c4f135',
          overlayColor: 'rgba(5, 8, 12, 0.72)',
          skipBeacon: true,
        }}
        styles={{
          tooltipContainer: {
            textAlign: 'left',
          },
        }}
        locale={{ back: 'Back', close: 'Close', last: 'Done', next: 'Next', skip: 'Skip tour' }}
      />
    </>
  );
}
