import { Suspense } from 'react';
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
  Sparkles,
  MapPin,
  FileStack,
} from 'lucide-react';
import { InviteButton } from '@/components/InviteButton';
import { FleetMapDynamic } from '@/components/FleetMapDynamic';
import { HealthCard } from '@/components/HealthCard';
import { CompliancePowerUps } from './CompliancePowerUps';
import { DashboardWelcomeBanner } from './DashboardWelcomeBanner';
import { getDashboardOrgId } from '@/lib/admin';
import { getEffectiveOrgFeatures } from '@/app/actions/admin';
import { userHasAccess, hasFullAccess, getBetaDaysRemaining } from '@/lib/userHasAccess';
import { BetaExpirationBanner } from '@/components/BetaExpirationBanner';

const ALERT_DAYS = 30;

export default async function DashboardPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) {
    return (
      <div className="p-8">
        <p className="text-cloud-dancer/70">No organization selected.</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  const driverIds = (await supabase.from('drivers').select('id').eq('org_id', orgId)).data?.map((d) => d.id) ?? [];

  const [
    { data: drivers },
    { data: vehicles },
    { data: complianceDocs },
    { data: orgRow },
    { data: driverDocs },
    { data: profileRow },
  ] = await Promise.all([
    supabase.from('drivers').select('id, name, med_card_expiry').eq('org_id', orgId),
    supabase.from('vehicles').select('id, unit_number, annual_inspection_due').eq('org_id', orgId),
    supabase
      .from('compliance_docs')
      .select('id, doc_type, expiry_date, driver_id')
      .eq('org_id', orgId),
    supabase.from('organizations').select('tier, features, subscription_status').eq('id', orgId).single(),
    driverIds.length > 0
      ? supabase.from('driver_documents').select('document_type').in('driver_id', driverIds)
      : { data: [] },
    user
      ? supabase.from('profiles').select('ifta_enabled, is_beta_tester, beta_expires_at, subscription_status').eq('user_id', user.id).eq('org_id', orgId).single()
      : { data: null },
  ]);

  const profileData = profileRow as { ifta_enabled?: boolean; is_beta_tester?: boolean; beta_expires_at?: string | null; subscription_status?: string | null } | null;
  const orgData = orgRow as { tier?: string | null; features?: unknown; subscription_status?: string | null } | null;
  const iftaEnabled = hasFullAccess(profileData, orgData);
  const tier = (orgRow as { tier?: string | null } | null)?.tier ?? null;
  const featuresRaw = (orgRow as { features?: unknown } | null)?.features;
  const featuresList = Array.isArray(featuresRaw) ? featuresRaw : [];
  const effectiveFeatures = await getEffectiveOrgFeatures(tier, featuresList);
  const showPredictiveAuditAi = effectiveFeatures.includes('predictive_audit_ai');
  const showAdvancedRouteHistory = effectiveFeatures.includes('advanced_route_history');

  const driverList = drivers ?? [];
  const vehicleList = vehicles ?? [];
  const docList = complianceDocs ?? [];
  const driverDocList = driverDocs ?? [];

  const REQUIRED_DOC_TYPES = ['COI', 'IFTA', 'REGISTRATION'] as const;
  const hasDocType = (type: string) =>
    driverDocList.some((d: { document_type: string }) => d.document_type === type);
  const missingDocTypes = REQUIRED_DOC_TYPES.filter((t) => !hasDocType(t));

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

  const betaDaysRemaining = getBetaDaysRemaining(profileData);

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <Suspense fallback={null}>
        <DashboardWelcomeBanner />
      </Suspense>
      {betaDaysRemaining != null && betaDaysRemaining > 0 && (
        <BetaExpirationBanner daysRemaining={betaDaysRemaining} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Dashboard</h1>
          <p className="text-cloud-dancer/70">
            Overview of compliance status and expiring items.
          </p>
        </div>
        <div className="sm:shrink-0">
          <HealthCard />
        </div>
      </div>

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

      {/* Fleet Map — prominent live view from Motive sync */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Truck className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-cloud-dancer">Live fleet map</h2>
        </div>
        <FleetMapDynamic
          accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''}
          height="520px"
          className="mt-2"
        />
      </section>

      {/* IFTA: Upload Fuel Receipts (when add-on purchased) */}
      {iftaEnabled && (
        <section className="mb-8 rounded-xl bg-card border border-[#30363d] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-semibold text-cloud-dancer flex items-center gap-2">
                <FileStack className="size-5 text-cyber-amber" />
                IFTA Fuel Receipts
              </h2>
              <p className="text-sm text-cloud-dancer/70 mt-1">
                Upload fuel receipts for your quarterly IFTA prep.
              </p>
            </div>
            <Link
              href="/documents"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors shrink-0"
            >
              <FileStack className="size-4" />
              Upload Fuel Receipts
            </Link>
          </div>
        </section>
      )}

      {/* Compliance Power-Ups — MCS-150 & BOC-3 waitlist */}
      <CompliancePowerUps />

      {/* Required documents — New Hire / carrier docs */}
      <section className="mb-8 rounded-xl bg-card border border-[#30363d] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FileStack className="size-5 text-cyber-amber" />
            <h2 className="font-semibold text-cloud-dancer">Required documents</h2>
          </div>
          <Link
            href="/documents"
            className="text-sm text-cyber-amber hover:underline"
          >
            Upload documents
          </Link>
        </div>
        <div className="px-5 py-4 flex flex-wrap gap-3">
          {REQUIRED_DOC_TYPES.map((type) => {
            const missing = missingDocTypes.includes(type);
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  missing
                    ? 'bg-red-500/15 text-red-400 border border-red-500/40'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {missing ? (
                  <>
                    <span className="size-1.5 rounded-full bg-red-400" />
                    {type}: Missing
                  </>
                ) : (
                  <>
                    <FileCheck className="size-4" />
                    {type}
                  </>
                )}
              </span>
            );
          })}
        </div>
      </section>

      {/* Premium placeholders (Diamond tier or admin-enabled) */}
      {(showPredictiveAuditAi || showAdvancedRouteHistory) && (
        <section className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {showPredictiveAuditAi && (
              <div className="rounded-xl border border-cyber-amber/30 bg-cyber-amber/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-5 text-cyber-amber" />
                  <h2 className="font-semibold text-cloud-dancer">Predictive Audit AI</h2>
                </div>
                <p className="text-sm text-cloud-dancer/70">
                  AI-powered audit risk and compliance insights. Coming soon.
                </p>
              </div>
            )}
            {showAdvancedRouteHistory && (
              <div className="rounded-xl border border-cyber-amber/30 bg-cyber-amber/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="size-5 text-cyber-amber" />
                  <h2 className="font-semibold text-cloud-dancer">Advanced Route History</h2>
                </div>
                <p className="text-sm text-cloud-dancer/70">
                  Detailed route and mileage history. Coming soon.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

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
