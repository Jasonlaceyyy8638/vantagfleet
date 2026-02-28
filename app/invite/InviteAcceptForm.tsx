'use client';

import { createClient } from '@/lib/supabase/client';
import { acceptInvite } from '@/app/actions/org';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function InviteAcceptForm({ token, orgName }: { token: string; orgName: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }
    const result = await acceptInvite(token);
    if (result?.error) {
      setLoading(false);
      setMessage(result.error);
      return;
    }
    router.refresh();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }
    const result = await acceptInvite(token);
    if (result?.error) {
      setLoading(false);
      setMessage(result.error);
      return;
    }
    router.refresh();
  };

  const submit = isSignUp ? handleSignUp : handleSignIn;

  return (
    <form onSubmit={submit} className="space-y-4">
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
          minLength={isSignUp ? 6 : 1}
          className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-transformative-teal"
        />
      </div>
      {message && <p className="text-sm text-red-400">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-deep-ink font-medium"
      >
        {loading ? 'Please wait…' : isSignUp ? 'Sign up & join' : 'Sign in & join'}
      </button>
      <button
        type="button"
        onClick={() => setIsSignUp((v) => !v)}
        className="w-full text-sm text-cloud-dancer/70 hover:text-cloud-dancer"
      >
        {isSignUp ? 'Already have an account? Sign in.' : 'Need an account? Sign up.'}
      </button>
    </form>
  );
}
