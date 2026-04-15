import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import {
  getAdminStats,
  getCarriersWithSubscription,
  getTotalVehiclesFromConnectedCarriers,
  getWishlistCounts,
  getProductRoadmapRequests,
} from '@/app/actions/admin';
import Link from 'next/link';
import { DollarSign, Truck, CreditCard, ArrowLeft, Car, MapPin, Heart, Map } from 'lucide-react';
import { FleetMapDynamic } from '@/components/FleetMapDynamic';
import { WishlistChart } from './WishlistChart';

function formatStatus(s: string): string {
  if (s === 'active') return 'Active';
  if (s === 'past_due') return 'Past Due';
  if (s === 'trialing') return 'Trial';
  if (s === 'canceled') return 'Canceled';
  return '—';
}

export default async function AdminRevenuePage() {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  if (!admin) redirect('/admin');

  const [stats, carriers, totalVehicles, wishlist, roadmapRequests] = await Promise.all([
    getAdminStats(),
    getCarriersWithSubscription(),
    getTotalVehiclesFromConnectedCarriers(),
    getWishlistCounts(),
    getProductRoadmapRequests(),
  ]);

  const wishlistChartData = [
    { name: 'Geotab', count: wishlist.geotab, fill: 'var(--accent)' },
    { name: 'Samsara', count: wishlist.samsara, fill: 'var(--accent)' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="p-2 rounded-lg border border-white/10 text-soft-cloud hover:bg-white/5"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-soft-cloud">Revenue</h1>
          <p className="text-soft-cloud/60 text-sm">Stripe revenue and carrier subscriptions.</p>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyber-amber/20">
            <DollarSign className="size-8 text-cyber-amber" />
          </div>
          <div>
            <p className="text-sm text-soft-cloud/60">Total Revenue</p>
            <p className="text-2xl font-bold text-soft-cloud">
              ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyber-amber/20">
            <Truck className="size-8 text-cyber-amber" />
          </div>
          <div>
            <p className="text-sm text-soft-cloud/60">Active Carriers</p>
            <p className="text-2xl font-bold text-soft-cloud">{stats.activeFleets}</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyber-amber/20">
            <Car className="size-8 text-cyber-amber" />
          </div>
          <div>
            <p className="text-sm text-soft-cloud/60">Total vehicles (Motive-connected carriers)</p>
            <p className="text-2xl font-bold text-soft-cloud">{totalVehicles.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
          <CreditCard className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-soft-cloud">Carriers & subscription status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-soft-cloud/70">
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">DOT</th>
                <th className="px-6 py-3 font-medium">Subscription</th>
              </tr>
            </thead>
            <tbody>
              {carriers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-soft-cloud/50">No carriers yet.</td>
                </tr>
              ) : (
                carriers.map((c) => (
                  <tr key={c.id} className="border-b border-white/5">
                    <td className="px-6 py-3 text-soft-cloud">{c.name}</td>
                    <td className="px-6 py-3 text-soft-cloud/80">{c.usdot_number ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={
                        c.subscriptionStatus === 'active' ? 'text-green-400' :
                        c.subscriptionStatus === 'past_due' ? 'text-amber-400' :
                        c.subscriptionStatus === 'trialing' ? 'text-blue-400' : 'text-soft-cloud/60'
                      }>
                        {formatStatus(c.subscriptionStatus)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
          <Heart className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-soft-cloud">Wishlist — Notify Me demand</h2>
        </div>
        <p className="px-6 py-2 text-sm text-soft-cloud/60">
          Customer interest from &quot;Notify Me&quot; on Integrations (Geotab &amp; Samsara). Build the one with higher demand first.
        </p>
        <div className="px-6 pb-6">
          <WishlistChart data={wishlistChartData} />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
          <Map className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-soft-cloud">Product Roadmap</h2>
        </div>
        <p className="px-6 py-2 text-sm text-soft-cloud/60">
          Custom TMS and integration requests from the dashboard FAB. Review and prioritize for the next desktop app update.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-soft-cloud/70">
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {roadmapRequests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-soft-cloud/50">No requests yet.</td>
                </tr>
              ) : (
                roadmapRequests.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-6 py-3 text-soft-cloud">{r.type}</td>
                    <td className="px-6 py-3 text-soft-cloud/90 max-w-md break-words">{r.description}</td>
                    <td className="px-6 py-3">
                      <span className={
                        r.status === 'New' ? 'text-cyber-amber' :
                        r.status === 'Reviewing' ? 'text-blue-400' : 'text-green-400'
                      }>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-soft-cloud/60">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
          <MapPin className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-soft-cloud">Live fleet map — all active trucks</h2>
        </div>
        <div className="p-4">
          <FleetMapDynamic
            accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''}
            height="480px"
          />
        </div>
      </section>
    </div>
  );
}
