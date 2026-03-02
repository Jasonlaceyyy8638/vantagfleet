'use client';

import { createClient } from '@/lib/supabase/client';
import { acceptDriverInvite } from '@/app/actions/driver-invite';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DriverRegisterForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback` },
    });
    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }
    const result = await acceptDriverInvite(token);
    if (!result.ok) {
      setLoading(false);
      setMessage(result.error);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-cloud-dancer/70 mb-1">
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
        <label htmlFor="password" className="block text-xs font-medium text-cloud-dancer/70 mb-1">
          Password *
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber"
          placeholder="At least 6 characters"
        />
      </div>
      {message && <p className="text-sm text-red-400">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-deep-ink font-medium"
      >
        {loading ? 'Setting up…' : 'Set password & continue'}
      </button>
    </form>
  );
}
