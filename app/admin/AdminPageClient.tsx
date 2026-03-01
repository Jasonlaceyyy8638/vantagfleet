'use client';

import { useState } from 'react';
import {
  addNewCustomer,
  assignUserToOrganization,
  listProfilesForAdmin,
  listOrganizationsForAdmin,
  type ProfileRow,
  type AdminStats,
  type CarrierRow,
} from '@/app/actions/admin';
import { addEmployeeByEmail, listStaff, type StaffRow } from '@/app/actions/admin-team';
import { Building2, Loader2, UserPlus, Users, DollarSign, Truck, UserCheck, CreditCard } from 'lucide-react';

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
  initialCarriers,
  initialStaff,
}: {
  initialProfiles: ProfileRow[];
  initialOrgs: OrgOption[];
  initialStats: AdminStats;
  initialCarriers: CarrierRow[];
  initialStaff: StaffRow[];
}) {
  const [profiles, setProfiles] = useState<ProfileRow[]>(initialProfiles);
  const [orgs, setOrgs] = useState<OrgOption[]>(initialOrgs);
  const [staff, setStaff] = useState<StaffRow[]>(initialStaff);
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [employeeSuccess, setEmployeeSuccess] = useState(false);
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

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeError(null);
    setEmployeeSuccess(false);
    setEmployeeLoading(true);
    try {
      const result = await addEmployeeByEmail(employeeEmail.trim(), 'EMPLOYEE');
      if ('error' in result) {
        setEmployeeError(result.error);
        return;
      }
      setEmployeeSuccess(true);
      setEmployeeEmail('');
      const next = await listStaff();
      setStaff(next);
    } finally {
      setEmployeeLoading(false);
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
    <div className="space-y-10">
      {/* Financial Dashboard */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyber-amber/20">
            <DollarSign className="size-8 text-cyber-amber" />
          </div>
          <div>
            <p className="text-sm text-soft-cloud/60">Total Revenue</p>
            <p className="text-2xl font-bold text-soft-cloud">${initialStats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyber-amber/20">
            <Truck className="size-8 text-cyber-amber" />
          </div>
          <div>
            <p className="text-sm text-soft-cloud/60">Active Carriers</p>
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
            <p className="text-sm text-soft-cloud/60">Add employees by email; they get EMPLOYEE role in platform_roles.</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <form onSubmit={handleAddEmployee} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px]">
              <label htmlFor="staff-email" className="block text-sm font-medium text-soft-cloud/80 mb-1">Employee email</label>
              <input
                id="staff-email"
                type="email"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                placeholder="email@vantagfleet.com"
                className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
              />
            </div>
            <button
              type="submit"
              disabled={employeeLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60"
            >
              {employeeLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              Add Employee
            </button>
          </form>
          {employeeError && <p className="text-sm text-red-400">{employeeError}</p>}
          {employeeSuccess && <p className="text-sm text-green-400">Employee added.</p>}
          <ul className="divide-y divide-white/10">
            {staff.length === 0 ? (
              <li className="py-3 text-soft-cloud/50 text-sm">No staff yet.</li>
            ) : (
              staff.map((s) => (
                <li key={s.user_id} className="py-3 flex items-center justify-between">
                  <span className="text-soft-cloud">{s.email ?? s.user_id}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyber-amber/20 text-cyber-amber">{s.role}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Subscription Tracker — Carriers */}
      <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-amber/20">
            <CreditCard className="size-5 text-cyber-amber" />
          </div>
          <div>
            <h2 className="font-semibold text-soft-cloud">Carriers</h2>
            <p className="text-sm text-soft-cloud/60">Company name, DOT number, and Stripe subscription status.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-soft-cloud/70">
                <th className="px-6 py-3 font-medium">Company Name</th>
                <th className="px-6 py-3 font-medium">DOT Number</th>
                <th className="px-6 py-3 font-medium">Subscription</th>
              </tr>
            </thead>
            <tbody>
              {initialCarriers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-soft-cloud/50">No carriers yet.</td>
                </tr>
              ) : (
                initialCarriers.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
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
