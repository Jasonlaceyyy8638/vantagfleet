'use client';

import { useState } from 'react';
import {
  listVantagStaff,
  addVantagStaffMember,
  removeVantagStaffMember,
  type VantagStaffRow,
  type VantagStaffRole,
} from '@/app/actions/admin-team';
import { UserPlus, Loader2, Trash2, X, Users } from 'lucide-react';

const ROLES: { value: VantagStaffRole; label: string }[] = [
  { value: 'Support', label: 'Support' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Admin', label: 'Admin' },
];

type Props = { initialStaff: VantagStaffRow[] };

export function TeamClient({ initialStaff }: Props) {
  const [staff, setStaff] = useState<VantagStaffRow[]>(initialStaff);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<VantagStaffRole>('Support');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await addVantagStaffMember(email, role);
    setLoading(false);
    if ('ok' in result && result.ok) {
      setMessage({ type: 'success', text: 'Employee added. They can now sign in and access the admin area.' });
      setEmail('');
      setRole('Support');
      setModalOpen(false);
      const updated = await listVantagStaff();
      setStaff(updated);
    } else if ('error' in result) {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this person from the team? They will no longer see the Admin area.')) return;
    const result = await removeVantagStaffMember(userId);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setStaff((prev) => prev.filter((s) => s.user_id !== userId));
      setMessage({ type: 'success', text: 'Removed from team.' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-soft-cloud">My Team</h1>
          <p className="text-soft-cloud/70 mt-1">
            VantagFleet staff from <span className="text-cyber-amber/90 font-medium">vantag_staff</span>. Add employees and assign roles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setModalOpen(true); setMessage(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 shadow-[0_0_20px_-4px_rgba(255,176,0,0.2)] transition-colors"
        >
          <UserPlus className="size-5" />
          Add Employee
        </button>
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
            <p className="text-sm mt-1">Click &quot;Add Employee&quot; to add someone by email and assign a role.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-soft-cloud/60 bg-white/5">
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 w-20" />
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
                    <td className="p-4">
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-ink/90 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => { setModalOpen(false); setMessage(null); }}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl shadow-black/30 border-cyber-amber/20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-soft-cloud">Add Employee</h3>
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
              They must have signed up at the app first. Enter their email and assign a role.
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
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
