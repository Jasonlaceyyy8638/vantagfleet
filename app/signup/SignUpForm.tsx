'use client';

import { createClient } from '@/lib/supabase/client';
import { createOrganization } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

function getSupabaseClient() {
  return createClient();
}

type Step = 'company' | 'account';

export function SignUpForm() {
  const [step, setStep] = useState<Step>('company');
  const [companyName, setCompanyName] = useState('');
  const [usdot, setUsdot] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [dotVerified, setDotVerified] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const router = useRouter();

  const handleVerifyDot = async () => {
    const dot = usdot.trim();
    if (!dot) {
      setVerifyError('Enter a DOT number first.');
      return;
    }
    setVerifyError(null);
    setVerifyLoading(true);
    setDotVerified(false);
    try {
      const res = await fetch(`/api/verify-dot?dot=${encodeURIComponent(dot)}`);
      let data: { error?: string; legalName?: string | null } = {};
      try {
        data = await res.json();
      } catch {
        setVerifyError('DOT number not found or not registered with FMCSA.');
        return;
      }
      if (!res.ok) {
        setVerifyError(data?.error ?? 'DOT number not found or not registered with FMCSA.');
        return;
      }
      setDotVerified(true);
      if (data.legalName) setCompanyName(data.legalName);
    } catch {
      setVerifyError('Verification failed. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const result = await createOrganization(companyName.trim(), usdot.trim());
    setLoading(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    if (result.orgId) {
      setOrgId(result.orgId);
      setStep('account');
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setLoading(true);
    setMessage('');
    const supabase = getSupabaseClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName.trim() || null },
      },
    });
    if (signUpError) {
      setLoading(false);
      setMessage(signUpError.message);
      return;
    }
    // Session is available on the client now; server action may not see cookies yet.
    // A profile row is created by a DB trigger on auth.users; we only update it here.
    const user = signUpData.user;
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          org_id: orgId,
          role: 'Owner',
          full_name: fullName.trim() || null,
        })
        .or(`id.eq.${user.id},user_id.eq.${user.id}`);
      if (profileError) {
        setLoading(false);
        setMessage(profileError.message || 'Could not create profile.');
        return;
      }
    }
    router.push('/dashboard');
    router.refresh();
  };

  if (step === 'company') {
    return (
      <form onSubmit={handleCompanySubmit} className="space-y-4">
        <div>
          <label htmlFor="usdot" className="block text-sm font-medium text-cloud-dancer mb-1">
            USDOT number *
          </label>
          <div className="flex gap-2">
            <input
              id="usdot"
              type="text"
              value={usdot}
              onChange={(e) => {
                setUsdot(e.target.value);
                setDotVerified(false);
                setVerifyError(null);
              }}
              required
              className="flex-1 px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-transformative-teal"
              placeholder="e.g. 1234567"
            />
            <button
              type="button"
              onClick={handleVerifyDot}
              disabled={verifyLoading || !usdot.trim()}
              className="shrink-0 px-4 py-2 rounded-lg border border-[#30363d] text-cloud-dancer hover:bg-deep-ink disabled:opacity-50 flex items-center gap-1.5"
            >
              {verifyLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              Verify
            </button>
          </div>
          {dotVerified && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-green-500">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="inline-flex items-center rounded-md bg-green-500/15 px-2 py-0.5 font-medium text-green-400">
                FMCSA Verified
              </span>
            </p>
          )}
          {verifyError && <p className="mt-1 text-sm text-red-400">{verifyError}</p>}
        </div>
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-cloud-dancer mb-1">
            Company name
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-transformative-teal"
            placeholder="Acme Trucking LLC"
          />
        </div>
        {message && <p className="text-sm text-red-400">{message}</p>}
        <button
          type="submit"
          disabled={loading || !dotVerified}
          className="w-full py-2.5 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-deep-ink font-medium"
        >
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleAccountSubmit} className="space-y-4">
      <p className="text-cloud-dancer/70 text-sm">Company: <span className="text-cloud-dancer">{companyName}</span></p>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-cloud-dancer mb-1">
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-transformative-teal"
          placeholder="Your name"
        />
      </div>
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
          minLength={6}
          className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-transformative-teal"
        />
      </div>
      {message && <p className="text-sm text-red-400">{message}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep('company')}
          className="py-2.5 px-4 rounded-lg border border-[#30363d] text-cloud-dancer hover:bg-deep-ink"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-deep-ink font-medium"
        >
          {loading ? 'Signing up…' : 'Sign up'}
        </button>
      </div>
    </form>
  );
}
