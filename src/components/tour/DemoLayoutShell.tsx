import { cookies } from 'next/headers';
import { Sidebar } from '@/components/Sidebar';
import { demoBrokerOrganization, demoOrganization } from '@/src/constants/demoData';
import { DemoModeProvider, type DemoRole } from '@/src/contexts/DemoModeContext';
import { DemoSandboxChrome } from '@/src/components/demo/DemoSandboxChrome';

/** Minimal dashboard chrome for unauthenticated interactive demo (cookie vf_demo). */
export async function DemoLayoutShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('vf_demo_role')?.value;
  const demoRole: DemoRole = roleRaw === 'broker' ? 'broker' : 'carrier';
  const org = demoRole === 'broker' ? demoBrokerOrganization : demoOrganization;

  return (
    <DemoModeProvider value={{ isDemoMode: true, demoRole }}>
      <DemoSandboxChrome>
        <div className="flex min-h-screen overflow-hidden">
          <Sidebar
            organizations={[org]}
            currentOrgId={org.id}
            showAdminLink={false}
            isDriverOnly={false}
            isDispatcher={false}
            showBetaRibbon={false}
            canSeeMap={true}
            isFounder={false}
            fullName={null}
            isDemoGuest
            isBrokerOrg={demoRole === 'broker'}
          />
          <main className="flex-1 min-h-0 overflow-auto flex flex-col overflow-x-hidden pt-14 md:pt-0 bg-midnight-ink">
            {children}
          </main>
        </div>
      </DemoSandboxChrome>
    </DemoModeProvider>
  );
}
