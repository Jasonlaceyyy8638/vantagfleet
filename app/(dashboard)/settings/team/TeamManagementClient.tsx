'use client';

import { useState } from 'react';
import { createInviteLink, updateMemberRole } from '@/app/actions/org';
import type { TeamMember, PendingInvite } from './page';

const ROLE_OPTIONS = [
  { value: 'Owner', label: 'Admin' },
  { value: 'Safety_Manager', label: 'Safety Manager' },
  { value: 'Driver_Manager', label: 'Driver Manager' },
  { value: 'Dispatcher', label: 'Dispatcher' },
  { value: 'Driver', label: 'Driver' },
] as const;

type RoleValue = 'Owner' | 'Safety_Manager' | 'Driver_Manager' | 'Dispatcher' | 'Driver';
type InviteRole = 'Driver' | 'Dispatcher' | 'Safety_Manager' | 'Driver_Manager';

type Props = {
  orgId: string;
  members: TeamMember[];
  pendingInvites: PendingInvite[];
  currentUserId: string;
};

export function TeamManagementClient({ orgId, members, pendingInvites, currentUserId }: Props) {
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('Driver');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [memberList, setMemberList] = useState(members);
  const [pendingList, setPendingList] = useState(pendingInvites);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setInviteLoading(true);
    setInviteError('');
    setInviteLink(null);
    const { link, error } = await createInviteLink(orgId, inviteRole, trimmed);
    setInviteLoading(false);
    if (error) {
      setInviteError(error);
      return;
    }
    setInviteLink(link ?? null);
    setPendingList((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        email: trimmed,
        invite_role: inviteRole,
        created_at: new Date().toISOString(),
      },
    ]);
    setEmail('');
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
        <h2 className="text-lg font-semibold text-soft-cloud mb-4">Invite by email</h2>
        <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/40"
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as InviteRole)}
              className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
            >
              <option value="Driver">Driver</option>
              <option value="Dispatcher">Dispatcher</option>
              <option value="Safety_Manager">Safety Manager</option>
              <option value="Driver_Manager">Driver Manager</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviteLoading}
            className="px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-50"
          >
            {inviteLoading ? 'Creating…' : 'Send invite'}
          </button>
        </form>
        {inviteError && <p className="mt-2 text-sm text-red-400">{inviteError}</p>}
        {inviteLink && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-soft-cloud/70 mb-2">Invite link (share securely):</p>
            <code className="text-xs text-cyber-amber break-all">{inviteLink}</code>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-4">Team members</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-soft-cloud/70">
                <th className="pb-2 pr-4">Name / Email</th>
                <th className="pb-2 pr-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {memberList.map((m) => (
                <tr key={m.id} className="border-b border-white/5">
                  <td className="py-3 pr-4">
                    <span className="text-soft-cloud">{m.full_name || m.email || '—'}</span>
                    {m.email && m.full_name && (
                      <span className="text-soft-cloud/50 text-xs block">{m.email}</span>
                    )}
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

      {pendingList.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-semibold text-soft-cloud mb-4">Pending invites</h2>
          <ul className="space-y-2 text-sm text-soft-cloud/90">
            {pendingList.map((i) => (
              <li key={i.id} className="flex items-center justify-between">
                <span>{i.email ?? '—'}</span>
                <span className="text-soft-cloud/60">{roleLabel(i.invite_role)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
