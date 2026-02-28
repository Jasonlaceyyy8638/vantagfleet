'use client';

import { createClient } from '@/lib/supabase/client';
import { createOrganization, createProfileAfterSignUp } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  const router = useRouter();

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const result = await createOrganization(companyName.trim(), usdot.trim() || null);
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
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (signUpError) {
      setLoading(false);
      setMessage(signUpError.message);
      return;
    }
    const result = await createProfileAfterSignUp(orgId, fullName.trim() || null);
    if (result?.error) {
      setLoading(false);
      setMessage(result.error);
      return;
    }
    router.refresh();
  };

  if (step === 'company') {
    return (
      <form onSubmit={handleCompanySubmit} className="space-y-4">
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
        <div>
          <label htmlFor="usdot" className="block text-sm font-medium text-cloud-dancer mb-1">
            USDOT number
          </label>
          <input
            id="usdot"
            type="text"
            value={usdot}
            onChange={(e) => setUsdot(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-transformative-teal"
            placeholder="Optional"
          />
        </div>
        {message && <p className="text-sm text-red-400">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-deep-ink font-medium"
        >
          {loading ? 'Creating…' : 'Continue'}
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
