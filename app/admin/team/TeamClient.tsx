'use client';

import { useState } from 'react';
import { listStaff, addEmployeeByEmail, removeStaff, type StaffRow } from '@/app/actions/admin-team';
import { UserPlus, Loader2, Trash2 } from 'lucide-react';

type Props = { initialStaff: StaffRow[] };

export function TeamClient({ initialStaff }: Props) {
  const [staff, setStaff] = useState<StaffRow[]>(initialStaff);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EMPLOYEE'>('EMPLOYEE');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await addEmployeeByEmail(email, role);
    setLoading(false);
    if ('ok' in result && result.ok) {
      setMessage({ type: 'success', text: 'Employee added. They can now sign in and use the Admin link.' });
      setEmail('');
      const updated = await listStaff();
      setStaff(updated);
    } else if ('error' in result) {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this person from staff? They will no longer see the Admin area.')) return;
    const result = await removeStaff(userId);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setStaff((prev) => prev.filter((s) => s.user_id !== userId));
      setMessage({ type: 'success', text: 'Removed from staff.' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-soft-cloud">Team</h1>
        <p className="text-soft-cloud/70 mt-1">
          Add employees and assign roles. Only people listed here see the Admin area.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-card p-6 max-w-lg">
        <h2 className="text-lg font-semibold text-soft-cloud mb-4">Add employee</h2>
        <p className="text-sm text-soft-cloud/60 mb-4">
          They must have signed up at the app first (customer login or signup). Then enter their email and role.
        </p>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-soft-cloud/80 mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="colleague@vantagfleet.com"
              className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-soft-cloud/80 mb-1">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'EMPLOYEE')}
              className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
            >
              <option value="EMPLOYEE">Employee (support, refunds)</option>
              <option value="ADMIN">Admin (full access)</option>
            </select>
          </div>
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-electric-teal' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            Add employee
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <h2 className="text-lg font-semibold text-soft-cloud p-4 border-b border-white/10">Current staff</h2>
        {staff.length === 0 ? (
          <p className="p-6 text-soft-cloud/60 text-sm">No staff yet. Add an employee above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-soft-cloud/60">
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {staff.map((row) => (
                <tr key={row.user_id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 text-soft-cloud">{row.email ?? row.user_id}</td>
                  <td className="p-3 text-soft-cloud/80">{row.role}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => handleRemove(row.user_id)}
                      className="p-1.5 rounded text-soft-cloud/50 hover:text-red-400 hover:bg-red-400/10"
                      title="Remove from staff"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
