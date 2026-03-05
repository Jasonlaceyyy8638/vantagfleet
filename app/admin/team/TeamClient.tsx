'use client';

import { useState } from 'react';
import {
  listVantagStaff,
  addVantagStaffMember,
  removeVantagStaffMember,
  resetUserPassword,
  deleteUserFromSystem,
  type VantagStaffRow,
  type VantagStaffRole,
} from '@/app/actions/admin-team';
import {
  listSupportTickets,
  updateTicketStatus,
  replyToTicket,
  type SupportTicketRow,
} from '@/app/actions/support-tickets';
import type { MotiveDriverRow } from '@/lib/admin-types';
import { UserPlus, Loader2, Trash2, X, Users, Inbox, Send, Truck, Key, UserX } from 'lucide-react';
import { PasswordInput } from '@/components/PasswordInput';

const ROLES: { value: VantagStaffRole; label: string; description?: string }[] = [
  { value: 'Admin', label: 'Admin', description: 'Full access; can manage team, reset passwords, delete users, and view carrier dashboards.' },
  { value: 'Support', label: 'Support', description: 'Full access to carrier dashboards (impersonate); support inbox and tickets.' },
  { value: 'Billing', label: 'Billing', description: 'Billing and revenue only; no carrier impersonation.' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Manager', label: 'Manager' },
];

const TICKET_STATUSES: { value: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
];

type Props = {
  initialStaff: VantagStaffRow[];
  initialTickets: SupportTicketRow[];
  initialMotiveDrivers?: MotiveDriverRow[];
  canManageTeam?: boolean;
};

export function TeamClient({ initialStaff, initialTickets, initialMotiveDrivers = [], canManageTeam = false }: Props) {
  const [activeTab, setActiveTab] = useState<'team' | 'inbox'>('team');
  const [staff, setStaff] = useState<VantagStaffRow[]>(initialStaff);
  const [tickets, setTickets] = useState<SupportTicketRow[]>(initialTickets);
  const [motiveDrivers] = useState<MotiveDriverRow[]>(initialMotiveDrivers);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<VantagStaffRole>('Support');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [replySubmitting, setReplySubmitting] = useState<string | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await addVantagStaffMember(email, role);
    setLoading(false);
    if ('ok' in result && result.ok) {
      setMessage({ type: 'success', text: 'Team member added. If they did not have an account, a welcome email with a temporary password was sent.' });
      setEmail('');
      setRole('Support');
      setModalOpen(false);
      const updated = await listVantagStaff();
      setStaff(updated);
    } else if ('error' in result) {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUserId || !resetPasswordValue.trim()) return;
    setResetPasswordLoading(true);
    setMessage(null);
    const result = await resetUserPassword(resetPasswordUserId, resetPasswordValue);
    setResetPasswordLoading(false);
    if ('ok' in result && result.ok) {
      setMessage({ type: 'success', text: 'Password updated.' });
      setResetPasswordUserId(null);
      setResetPasswordValue('');
    } else setMessage({ type: 'error', text: result.error ?? 'Failed to reset password.' });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Permanently delete this user from the system? This cannot be undone.')) return;
    setDeleteLoading(true);
    setMessage(null);
    const result = await deleteUserFromSystem(userId);
    setDeleteLoading(false);
    if ('ok' in result && result.ok) {
      setStaff((prev) => prev.filter((s) => s.user_id !== userId));
      setMessage({ type: 'success', text: 'User removed from the system.' });
    } else setMessage({ type: 'error', text: result.error ?? 'Failed to delete user.' });
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this person from the team? They will no longer have access to the admin area.')) return;
    const result = await removeVantagStaffMember(userId);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setStaff((prev) => prev.filter((s) => s.user_id !== userId));
      setMessage({ type: 'success', text: 'Removed from team.' });
    }
  };

  const handleStatusChange = async (ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    setStatusUpdating(ticketId);
    setMessage(null);
    const result = await updateTicketStatus(ticketId, status);
    setStatusUpdating(null);
    if ('ok' in result) {
      setTickets(await listSupportTickets());
      setMessage({ type: 'success', text: 'Status updated.' });
    } else setMessage({ type: 'error', text: result.error });
  };

  const handleReply = async (ticketId: string) => {
    const text = replyText[ticketId]?.trim();
    if (!text) return;
    setReplySubmitting(ticketId);
    setMessage(null);
    const result = await replyToTicket(ticketId, text);
    setReplySubmitting(null);
    if ('ok' in result) {
      setReplyText((prev) => ({ ...prev, [ticketId]: '' }));
      setTickets(await listSupportTickets());
      setMessage({ type: 'success', text: 'Reply sent.' });
    } else setMessage({ type: 'error', text: result.error });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-soft-cloud">My Team</h1>
          <p className="text-soft-cloud/70 mt-1">
            VantagFleet staff and support inbox.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'team' ? 'bg-cyber-amber/20 text-cyber-amber' : 'text-soft-cloud/80 hover:bg-white/10'}`}
          >
            <Users className="size-4" />
            Team
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inbox' ? 'bg-cyber-amber/20 text-cyber-amber' : 'text-soft-cloud/80 hover:bg-white/10'}`}
          >
            <Inbox className="size-4" />
            Support Inbox
            {tickets.filter((t) => t.status !== 'RESOLVED').length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-cyber-amber/30 text-cyber-amber">
                {tickets.filter((t) => t.status !== 'RESOLVED').length}
              </span>
            )}
          </button>
          {activeTab === 'team' && (
        <button
          type="button"
          onClick={() => { setModalOpen(true); setMessage(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 shadow-[0_0_20px_-4px_rgba(255,176,0,0.2)] transition-colors"
        >
          <UserPlus className="size-5" />
          Add team member
        </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            message.type === 'success'
              ? 'border-electric-teal/40 bg-electric-teal/10 text-electric-teal'
              : 'border-red-400/40 bg-red-400/10 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {activeTab === 'team' && (
      <section className="rounded-xl border border-white/10 bg-card overflow-hidden shadow-lg">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-midnight-ink/50">
          <div className="p-2 rounded-lg bg-cyber-amber/20">
            <Users className="size-5 text-cyber-amber" />
          </div>
          <h2 className="text-lg font-semibold text-soft-cloud">Team members</h2>
        </div>
        {staff.length === 0 ? (
          <div className="p-8 text-center text-soft-cloud/60">
            <p className="text-sm">No team members yet.</p>
            <p className="text-sm mt-1">Click &quot;Add team member&quot; to add by email. If they don&apos;t have an account, Admins can create one and send a welcome email with a temporary password.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-soft-cloud/60 bg-white/5">
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-soft-cloud">{row.email ?? row.user_id}</td>
                    <td className="p-4">
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-cyber-amber/20 text-cyber-amber text-xs font-medium">
                        {row.role}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-1">
                      {canManageTeam && (
                        <>
                          <button
                            type="button"
                            onClick={() => { setResetPasswordUserId(row.user_id); setResetPasswordValue(''); setMessage(null); }}
                            className="p-2 rounded-lg text-soft-cloud/50 hover:text-cyber-amber hover:bg-cyber-amber/10 transition-colors"
                            title="Reset password"
                          >
                            <Key className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(row.user_id)}
                            disabled={deleteLoading}
                            className="p-2 rounded-lg text-soft-cloud/50 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                            title="Delete from system"
                          >
                            <UserX className="size-4" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(row.user_id)}
                        className="p-2 rounded-lg text-soft-cloud/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Remove from team"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {activeTab === 'team' && motiveDrivers.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-card overflow-hidden shadow-lg">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-midnight-ink/50">
            <div className="p-2 rounded-lg bg-cyber-amber/20">
              <Truck className="size-5 text-cyber-amber" />
            </div>
            <h2 className="text-lg font-semibold text-soft-cloud">Drivers imported from Motive</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-soft-cloud/60 bg-white/5">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Organization</th>
                </tr>
              </thead>
              <tbody>
                {motiveDrivers.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 text-soft-cloud">{d.name}</td>
                    <td className="p-4 text-soft-cloud/80">{d.org_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-5 py-3 text-xs text-soft-cloud/50 border-t border-white/5">
            Synced from Motive; no need to add these drivers manually.
          </p>
        </section>
      )}

      {activeTab === 'inbox' && (
      <section className="rounded-xl border border-white/10 bg-card overflow-hidden shadow-lg">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-midnight-ink/50">
          <div className="p-2 rounded-lg bg-cyber-amber/20">
            <Inbox className="size-5 text-cyber-amber" />
          </div>
          <h2 className="text-lg font-semibold text-soft-cloud">Support Inbox</h2>
        </div>
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-soft-cloud/60">
            <p className="text-sm">No support tickets yet.</p>
            <p className="text-sm mt-1">Tickets from the contact form will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {tickets.map((t) => (
              <div key={t.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-cyber-amber font-medium">{t.reference}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        t.status === 'RESOLVED' ? 'bg-electric-teal/20 text-electric-teal' :
                        t.status === 'IN_PROGRESS' ? 'bg-cyber-amber/20 text-cyber-amber' : 'bg-white/20 text-soft-cloud'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-medium text-soft-cloud mt-1">{t.subject}</p>
                    <p className="text-sm text-soft-cloud/70">{t.name} &lt;{t.email}&gt;</p>
                    <p className="text-sm text-soft-cloud/80 mt-2 whitespace-pre-wrap">{t.message}</p>
                    {t.reply_text && (
                      <div className="mt-3 pl-3 border-l-2 border-cyber-amber/50 text-sm text-soft-cloud/80">
                        <p className="font-medium text-cyber-amber/90">Reply:</p>
                        <p className="whitespace-pre-wrap mt-1">{t.reply_text}</p>
                        {t.replied_at && (
                          <p className="text-xs text-soft-cloud/50 mt-1">
                            Replied {new Date(t.replied_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED')}
                      disabled={statusUpdating === t.id}
                      className="px-2 py-1.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud text-sm focus:ring-2 focus:ring-cyber-amber"
                    >
                      {TICKET_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    {statusUpdating === t.id && <Loader2 className="size-4 animate-spin text-cyber-amber" />}
                  </div>
                </div>
                {t.status !== 'RESOLVED' && (
                  <div className="mt-3 flex gap-2">
                    <textarea
                      placeholder="Reply to customer..."
                      value={replyText[t.id] ?? ''}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      rows={2}
                      className="flex-1 px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud text-sm placeholder-soft-cloud/50 focus:ring-2 focus:ring-cyber-amber min-h-[60px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleReply(t.id)}
                      disabled={replySubmitting === t.id || !(replyText[t.id]?.trim())}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-medium hover:bg-cyber-amber/90 disabled:opacity-50 transition-colors"
                    >
                      {replySubmitting === t.id ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      )}

      {resetPasswordUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-ink/90 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => { setResetPasswordUserId(null); setResetPasswordValue(''); }} aria-hidden />
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl shadow-black/30 border-cyber-amber/20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-soft-cloud">Reset password</h3>
              <button type="button" onClick={() => { setResetPasswordUserId(null); setResetPasswordValue(''); }} className="p-2 rounded-lg text-soft-cloud/60 hover:text-soft-cloud hover:bg-white/10" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-soft-cloud/70 mb-4">Set a new password (min 8 characters). The user will need to sign in with this password.</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <PasswordInput
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                placeholder="New password"
                minLength={8}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:ring-2 focus:ring-cyber-amber pr-12"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => { setResetPasswordUserId(null); setResetPasswordValue(''); }} className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5">
                  Cancel
                </button>
                <button type="submit" disabled={resetPasswordLoading || resetPasswordValue.trim().length < 8} className="flex-1 inline-flex justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-50">
                  {resetPasswordLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Update password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-ink/90 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => { setModalOpen(false); setMessage(null); }}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl shadow-black/30 border-cyber-amber/20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-soft-cloud">Add team member</h3>
              <button
                type="button"
                onClick={() => { setModalOpen(false); setMessage(null); }}
                className="p-2 rounded-lg text-soft-cloud/60 hover:text-soft-cloud hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-soft-cloud/70 mb-4">
              Enter email and role. If they don&apos;t have an account, Admins can create one and send a welcome email with a temporary password.
            </p>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label htmlFor="team-email" className="block text-sm font-medium text-soft-cloud/80 mb-1.5">
                  Email
                </label>
                <input
                  id="team-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="colleague@vantagfleet.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50"
                />
              </div>
              <div>
                <label htmlFor="team-role" className="block text-sm font-medium text-soft-cloud/80 mb-1.5">
                  Role
                </label>
                <select
                  id="team-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as VantagStaffRole)}
                  className="w-full px-3 py-2.5 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber focus:border-cyber-amber/50"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {ROLES.find((r) => r.value === role)?.description && (
                  <p className="text-xs text-soft-cloud/50 mt-1.5">{ROLES.find((r) => r.value === role)?.description}</p>
                )}
              </div>
              {message && (
                <p className={`text-sm ${message.type === 'success' ? 'text-electric-teal' : 'text-red-400'}`}>
                  {message.text}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setMessage(null); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60 transition-colors"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                  Add team member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
