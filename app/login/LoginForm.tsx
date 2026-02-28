'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-cloud-dancer mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-transformative-teal"
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-cloud-dancer mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-transformative-teal"
        />
      </div>
      {message && <p className="text-sm text-red-400">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-deep-ink font-medium"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
