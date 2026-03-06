'use client';

import { createClient } from '@/lib/supabase/client';
import { acceptInvite, acceptInviteWithPassword } from '@/app/actions/org';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PasswordInput } from '@/components/PasswordInput';

export function InviteAcceptForm({ token, orgName, inviteEmail }: { token: string; orgName: string; inviteEmail?: string | null }) {
  const [email, setEmail] = useState(inviteEmail ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const router = useRouter();

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setLoading(true);
    setMessage('');
    const result = await acceptInviteWithPassword(token, password);
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
    router.push('/dashboard');
    router.refresh();
  };

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

  const submit = inviteEmail ? handleCreatePassword : (isSignUp ? handleSignUp : handleSignIn);

  if (inviteEmail) {
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
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={isSignUp ? 6 : 1}
          className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-transformative-teal pr-12"
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
