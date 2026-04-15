'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  addNewCustomer,
  assignUserToOrganization,
  listProfilesForAdmin,
  listOrganizationsForAdmin,
} from '@/app/actions/admin';
import type { ProfileRow, AdminStats, CarrierRow, CarrierIntegrationsRow } from '@/lib/admin-types';
import { listVantagStaff, updateVantagStaffRole, removeVantagStaffMember, type VantagStaffRow, type VantagStaffRole } from '@/app/actions/admin-team';
import type { StripeStats } from '@/app/actions/stripe-stats';
import { Building2, Loader2, UserPlus, Users, DollarSign, Truck, UserCheck, CreditCard, TrendingUp, Plug, Gift, ChevronDown, Trash2 } from 'lucide-react';

type OrgOption = { id: string; name: string };

function formatSubscriptionStatus(s: CarrierRow['subscriptionStatus']): string {
  if (s === 'active') return 'Active';
  if (s === 'past_due') return 'Past Due';
  if (s === 'trialing') return 'Trial';
  if (s === 'canceled') return 'Canceled';
  return '—';
}

export function AdminPageClient({
  initialProfiles,
  initialOrgs,
  initialStats,
  initialStripeStats,
  initialCarriers,
  initialCarrierIntegrations = [],
  initialStaff,
  loadError,
  canImpersonate = false,
}: {
  initialProfiles: ProfileRow[];
  initialOrgs: OrgOption[];
  initialStats: AdminStats;
  initialStripeStats: StripeStats;
  initialCarriers: CarrierRow[];
  initialCarrierIntegrations?: CarrierIntegrationsRow[];
  initialStaff: VantagStaffRow[];
  loadError?: string | null;
  /** Admin and Support can view carrier dashboard as that carrier; Billing cannot. */
  canImpersonate?: boolean;
}) {
  const [profiles, setProfiles] = useState<ProfileRow[]>(initialProfiles);
  const [orgs, setOrgs] = useState<OrgOption[]>(initialOrgs);
  const [staff, setStaff] = useState<VantagStaffRow[]>(initialStaff);
  const [staffRoleEdits, setStaffRoleEdits] = useState<Record<string, VantagStaffRole>>({});
  const [staffSavingId, setStaffSavingId] = useState<string | null>(null);
  const [staffMessage, setStaffMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orgName, setOrgName] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgSuccess, setOrgSuccess] = useState(false);

  const [assignUserId, setAssignUserId] = useState<string | null>(null);
  const [assignOrgId, setAssignOrgId] = useState('');
  const [assignRole, setAssignRole] = useState<'Owner' | 'Safety_Manager' | 'Driver'>('Driver');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [grantCreditOrgId, setGrantCreditOrgId] = useState<string | null>(null);
  const [grantCreditLoading, setGrantCreditLoading] = useState<string | null>(null);
  const [grantCreditToast, setGrantCreditToast] = useState<{
    type: 'success' | 'error';
    message: string;
    newBillingDate?: string;
  } | null>(null);
  const grantCreditDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!grantCreditOrgId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (grantCreditDropdownRef.current && !grantCreditDropdownRef.current.contains(e.target as Node)) {
        setGrantCreditOrgId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [grantCreditOrgId]);

  useEffect(() => {
    if (!grantCreditToast) return;
    const t = setTimeout(() => setGrantCreditToast(null), 5000);
    return () => clearTimeout(t);
  }, [grantCreditToast]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgError(null);
    setOrgSuccess(false);
    setOrgLoading(true);
    try {
      const result = await addNewCustomer(orgName.trim(), dotNumber.trim() || null);
      if ('error' in result) {
        setOrgError(result.error);
        return;
      }
      setOrgSuccess(true);
      setOrgName('');
      setDotNumber('');
      setOrgs((prev) => [...prev, { id: result.orgId, name: orgName.trim() }]);
    } finally {
      setOrgLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignOrgId) return;
    setAssignError(null);
    setAssignLoading(true);
    try {
      const result = await assignUserToOrganization(assignUserId, assignOrgId, assignRole);
      if ('error' in result) {
        setAssignError(result.error);
        return;
      }
      setAssignUserId(null);
      setAssignOrgId('');
      setAssignRole('Driver');
      const [newOrgs, newProfiles] = await Promise.all([listOrganizationsForAdmin(), listProfilesForAdmin()]);
      setOrgs(newOrgs);
      setProfiles(newProfiles);
    } finally {
      setAssignLoading(false);
    }
  };

  const openAssignModal = (userId: string) => {
    setAssignUserId(userId);
    setAssignOrgId(orgs[0]?.id ?? '');
    setAssignError(null);
  };

  const handleStaffRoleSave = async (userId: string, newRole: VantagStaffRole) => {
    setStaffMessage(null);
    setStaffSavingId(userId);
    const result = await updateVantagStaffRole(userId, newRole);
    setStaffSavingId(null);
    if ('ok' in result) {
      setStaff((prev) => prev.map((s) => (s.user_id === userId ? { ...s, role: newRole } : s)));
      setStaffRoleEdits((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setStaffMessage({ type: 'success', text: 'Role updated.' });
    } else setStaffMessage({ type: 'error', text: result.error });
  };

  const handleStaffRemove = async (userId: string) => {
    if (!confirm('Remove this person from VantagFleet staff? They will lose access to the admin area.')) return;
    setStaffMessage(null);
    const result = await removeVantagStaffMember(userId);
    if (result.error) setStaffMessage({ type: 'error', text: result.error });
    else {
      setStaff((prev) => prev.filter((s) => s.user_id !== userId));
      setStaffMessage({ type: 'success', text: 'Removed from team.' });
    }
  };

  const byUser = profiles.reduce<Record<string, ProfileRow[]>>((acc, p) => {
    if (!acc[p.user_id]) acc[p.user_id] = [];
    acc[p.user_id].push(p);
    return acc;
  }, {});

  const userList = Object.entries(byUser).map(([userId, rows]) => {
    const first = rows[0];
    const orgNames = Array.from(new Set(rows.map((r) => r.org_name).filter(Boolean))).join(', ') || '—';
    return {
      user_id: userId,
      email: first.email ?? '—',
      full_name: first.full_name ?? '—',
      org_names: orgNames,
      role: rows.map((r) => r.role).join(', '),
    };
  });

  return (
    <div className="space-y-10 relative">
      {grantCreditToast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-lg shadow-lg flex flex-col gap-0.5 min-w-[240px] ${
            grantCreditToast.type === 'success'
              ? 'bg-electric-teal/95 text-midnight-ink'
              : 'bg-red-500/90 text-white'
          }`}
        >
          <span className="font-semibold">{grantCreditToast.type === 'success' ? 'Success' : 'Error'}</span>
          <span className="text-sm opacity-95">{grantCreditToast.message}</span>
          {grantCreditToast.newBillingDate && (
            <span className="text-sm font-medium mt-0.5">Next billing: {grantCreditToast.newBillingDate}</span>
          )}
        </div>
      )}
      {loadError && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
          Could not load some data: {loadError}. Check server env (e.g. SUPABASE_SERVICE_ROLE_KEY) and try again.
        </div>
      )}
      {/* Stripe stats: Cyber Amber metric cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyber-amber/30 bg-card p-6 flex items-center gap-4 shadow-[0_0_24px_-4px_rgba(255,176,0,0.15)]">
          <div className="p-3 rounded-xl bg-cyber-amber/20">
            <DollarSign className="size-8 text-cyber-amber" />
          </div>
          <div>
            <p className="text-sm text-soft-cloud/60">Total Revenue (30 days)</p>
            <p className="text-2xl font-bold text-cyber-amber">${initialStripeStats.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="rounded-xl border border-cyber-amber/30 bg-card p-6 flex items-center gap-4 shadow-[0_0_24px_-4px_rgba(255,176,0,0.15)]">
          <div className="p-3 rounded-xl bg-cyber-amber/20">
            <TrendingUp className="size-8 text-cyber-amber" />
          </div>
          <div>
            <p className="text-sm text-soft-cloud/60">Active Subscriptions</p>
            <p className="text-2xl font-bold text-cyber-amber">{initialStripeStats.active_subscriptions}</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyber-amber/20">
            <Truck className="size-8 text-cyber-amber" />
          </div>
          <div>
            <p className="text-sm text-soft-cloud/60">Active TMS accounts</p>
            <p className="text-2xl font-bold text-soft-cloud">{initialStats.activeFleets}</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyber-amber/20">
            <UserCheck className="size-8 text-cyber-amber" />
          </div>
          <div>
            <p className="text-sm text-soft-cloud/60">New Signups This Week</p>
            <p className="text-2xl font-bold text-soft-cloud">{initialStats.newSignupsThisWeek}</p>
          </div>
        </div>
      </section>

      {/* VantagFleet Staff */}
      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-amber/20">
            <Users className="size-5 text-cyber-amber" />
          </div>
          <div>
            <h2 className="font-semibold text-soft-cloud">VantagFleet Staff</h2>
            <p className="text-sm text-soft-cloud/60">View and manage roles. Add new team members on the Team page.</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {staffMessage && (
            <p className={`text-sm ${staffMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{staffMessage.text}</p>
          )}
          <ul className="divide-y divide-white/10">
            {staff.length === 0 ? (
              <li className="py-3 text-soft-cloud/50 text-sm">No staff yet. Add members from the Team page.</li>
            ) : (
              staff.map((s) => (
                <li key={s.user_id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-soft-cloud">{s.email ?? s.user_id}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={staffRoleEdits[s.user_id] ?? s.role}
                      onChange={(e) => setStaffRoleEdits((prev) => ({ ...prev, [s.user_id]: e.target.value as VantagStaffRole }))}
                      className="px-2 py-1.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud text-sm"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Support">Support</option>
                      <option value="Billing">Billing</option>
                      <option value="Sales">Sales</option>
                      <option value="Manager">Manager</option>
                    </select>
                    <button
                      type="button"
                      disabled={staffSavingId === s.user_id}
                      onClick={() => handleStaffRoleSave(s.user_id, staffRoleEdits[s.user_id] ?? s.role)}
                      className="px-3 py-1.5 rounded-lg bg-cyber-amber/20 text-cyber-amber text-sm font-medium hover:bg-cyber-amber/30 disabled:opacity-50"
                    >
                      {staffSavingId === s.user_id ? <Loader2 className="size-4 animate-spin inline" /> : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStaffRemove(s.user_id)}
                      className="p-1.5 rounded-lg text-soft-cloud/50 hover:text-red-400 hover:bg-red-400/10"
                      title="Remove from team"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Carrier List — with View as (impersonation) for Admin and Support */}
      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-amber/20">
            <CreditCard className="size-5 text-cyber-amber" />
          </div>
          <div>
            <h2 className="font-semibold text-soft-cloud">Carrier accounts</h2>
            <p className="text-sm text-soft-cloud/60">
              {canImpersonate
                ? 'Open a carrier’s TMS dashboard as them for support and troubleshooting.'
                : 'Billing and carrier roster. Admin and Support can open a carrier session from here.'}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-soft-cloud/70">
                <th className="px-6 py-3 font-medium">Company name</th>
                <th className="px-6 py-3 font-medium">DOT number</th>
                <th className="px-6 py-3 font-medium">Billing</th>
                <th className="px-6 py-3 font-medium">FMCSA safety</th>
                <th className="px-6 py-3 font-medium">Operating status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialCarriers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-soft-cloud/50">No carrier accounts yet.</td>
                </tr>
              ) : (
                initialCarriers.map((c) => {
                  const insuranceGap = c.dotCensusActive && !c.authorityVerified;
                  return (
                  <tr
                    key={c.id}
                    className={`border-b border-white/5 hover:bg-white/5 ${
                      c.safetyRating === 'Unsatisfactory' ? 'bg-red-500/15 border-l-4 border-l-red-500' :
                      insuranceGap ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : ''
                    }`}
                  >
                    <td className="px-6 py-3 text-soft-cloud">{c.name}</td>
                    <td className="px-6 py-3 text-soft-cloud/80">{c.usdot_number ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={
                        c.subscriptionStatus === 'active' ? 'text-green-400' :
                        c.subscriptionStatus === 'past_due' ? 'text-amber-400' :
                        c.subscriptionStatus === 'trialing' ? 'text-blue-400' : 'text-soft-cloud/60'
                      }>
                        {formatSubscriptionStatus(c.subscriptionStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={
                          c.safetyRating === 'Unsatisfactory'
                            ? 'font-medium text-red-400'
                            : c.safetyRating === 'Satisfactory'
                              ? 'text-green-400'
                              : c.safetyRating === 'Conditional'
                                ? 'text-amber-400'
                                : 'text-soft-cloud/60'
                        }
                      >
                        {c.safetyRating ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {insuranceGap ? (
                        <span className="font-medium text-amber-400" title="DOT census shows active but BMC-91 insurance is not verified—follow up before full go-live">
                          Insurance verification pending
                        </span>
                      ) : c.authorityVerified ? (
                        <span className="text-green-400">Verified</span>
                      ) : (
                        <span className="text-soft-cloud/50">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {canImpersonate && (
                          <button
                            type="button"
                            onClick={async () => {
                              const w = typeof window !== 'undefined' ? (window as unknown as { __TAURI__?: unknown; __TAURI_INTERNAL__?: unknown }) : null;
                              if (w && (w.__TAURI__ || w.__TAURI_INTERNAL__)) {
                                const pin = window.prompt('Enter admin PIN to view as this carrier:');
                                if (pin == null) return;
                                try {
                                  const { invoke } = await import('@tauri-apps/api/core');
                                  const ok = await invoke<boolean>('verify_super_admin_pin', { pin });
                                  if (!ok) {
                                    alert('Invalid PIN. Admin mode is protected.');
                                    return;
                                  }
                                } catch {
                                  alert('Could not verify PIN.');
                                  return;
                                }
                              }
                              document.cookie = `impersonated_org_id=${encodeURIComponent(c.id)}; path=/; max-age=3600`;
                              window.location.href = '/dashboard';
                            }}
                            className="text-xs font-medium text-cyber-amber hover:text-cyber-amber/90 hover:underline"
                          >
                            View Dashboard as {c.name}
                          </button>
                        )}
                        <div className="relative" ref={grantCreditOrgId === c.id ? grantCreditDropdownRef : undefined}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGrantCreditOrgId((prev) => (prev === c.id ? null : c.id));
                            }}
                            disabled={!!grantCreditLoading}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-soft-cloud hover:bg-white/10 disabled:opacity-50"
                          >
                            <Gift className="size-3.5" />
                            Grant Credit
                            <ChevronDown className={`size-3.5 transition-transform ${grantCreditOrgId === c.id ? 'rotate-180' : ''}`} />
                          </button>
                          {grantCreditOrgId === c.id && (
                            <div className="absolute left-0 top-full z-20 mt-1 w-32 rounded-lg border border-white/10 bg-card py-1 shadow-xl">
                              {([7, 14, 30] as const).map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setGrantCreditLoading(c.id);
                                    try {
                                      const res = await fetch('/api/admin/grant-credit', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ orgId: c.id, days: d }),
                                      });
                                      const data = await res.json();
                                      setGrantCreditOrgId(null);
                                      if (!res.ok) {
                                        setGrantCreditToast({
                                          type: 'error',
                                          message: data?.error ?? 'Failed to grant credit',
                                        });
                                        return;
                                      }
                                      router.refresh();
                                      const billingDate =
                                        data.newBillingDate &&
                                        new Date(data.newBillingDate).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        });
                                      setGrantCreditToast({
                                        type: 'success',
                                        message: data?.message ?? `Granted ${d} days credit.`,
                                        newBillingDate: billingDate,
                                      });
                                    } finally {
                                      setGrantCreditLoading(null);
                                    }
                                  }}
                                  disabled={!!grantCreditLoading}
                                  className="w-full px-3 py-2 text-left text-sm text-soft-cloud hover:bg-white/10 disabled:opacity-50"
                                >
                                  +{d} Days
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Carrier Integrations — which carriers have Samsara/Motive/FMCSA connected */}
      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-amber/20">
            <Plug className="size-5 text-cyber-amber" />
          </div>
          <div>
            <h2 className="font-semibold text-soft-cloud">TMS integrations</h2>
            <p className="text-sm text-soft-cloud/60">
              Telematics and FMCSA connections that power dispatch, tracking, and fleet data.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-soft-cloud/70">
                <th className="px-6 py-3 font-medium">Company Name</th>
                <th className="px-6 py-3 font-medium">DOT Number</th>
                <th className="px-6 py-3 font-medium">Active Integrations</th>
              </tr>
            </thead>
            <tbody>
              {initialCarrierIntegrations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-soft-cloud/50">No carrier integrations yet.</td>
                </tr>
              ) : (
                initialCarrierIntegrations.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-3 text-soft-cloud">{row.name}</td>
                    <td className="px-6 py-3 text-soft-cloud/80">{row.usdot_number ?? '—'}</td>
                    <td className="px-6 py-3">
                      {row.integrations.length === 0 ? (
                        <span className="text-soft-cloud/50">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {row.integrations.map((p) => (
                            <span key={p} className="inline-flex px-2 py-0.5 rounded bg-cyber-amber/20 text-cyber-amber text-xs font-medium capitalize">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
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
          <div className="p-2 rounded-lg bg-cyber-amber/20">
            <Building2 className="size-5 text-cyber-amber" />
          </div>
          <div>
            <h2 className="font-semibold text-soft-cloud">Organization Creator</h2>
            <p className="text-sm text-soft-cloud/60">Create a new organization (Name and DOT Number)</p>
          </div>
        </div>
        <form onSubmit={handleCreateOrg} className="p-6 space-y-4 max-w-md">
          <div>
            <label htmlFor="admin-org-name" className="block text-sm font-medium text-soft-cloud/80 mb-1">
              Company name *
            </label>
            <input
              id="admin-org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
            />
          </div>
          <div>
            <label htmlFor="admin-org-dot" className="block text-sm font-medium text-soft-cloud/80 mb-1">
              DOT number
            </label>
            <input
              id="admin-org-dot"
              type="text"
              value={dotNumber}
              onChange={(e) => setDotNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
            />
          </div>
          {orgError && <p className="text-sm text-red-400">{orgError}</p>}
          {orgSuccess && <p className="text-sm text-green-400">Organization created.</p>}
          <button
            type="submit"
            disabled={orgLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60"
          >
            {orgLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Create organization
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-amber/20">
            <Users className="size-5 text-cyber-amber" />
          </div>
          <div>
            <h2 className="font-semibold text-soft-cloud">User Management</h2>
            <p className="text-sm text-soft-cloud/60">Assign users to organizations</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-soft-cloud/70">
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Organizations</th>
                <th className="px-6 py-3 font-medium w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-soft-cloud/50">
                    No users in profiles yet.
                  </td>
                </tr>
              ) : (
                userList.map((u) => (
                  <tr key={u.user_id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-3 text-soft-cloud">{u.email}</td>
                    <td className="px-6 py-3 text-soft-cloud">{u.full_name}</td>
                    <td className="px-6 py-3 text-soft-cloud/80">{u.org_names}</td>
                    <td className="px-6 py-3">
                      <button
                        type="button"
                        onClick={() => openAssignModal(u.user_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-amber/20 text-cyber-amber text-sm font-medium hover:bg-cyber-amber/30"
                      >
                        <UserPlus className="size-4" />
                        Assign to Organization
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {assignUserId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !assignLoading && setAssignUserId(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-soft-cloud mb-4">Assign to Organization</h3>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label htmlFor="assign-org" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  Organization
                </label>
                <select
                  id="assign-org"
                  value={assignOrgId}
                  onChange={(e) => setAssignOrgId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="assign-role" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  Role
                </label>
                <select
                  id="assign-role"
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value as 'Owner' | 'Safety_Manager' | 'Driver')}
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                >
                  <option value="Owner">Owner</option>
                  <option value="Safety_Manager">Safety Manager</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>
              {assignError && <p className="text-sm text-red-400">{assignError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignUserId(null)}
                  disabled={assignLoading}
                  className="px-4 py-2 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !assignOrgId}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60"
                >
                  {assignLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
