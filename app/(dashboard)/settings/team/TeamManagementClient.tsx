'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateMemberRole, addOrgMemberByEmail } from '@/app/actions/org';
import type { TeamMember, PendingInvite } from './page';

const ROLE_OPTIONS = [
  { value: 'Owner', label: 'Owner' },
  { value: 'Admin', label: 'Terminal Manager' },
  { value: 'Safety_Manager', label: 'Safety Manager' },
  { value: 'Driver_Manager', label: 'Driver Manager' },
  { value: 'Dispatcher', label: 'Dispatcher' },
  { value: 'Driver', label: 'Driver' },
] as const;

type RoleValue = 'Owner' | 'Admin' | 'Safety_Manager' | 'Driver_Manager' | 'Dispatcher' | 'Driver';
type AddRole = 'Admin' | 'Safety_Manager' | 'Driver_Manager' | 'Dispatcher' | 'Driver';

type Props = {
  orgId: string;
  members: TeamMember[];
  pendingInvites: PendingInvite[];
  currentUserId: string;
};

export function TeamManagementClient({ orgId, members, pendingInvites, currentUserId }: Props) {
  const router = useRouter();
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRole, setAddRole] = useState<AddRole>('Driver');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addWarning, setAddWarning] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [memberList, setMemberList] = useState(members);
  useEffect(() => { setMemberList(members); }, [members]);

  const handleAddByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = addEmail.trim();
    if (!trimmed) return;
    if (!addName.trim()) { setAddError('Full name is required.'); return; }
    if (!addPhone.trim()) { setAddError('Phone number is required.'); return; }
    setAddLoading(true);
    setAddError('');
    setAddWarning('');
    setAddSuccess(false);
    const result = await addOrgMemberByEmail(orgId, trimmed, addRole, addName.trim(), addPhone.trim());
    setAddLoading(false);
    if ('error' in result) {
      setAddError(result.error);
      return;
    }
    setAddSuccess(true);
    setAddWarning(result.warning ?? '');
    setAddEmail('');
    setAddName('');
    setAddPhone('');
    setAddRole('Driver');
    router.refresh();
  };

  const handleRoleChange = async (profileId: string, newRole: RoleValue) => {
    setUpdatingId(profileId);
    const { error } = await updateMemberRole(orgId, profileId, newRole);
    setUpdatingId(null);
    if (error) return;
    setMemberList((prev) =>
      prev.map((m) => (m.id === profileId ? { ...m, role: newRole } : m))
    );
  };

  const roleLabel = (role: string) =>
    ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-2">Add team member by email</h2>
        <p className="text-sm text-soft-cloud/60 mb-4">Creates an account if needed and sends a welcome email with logo and temporary password. They can sign in and change their password in Settings.</p>
        <form onSubmit={handleAddByEmail} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Email *</label>
            <input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/40"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Name *</label>
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/40"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Phone *</label>
            <input
              type="tel"
              value={addPhone}
              onChange={(e) => setAddPhone(e.target.value)}
              placeholder="e.g. +1 555-123-4567"
              required
              className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/40"
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Role</label>
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as AddRole)}
              className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
            >
              <option value="Admin">Terminal Manager</option>
              <option value="Safety_Manager">Safety Manager</option>
              <option value="Driver_Manager">Driver Manager</option>
              <option value="Dispatcher">Dispatcher</option>
              <option value="Driver">Driver</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={addLoading}
            className="px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-50"
          >
            {addLoading ? 'Adding…' : 'Add & send welcome email'}
          </button>
        </form>
        {addError && <p className="mt-2 text-sm text-red-400">{addError}</p>}
        {addSuccess && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-green-400">Team member added.</p>
            {addWarning ? (
              <p className="text-sm text-amber-400">{addWarning}</p>
            ) : (
              <p className="text-sm text-soft-cloud/70">Welcome or notification email was sent.</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-4">Team members</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-soft-cloud/70">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email / Phone</th>
                <th className="pb-2 pr-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {memberList.map((m) => (
                <tr key={m.id} className="border-b border-white/5">
                  <td className="py-3 pr-4 text-soft-cloud">{m.full_name ?? '—'}</td>
                  <td className="py-3 pr-4">
                    {m.email && <span className="text-soft-cloud block">{m.email}</span>}
                    {m.phone && <span className="text-soft-cloud/70 text-xs block">{m.phone}</span>}
                    {!m.email && !m.phone && '—'}
                  </td>
                  <td className="py-3">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as RoleValue)}
                      disabled={updatingId === m.id || (m.user_id === currentUserId && m.role === 'Owner')}
                      className="bg-deep-ink border border-white/10 rounded-lg px-2 py-1.5 text-soft-cloud disabled:opacity-60"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
