import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import {
  getDaysUntil,
  isExpiringWithinDays,
  isExpired,
  computeComplianceScore,
} from '@/lib/compliance';
import type { AlertItem } from '@/lib/types';
import Link from 'next/link';
import {
  AlertTriangle,
  FileCheck,
  Users,
  Truck,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { InviteButton } from '@/components/InviteButton';

const ORG_COOKIE = 'vantag-current-org-id';
const ALERT_DAYS = 30;

async function getCurrentOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profiles } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id);
  const orgIds = Array.from(new Set((profiles ?? []).map((p) => p.org_id)));
  const cookieStore = await cookies();
  const stored = cookieStore.get(ORG_COOKIE)?.value;
  return stored && orgIds.includes(stored) ? stored : orgIds[0] ?? null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) {
    return (
      <div className="p-8">
        <p className="text-cloud-dancer/70">No organization selected.</p>
      </div>
    );
  }

  const [
    { data: drivers },
    { data: vehicles },
    { data: complianceDocs },
  ] = await Promise.all([
    supabase.from('drivers').select('id, name, med_card_expiry').eq('org_id', orgId),
    supabase.from('vehicles').select('id, unit_number, annual_inspection_due').eq('org_id', orgId),
    supabase
      .from('compliance_docs')
      .select('id, doc_type, expiry_date, driver_id')
      .eq('org_id', orgId),
  ]);

  const driverList = drivers ?? [];
  const vehicleList = vehicles ?? [];
  const docList = complianceDocs ?? [];

  const alerts: AlertItem[] = [];

  driverList.forEach((d) => {
    const due = d.med_card_expiry;
    const daysLeft = getDaysUntil(due);
    if (due && daysLeft !== null && daysLeft <= ALERT_DAYS) {
      alerts.push({
        id: `driver-${d.id}`,
        type: 'driver',
        title: `Med card expiring: ${d.name}`,
        dueOrExpiry: due,
        daysLeft,
        meta: { driverId: d.id },
      });
    }
  });

  vehicleList.forEach((v) => {
    const due = v.annual_inspection_due;
    const daysLeft = getDaysUntil(due);
    if (due && daysLeft !== null && daysLeft <= ALERT_DAYS) {
      alerts.push({
        id: `vehicle-${v.id}`,
        type: 'vehicle',
        title: `Annual inspection due: ${v.unit_number || v.id}`,
        dueOrExpiry: due,
        daysLeft,
        meta: { vehicleId: v.id },
      });
    }
  });

  docList.forEach((doc) => {
    const due = doc.expiry_date;
    const daysLeft = getDaysUntil(due);
    if (due && daysLeft !== null && daysLeft <= ALERT_DAYS) {
      alerts.push({
        id: `doc-${doc.id}`,
        type: 'compliance_doc',
        title: `${doc.doc_type} expiring`,
        dueOrExpiry: due,
        daysLeft,
        meta: { docId: doc.id },
      });
    }
  });

  alerts.sort((a, b) => a.daysLeft - b.daysLeft);

  let expiredCount = 0;
  let expiring30Count = 0;
  let missingCount = 0;

  driverList.forEach((d) => {
    if (!d.med_card_expiry) missingCount++;
    else if (isExpired(d.med_card_expiry)) expiredCount++;
    else if (isExpiringWithinDays(d.med_card_expiry, ALERT_DAYS)) expiring30Count++;
  });
  vehicleList.forEach((v) => {
    if (!v.annual_inspection_due) missingCount++;
    else if (isExpired(v.annual_inspection_due)) expiredCount++;
    else if (isExpiringWithinDays(v.annual_inspection_due, ALERT_DAYS)) expiring30Count++;
  });
  docList.forEach((doc) => {
    if (!doc.expiry_date) missingCount++;
    else if (isExpired(doc.expiry_date)) expiredCount++;
    else if (isExpiringWithinDays(doc.expiry_date, ALERT_DAYS)) expiring30Count++;
  });

  const complianceScore = computeComplianceScore({
    driverCount: driverList.length,
    vehicleCount: vehicleList.length,
    docCount: docList.length,
    expiredCount,
    expiringWithin30Count: expiring30Count,
    missingCount,
  });
  const scoreColor =
    complianceScore >= 80
      ? 'text-transformative-teal'
      : complianceScore >= 50
        ? 'text-cyber-amber'
        : 'text-red-400';

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Dashboard</h1>
      <p className="text-cloud-dancer/70 mb-8">
        Overview of compliance status and expiring items.
      </p>

      {/* Compliance score & stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-card border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <TrendingUp className="size-5 text-transformative-teal" />
            </div>
            <span className="text-sm font-medium text-cloud-dancer/70">Compliance Score</span>
          </div>
          <p className={`text-3xl font-bold ${scoreColor}`}>{complianceScore}</p>
          <p className="text-xs text-cloud-dancer/50 mt-1">0–100 (missing/expired reduce score)</p>
        </div>
        <div className="rounded-xl bg-card border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-deep-ink">
              <Users className="size-5 text-cloud-dancer/60" />
            </div>
            <span className="text-sm font-medium text-cloud-dancer/70">Drivers</span>
          </div>
          <p className="text-2xl font-bold text-cloud-dancer">{driverList.length}</p>
        </div>
        <div className="rounded-xl bg-card border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-deep-ink">
              <Truck className="size-5 text-cloud-dancer/60" />
            </div>
            <span className="text-sm font-medium text-cloud-dancer/70">Vehicles</span>
          </div>
          <p className="text-2xl font-bold text-cloud-dancer">{vehicleList.length}</p>
        </div>
        <div className="rounded-xl bg-card border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-deep-ink">
              <FileCheck className="size-5 text-cloud-dancer/60" />
            </div>
            <span className="text-sm font-medium text-cloud-dancer/70">Compliance docs</span>
          </div>
          <p className="text-2xl font-bold text-cloud-dancer">{docList.length}</p>
        </div>
      </div>

      {/* Alerts */}
      <section className="rounded-xl bg-card border border-[#30363d] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#30363d] flex items-center gap-2">
          <AlertTriangle className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-cloud-dancer">Alerts — Expiring within 30 days</h2>
        </div>
        <div className="divide-y divide-[#30363d]">
          {alerts.length === 0 ? (
            <div className="px-5 py-8 text-center text-cloud-dancer/50">
              No items expiring in the next 30 days.
            </div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-deep-ink"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Calendar className="size-4 text-cloud-dancer/50 shrink-0" />
                  <span className="text-cloud-dancer truncate">{a.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={
                      a.daysLeft < 0
                        ? 'text-red-400'
                        : a.daysLeft <= 7
                          ? 'text-cyber-amber'
                          : 'text-cloud-dancer/70'
                    }
                  >
                    {a.daysLeft < 0
                      ? 'Expired'
                      : a.daysLeft === 0
                        ? 'Today'
                        : `${a.daysLeft} day${a.daysLeft === 1 ? '' : 's'} left`}
                  </span>
                  <span className="text-cloud-dancer/50 text-sm">{a.dueOrExpiry}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <InviteButton orgId={orgId} />
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/drivers"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 text-deep-ink text-sm font-medium"
        >
          <Users className="size-4" />
          Manage drivers
        </Link>
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card hover:bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm font-medium"
        >
          <Truck className="size-4" />
          Manage vehicles
        </Link>
        <Link
          href="/compliance"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card hover:bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm font-medium"
        >
          <FileCheck className="size-5" />
          Compliance docs
        </Link>
      </div>
    </div>
  );
}
