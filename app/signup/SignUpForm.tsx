'use client';

import { createClient } from '@/lib/supabase/client';
import { createOrganization } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, Shield } from 'lucide-react';
import { PasswordInput } from '@/components/PasswordInput';

function getSupabaseClient() {
  return createClient();
}

/** FMCSA: last digit = month (1=Jan … 9=Sep, 0=Oct). Second-to-last odd = odd year, even = even year. */
function getMcs150DueFromDot(dot: string): { month: string; year: number } | null {
  const digits = dot.replace(/\D/g, '');
  if (digits.length < 2) return null;
  const last = digits.slice(-1);
  const tens = digits.slice(-2, -1);
  const months: Record<string, string> = {
    '1': 'January', '2': 'February', '3': 'March', '4': 'April', '5': 'May',
    '6': 'June', '7': 'July', '8': 'August', '9': 'September', '0': 'October',
  };
  const month = months[last];
  if (!month) return null;
  const tensNum = parseInt(tens, 10);
  const isOddYear = tensNum % 2 === 1;
  const now = new Date();
  const currentYear = now.getFullYear();
  let year = isOddYear
    ? (currentYear % 2 === 1 ? currentYear : currentYear + 1)
    : (currentYear % 2 === 0 ? currentYear : currentYear + 1);
  const monthIndex = last === '0' ? 9 : parseInt(last, 10) - 1;
  const dueDate = new Date(year, monthIndex, 1);
  if (dueDate < now) year += 2;
  return { month, year };
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
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [dotInputError, setDotInputError] = useState(false);
  const [companyNameFlash, setCompanyNameFlash] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!dotInputError) return;
    const t = setTimeout(() => setDotInputError(false), 2000);
    return () => clearTimeout(t);
  }, [dotInputError]);

  useEffect(() => {
    if (!companyNameFlash) return;
    const t = setTimeout(() => setCompanyNameFlash(false), 500);
    return () => clearTimeout(t);
  }, [companyNameFlash]);

  const handleVerify = async () => {
    const dot = usdot.trim();
    if (!dot) {
      setToast({ message: 'Enter a DOT number first.' });
      return;
    }
    setVerifyError(null);
    setVerifyLoading(true);
    setDotVerified(false);
    try {
      const res = await fetch(`/api/verify-dot?dotNumber=${encodeURIComponent(dot)}`);
      let data: { error?: string; legalName?: string | null } = {};
      try {
        data = await res.json();
      } catch {
        const msg = 'DOT number not found or not registered with FMCSA.';
        setVerifyError(msg);
        setToast({ message: msg });
        setDotInputError(true);
        return;
      }
      if (!res.ok) {
        const msg = data?.error ?? 'DOT number not found or not registered with FMCSA.';
        setVerifyError(msg);
        setToast({ message: msg });
        if (msg.toLowerCase().includes('carrier not found') || msg.toLowerCase().includes('not found')) {
          setDotInputError(true);
        }
        return;
      }
      setDotVerified(true);
      const name = data.legalName ?? '';
      setCompanyName(name);
      setToast({ message: name ? `Verified: ${name}` : 'Carrier verified.', type: 'success' });
      setCompanyNameFlash(true);
    } catch {
      const msg = 'Verification failed. Please try again.';
      setVerifyError(msg);
      setToast({ message: msg });
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
    
    // 1. Supabase Auth Sign Up
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

    const user = signUpData.user;
    if (user) {
      // 2. Update Profile Table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          org_id: orgId,
          role: 'Owner',
          full_name: fullName.trim() || null,
        })
        .or(`id.eq.${user.id},user_id.eq.${user.id}`);

      // --- DISCORD PING & LEAD CAPTURE ---
      // We fire this now because the account is officially created
      try {
        await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            legal_name: companyName,
            dot_number: usdot,
            email: email.trim(),
          }),
        });
      } catch (err) {
        console.error("Discord notification failed, but user was created.");
      }

      if (profileError) {
        setLoading(false);
        setMessage(profileError.message || 'Could not create profile.');
        return;
      }

      // 3. Handle Beta Redirects
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_beta_tester')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .single();
        
      const isBeta = (profile as { is_beta_tester?: boolean } | null)?.is_beta_tester === true;
      
      if (isBeta) {
        router.push('/dashboard?welcome=beta');
      } else {
        router.push('/pricing');
      }
      router.refresh();
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  if (step === 'company') {
    return (
      <div className="relative">
        {toast && (
          <div className={`mb-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            toast.type === 'success' ? 'border-green-500/50 bg-green-500/10 text-green-200' : 'border-red-500/50 bg-red-500/10 text-red-200'
          }`}>
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className={`shrink-0 rounded p-1 ${toast.type === 'success' ? 'hover:bg-green-500/20' : 'hover:bg-red-500/20'}`}>
              <X className="size-4" />
            </button>
          </div>
        )}
      <form onSubmit={handleCompanySubmit} className="space-y-4">
        <div>
          <label htmlFor="usdot" className="block text-sm font-medium text-soft-cloud/90 mb-1">USDOT number *</label>
          <div className="flex gap-2">
            <motion.input
              id="usdot"
              type="text"
              value={usdot}
              onChange={(e) => {
                setUsdot(e.target.value);
                setDotVerified(false);
                setVerifyError(null);
                setDotInputError(false);
              }}
              required
              animate={dotInputError ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className={`flex-1 px-4 py-3 rounded-xl bg-white/5 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 border transition-colors ${dotInputError ? 'border-red-500' : 'border-white/20'}`}
              placeholder="e.g. 1234567"
            />
            <div className="relative shrink-0 flex items-center justify-center">
              <motion.button
                key={dotVerified ? 'verified' : 'verify'}
                type="button"
                onClick={handleVerify}
                disabled={verifyLoading || !usdot.trim()}
                initial={dotVerified ? { scale: 0.88, backgroundColor: 'rgb(245 158 11)', color: 'rgb(0 0 0)' } : { scale: 1, backgroundColor: 'transparent', color: 'rgb(245 158 11)' }}
                animate={{ scale: 1, backgroundColor: dotVerified ? 'rgb(245 158 11)' : 'transparent', color: dotVerified ? 'rgb(0 0 0)' : 'rgb(245 158 11)', borderColor: 'rgb(245 158 11)' }}
                className="relative z-10 px-4 py-2 rounded-lg border-2 flex items-center justify-center gap-1.5 min-w-[10rem] disabled:opacity-50 overflow-visible"
              >
                {verifyLoading && (
                  <>
                    <motion.span className="absolute w-4 h-4 rounded-full bg-amber-500/60" animate={{ scale: [0.6, 1.8], opacity: [0.7, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }} />
                    <span className="absolute inset-0 rounded-lg bg-amber-500/25 animate-ping" />
                  </>
                )}
                <span className="relative z-10 text-sm font-medium tracking-wide">
                  {verifyLoading ? 'SCANNING SATELLITE...' : dotVerified ? 'VERIFIED' : 'Verify'}
                </span>
              </motion.button>
            </div>
          </div>
          {dotVerified && (
            <div className="mt-2 space-y-1">
              <p className="flex items-center gap-1.5 text-sm text-green-500">
                <CheckCircle2 className="size-4 shrink-0" />
                <span className="inline-flex items-center rounded-md bg-green-500/15 px-2 py-0.5 font-medium text-green-400">DOT on file (MCS-150)</span>
              </p>
            </div>
          )}
          {verifyError && <p className="mt-1 text-sm text-red-400">{verifyError}</p>}
          {usdot.replace(/\D/g, '').length >= 2 && (() => {
            const due = getMcs150DueFromDot(usdot);
            if (!due) return null;
            return (
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
                <Shield className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-soft-cloud/80 uppercase tracking-wider">Compliance Health</p>
                  <p className="text-sm text-soft-cloud font-medium mt-0.5">Next filing due: {due.month} {due.year}</p>
                </div>
              </div>
            );
          })()}
        </div>
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-soft-cloud/90 mb-1">Company name</label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-all duration-200 ${
              companyNameFlash ? 'border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.4)]' : dotVerified ? 'border-green-500/50 shadow-[0_0_14px_rgba(34,197,94,0.35)]' : 'border-white/20'
            }`}
            placeholder="Acme Trucking LLC"
          />
        </div>
        {message && <p className="text-sm text-red-400">{message}</p>}
        <button type="submit" disabled={loading || !dotVerified} className="w-full py-3 rounded-xl bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-midnight-ink font-semibold transition-colors">
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleAccountSubmit} className="space-y-4">
      <p className="text-soft-cloud/70 text-sm">Company: <span className="text-soft-cloud">{companyName}</span></p>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-soft-cloud/90 mb-1">Full name</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-soft-cloud/90 mb-1">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors"
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-soft-cloud/90 mb-1">Password</label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors pr-12"
        />
      </div>
      {message && <p className="text-sm text-red-400">{message}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={() => setStep('company')} className="py-3 px-4 rounded-xl border border-white/20 text-soft-cloud hover:bg-white/10 font-medium transition-colors">Back</button>
        <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-midnight-ink font-semibold transition-colors">
          {loading ? 'Signing up…' : 'Sign up'}
        </button>
      </div>
    </form>
  );
}
