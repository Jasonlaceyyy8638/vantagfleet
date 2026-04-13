import type { DemoRole } from '@/src/contexts/DemoModeContext';

export const VF_DEMO_COOKIE = 'vf_demo';
export const VF_DEMO_ROLE_COOKIE = 'vf_demo_role';

export type DemoSandboxState = {
  active: boolean;
  role: DemoRole;
};

function parseRole(raw: string | undefined): DemoRole {
  return raw === 'broker' ? 'broker' : 'carrier';
}

/** Server-only: read interactive demo sandbox from cookies (set by middleware on ?mode=demo). */
export function getDemoSandboxState(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): DemoSandboxState | null {
  if (cookieStore.get(VF_DEMO_COOKIE)?.value !== '1') return null;
  return {
    active: true,
    role: parseRole(cookieStore.get(VF_DEMO_ROLE_COOKIE)?.value),
  };
}

export function demoQuerySuffix(role: DemoRole): string {
  return `?mode=demo&role=${role}`;
}
