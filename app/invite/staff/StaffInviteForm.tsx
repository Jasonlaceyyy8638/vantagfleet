'use client';

import { createClient } from '@/lib/supabase/client';
import { acceptStaffInviteWithPassword } from '@/app/actions/admin-team';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PasswordInput } from '@/components/PasswordInput';

export function StaffInviteForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const result = await acceptStaffInviteWithPassword(token, password);
    if (!result || 'error' in result) {
      setLoading(false);
      setMessage(result?.error ?? 'Something went wrong.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: result.email, password });
    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }
    router.push('/admin');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-cloud-dancer mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          readOnly
          className="w-full px-3 py-2 rounded-lg bg-deep-ink/80 border border-[#30363d] text-cloud-dancer/80 text-sm cursor-not-allowed"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-cloud-dancer mb-1">
          Password (at least 8 characters)
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="Choose a password"
          className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber pr-12"
        />
      </div>
      {message && <p className="text-sm text-red-400">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-deep-ink font-medium"
      >
        {loading ? 'Creating account…' : 'Create password & join'}
      </button>
    </form>
  );
}
