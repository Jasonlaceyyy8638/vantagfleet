'use client';

import { NextStepProvider } from 'nextstepjs';

export function NextStepProviders({ children }: { children: React.ReactNode }) {
  return <NextStepProvider>{children}</NextStepProvider>;
}
