import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import {
  listProfilesForAdmin,
  listOrganizationsForAdmin,
  getAdminStats,
  getCarriersWithSubscription,
  listCarriersWithIntegrations,
} from '@/app/actions/admin';
import { getStripeStats } from '@/app/actions/stripe-stats';
import { listStaff } from '@/app/actions/admin-team';
import { AdminPageClient } from './AdminPageClient';
import { ShieldCheck } from 'lucide-react';

const emptyStats = { totalRevenue: 0, activeFleets: 0, newSignupsThisWeek: 0 };
const emptyStripeStats = { total_revenue: 0, active_subscriptions: 0 };

export default async function AdminPage() {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  if (!admin) redirect('/');

  let profiles: Awaited<ReturnType<typeof listProfilesForAdmin>> = [];
  let orgs: Awaited<ReturnType<typeof listOrganizationsForAdmin>> = [];
  let stats = emptyStats;
  let carriers: Awaited<ReturnType<typeof getCarriersWithSubscription>> = [];
  let carrierIntegrations: Awaited<ReturnType<typeof listCarriersWithIntegrations>> = [];
  let staff: Awaited<ReturnType<typeof listStaff>> = [];
  let stripeStats = emptyStripeStats;
  let loadError: string | null = null;

  try {
    const [p, o, s, c, ci, st, ss] = await Promise.all([
      listProfilesForAdmin(),
      listOrganizationsForAdmin(),
      getAdminStats(),
      getCarriersWithSubscription(),
      listCarriersWithIntegrations(),
      listStaff(),
      getStripeStats(),
    ]);
    profiles = p;
    orgs = o;
    stats = s;
    carriers = c;
    carrierIntegrations = ci;
    staff = st;
    stripeStats = ss;
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load admin data';
  }

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
        loadError={loadError}
      />
    </div>
  );
}
