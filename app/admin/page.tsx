import { createClient } from '@/lib/supabase/server';
import { canAccessAdmin, canImpersonateCarrier } from '@/lib/admin';
import { redirect } from 'next/navigation';
import {
  listProfilesForAdmin,
  listOrganizationsForAdmin,
  getAdminStats,
  getCarriersWithSubscription,
  listCarriersWithIntegrations,
  getCompliancePowerupWaitlistCounts,
} from '@/app/actions/admin';
import { getStripeStats } from '@/app/actions/stripe-stats';
import { listVantagStaff } from '@/app/actions/admin-team';
import { AdminPageClient } from './AdminPageClient';
import { ShieldCheck } from 'lucide-react';

const emptyStats = { totalRevenue: 0, activeFleets: 0, newSignupsThisWeek: 0 };
const emptyStripeStats = { total_revenue: 0, active_subscriptions: 0 };

function isRedirect(err: unknown): boolean {
  return (err as { digest?: string })?.digest === 'NEXT_REDIRECT';
}

export default async function AdminPage() {
  let canImpersonate = false;
  try {
    const supabase = await createClient();
    const canAccess = await canAccessAdmin(supabase);
    if (!canAccess) redirect('/');
    canImpersonate = await canImpersonateCarrier(supabase);
  } catch (err) {
    if (isRedirect(err)) throw err;
    redirect('/');
  }

  let profiles: Awaited<ReturnType<typeof listProfilesForAdmin>> = [];
  let orgs: Awaited<ReturnType<typeof listOrganizationsForAdmin>> = [];
  let stats = emptyStats;
  let carriers: Awaited<ReturnType<typeof getCarriersWithSubscription>> = [];
  let carrierIntegrations: Awaited<ReturnType<typeof listCarriersWithIntegrations>> = [];
  let staff: Awaited<ReturnType<typeof listVantagStaff>> = [];
  let stripeStats = emptyStripeStats;
  let powerupWaitlist = { mcs150: 0, boc3: 0 };
  const loadError: string | null = null;

  async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  }

  const [p, o, s, c, ci, st, ss, pw] = await Promise.all([
    safe(listProfilesForAdmin, []),
    safe(listOrganizationsForAdmin, []),
    safe(getAdminStats, emptyStats),
    safe(getCarriersWithSubscription, []),
    safe(listCarriersWithIntegrations, []),
    safe(listVantagStaff, []),
    safe(getStripeStats, emptyStripeStats),
    safe(getCompliancePowerupWaitlistCounts, { mcs150: 0, boc3: 0 }),
  ]);
  profiles = p;
  orgs = o;
  stats = s;
  carriers = c;
  carrierIntegrations = ci;
  staff = st;
  stripeStats = ss;
  powerupWaitlist = pw;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyber-amber/20">
          <ShieldCheck className="size-8 text-cyber-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-soft-cloud">VantagFleet HQ</h1>
          <p className="text-soft-cloud/60 mt-0.5">
            Staff only. Revenue, carriers, and team.
          </p>
        </div>
      </div>

      <AdminPageClient
        initialProfiles={profiles}
        initialOrgs={orgs}
        initialStats={stats}
        initialStripeStats={stripeStats}
        initialCarriers={carriers}
        initialCarrierIntegrations={carrierIntegrations}
        initialStaff={staff}
        powerupWaitlistCounts={powerupWaitlist}
        loadError={loadError}
        canImpersonate={canImpersonate}
      />
    </div>
  );
}
