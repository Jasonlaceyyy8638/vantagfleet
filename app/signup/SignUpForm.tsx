'use client';

import { createClient } from '@/lib/supabase/client';
import { type SignupAccountType } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, Shield, Truck, Briefcase } from 'lucide-react';
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

/** FMCSA verify-dot / verify-mc: normalized broker vs carrier role. */
function parseAuthorityRole(data: {
  authority_type?: string;
  authorityType?: string;
}): 'BROKER' | 'CARRIER' | 'OTHER' {
  const raw = String(data.authority_type ?? '').toUpperCase();
  if (raw === 'BROKER' || raw === 'CARRIER' || raw === 'OTHER') return raw;
  if (data.authorityType === 'Broker') return 'BROKER';
  if (data.authorityType === 'Carrier') return 'CARRIER';
  return 'OTHER';
}

type FlowStep = 'role' | 'company' | 'account';

export function SignUpForm() {
  const [step, setStep] = useState<FlowStep>('role');
  const [accountType, setAccountType] = useState<SignupAccountType | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [usdot, setUsdot] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [brokerageName, setBrokerageName] = useState('');
  const [brokerPhysicalAddress, setBrokerPhysicalAddress] = useState('');
  const [brokerUsdot, setBrokerUsdot] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [carrierPhysicalAddress, setCarrierPhysicalAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [brokerMcLookupLoading, setBrokerMcLookupLoading] = useState(false);
  const [brokerDotLookupLoading, setBrokerDotLookupLoading] = useState(false);
  const [brokerMcLookupError, setBrokerMcLookupError] = useState<string | null>(null);
  const [brokerDotLookupError, setBrokerDotLookupError] = useState<string | null>(null);
  /** Broker authority recognized (FMCSA role BROKER) after MC or DOT lookup. */
  const [brokerVerifiedBroker, setBrokerVerifiedBroker] = useState(false);
  /** Last FMCSA-confirmed digits for checkmarks (null = not synced). */
  const [fmcsaBrokerDotDigits, setFmcsaBrokerDotDigits] = useState<string | null>(null);
  const [fmcsaBrokerMcDigits, setFmcsaBrokerMcDigits] = useState<string | null>(null);
  const [fmcsaCarrierDotDigits, setFmcsaCarrierDotDigits] = useState<string | null>(null);
  const [fmcsaCarrierMcDigits, setFmcsaCarrierMcDigits] = useState<string | null>(null);
  const [carrierDotLookupLoading, setCarrierDotLookupLoading] = useState(false);
  const [carrierMcLookupLoading, setCarrierMcLookupLoading] = useState(false);
  const [carrierDotLookupError, setCarrierDotLookupError] = useState<string | null>(null);
  const [carrierMcLookupError, setCarrierMcLookupError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
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

  /** Debounced FMCSA MC lookup — broker (500ms). */
  useEffect(() => {
    if (accountType !== 'broker' || step !== 'company') return;
    const digits = mcNumber.replace(/\D/g, '');
    if (digits.length < 4) {
      setBrokerMcLookupLoading(false);
      setBrokerMcLookupError(null);
      setFmcsaBrokerMcDigits(null);
      setBrokerVerifiedBroker(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setBrokerMcLookupLoading(true);
      setBrokerMcLookupError(null);
      try {
        const res = await fetch(`/api/verify-mc?mcNumber=${encodeURIComponent(digits)}`);
        let data: {
          error?: string;
          legalName?: string | null;
          physicalAddress?: string | null;
          authorityType?: string;
          authority_type?: string;
          dot_number?: string | null;
          mc_number?: string | null;
        } = {};
        try {
          data = await res.json();
        } catch {
          if (!cancelled) {
            setBrokerMcLookupError('Invalid response from verification.');
            setBrokerVerifiedBroker(false);
          }
          return;
        }
        if (cancelled) return;
        if (!res.ok) {
          setBrokerMcLookupError(
            typeof data.error === 'string' ? data.error : 'MC number not found or lookup failed.'
          );
          setFmcsaBrokerMcDigits(null);
          setFmcsaBrokerDotDigits(null);
          setBrokerVerifiedBroker(false);
          return;
        }
        const role = parseAuthorityRole(data);
        if (role !== 'BROKER') {
          setBrokerMcLookupError(
            'This MC number belongs to a Carrier. Please use the Carrier signup page.'
          );
          setBrokerageName('');
          setBrokerPhysicalAddress('');
          setBrokerUsdot('');
          setFmcsaBrokerDotDigits(null);
          setFmcsaBrokerMcDigits(null);
          setBrokerVerifiedBroker(false);
          return;
        }
        if (data.legalName) setBrokerageName(String(data.legalName));
        if (data.physicalAddress) setBrokerPhysicalAddress(String(data.physicalAddress));
        setBrokerMcLookupError(null);
        const dn = data.dot_number != null ? String(data.dot_number).replace(/\D/g, '') : '';
        const mn = data.mc_number != null ? String(data.mc_number).replace(/\D/g, '') : '';
        if (dn) setBrokerUsdot(dn);
        setFmcsaBrokerDotDigits(dn || null);
        setFmcsaBrokerMcDigits(mn || digits || null);
        setBrokerVerifiedBroker(true);
      } catch {
        if (!cancelled) {
          setBrokerMcLookupError('Lookup failed. Please try again.');
          setBrokerVerifiedBroker(false);
        }
      } finally {
        if (!cancelled) setBrokerMcLookupLoading(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [mcNumber, accountType, step]);

  /** Debounced FMCSA DOT lookup — broker (500ms). */
  useEffect(() => {
    if (accountType !== 'broker' || step !== 'company') return;
    const digits = brokerUsdot.replace(/\D/g, '');
    if (digits.length < 5) {
      setBrokerDotLookupLoading(false);
      setBrokerDotLookupError(null);
      setFmcsaBrokerDotDigits(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setBrokerDotLookupLoading(true);
      setBrokerDotLookupError(null);
      try {
        const res = await fetch(`/api/verify-dot?dotNumber=${encodeURIComponent(digits)}`);
        let data: {
          error?: string;
          legalName?: string | null;
          physicalAddress?: string | null;
          authorityType?: string;
          authority_type?: string;
          dot_number?: string | null;
          mc_number?: string | null;
        } = {};
        try {
          data = await res.json();
        } catch {
          if (!cancelled) setBrokerDotLookupError('Invalid response from verification.');
          return;
        }
        if (cancelled) return;
        if (!res.ok) {
          setBrokerDotLookupError(
            typeof data.error === 'string' ? data.error : 'DOT number not found or lookup failed.'
          );
          setFmcsaBrokerDotDigits(null);
          setBrokerVerifiedBroker(false);
          return;
        }
        const role = parseAuthorityRole(data);
        if (role !== 'BROKER') {
          setBrokerDotLookupError(
            'This USDOT number belongs to a Carrier. Please use the Carrier signup page.'
          );
          setBrokerageName('');
          setBrokerPhysicalAddress('');
          setMcNumber('');
          setFmcsaBrokerDotDigits(null);
          setFmcsaBrokerMcDigits(null);
          setBrokerVerifiedBroker(false);
          return;
        }
        if (data.legalName) setBrokerageName(String(data.legalName));
        if (data.physicalAddress) setBrokerPhysicalAddress(String(data.physicalAddress));
        const dn = data.dot_number != null ? String(data.dot_number).replace(/\D/g, '') : digits;
        const mn = data.mc_number != null ? String(data.mc_number).replace(/\D/g, '') : '';
        setBrokerUsdot(dn);
        if (mn) setMcNumber(mn);
        setFmcsaBrokerDotDigits(dn || null);
        setFmcsaBrokerMcDigits(mn || null);
        setBrokerDotLookupError(null);
        setBrokerVerifiedBroker(true);
      } catch {
        if (!cancelled) setBrokerDotLookupError('Lookup failed. Please try again.');
      } finally {
        if (!cancelled) setBrokerDotLookupLoading(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [brokerUsdot, accountType, step]);

  /** Debounced FMCSA DOT lookup — carrier (500ms). */
  useEffect(() => {
    if (accountType !== 'carrier' || step !== 'company') return;
    const digits = usdot.replace(/\D/g, '');
    if (digits.length < 5) {
      setCarrierDotLookupLoading(false);
      setCarrierDotLookupError(null);
      setFmcsaCarrierDotDigits(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setCarrierDotLookupLoading(true);
      setCarrierDotLookupError(null);
      try {
        const res = await fetch(`/api/verify-dot?dotNumber=${encodeURIComponent(digits)}`);
        let data: {
          error?: string;
          legalName?: string | null;
          physicalAddress?: string | null;
          authorityType?: string;
          authority_type?: string;
          dot_number?: string | null;
          mc_number?: string | null;
        } = {};
        try {
          data = await res.json();
        } catch {
          if (!cancelled) {
            setCarrierDotLookupError('Invalid response from verification.');
            setDotInputError(true);
          }
          return;
        }
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            typeof data.error === 'string' ? data.error : 'DOT number not found or not registered with FMCSA.';
          setCarrierDotLookupError(msg);
          setToast({ message: msg });
          setDotInputError(true);
          setFmcsaCarrierDotDigits(null);
          return;
        }
        const dotRole = parseAuthorityRole(data);
        if (dotRole === 'BROKER') {
          setCarrierDotLookupError(
            'This USDOT number belongs to a Brokerage. Please use the Broker signup page.'
          );
          setFmcsaCarrierDotDigits(null);
          setFmcsaCarrierMcDigits(null);
          return;
        }
        if (data.legalName) setCompanyName(String(data.legalName));
        if (data.physicalAddress) setCarrierPhysicalAddress(String(data.physicalAddress));
        const dn = data.dot_number != null ? String(data.dot_number).replace(/\D/g, '') : digits;
        const mn = data.mc_number != null ? String(data.mc_number).replace(/\D/g, '') : '';
        setUsdot(dn);
        if (mn) setMcNumber(mn);
        setFmcsaCarrierDotDigits(dn || null);
        setFmcsaCarrierMcDigits(mn || null);
        setCarrierDotLookupError(null);
        setToast({ message: data.legalName ? `Verified: ${data.legalName}` : 'Carrier verified.', type: 'success' });
        setCompanyNameFlash(true);
      } catch {
        if (!cancelled) {
          setCarrierDotLookupError('Verification failed. Please try again.');
          setToast({ message: 'Verification failed. Please try again.' });
        }
      } finally {
        if (!cancelled) setCarrierDotLookupLoading(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [usdot, accountType, step]);

  /** Debounced FMCSA MC lookup — carrier (500ms). */
  useEffect(() => {
    if (accountType !== 'carrier' || step !== 'company') return;
    const digits = mcNumber.replace(/\D/g, '');
    if (digits.length < 4) {
      setCarrierMcLookupLoading(false);
      setCarrierMcLookupError(null);
      setFmcsaCarrierMcDigits(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setCarrierMcLookupLoading(true);
      setCarrierMcLookupError(null);
      try {
        const res = await fetch(`/api/verify-mc?mcNumber=${encodeURIComponent(digits)}`);
        let data: {
          error?: string;
          legalName?: string | null;
          physicalAddress?: string | null;
          authorityType?: string;
          authority_type?: string;
          dot_number?: string | null;
          mc_number?: string | null;
        } = {};
        try {
          data = await res.json();
        } catch {
          if (!cancelled) setCarrierMcLookupError('Invalid response from verification.');
          return;
        }
        if (cancelled) return;
        if (!res.ok) {
          setCarrierMcLookupError(
            typeof data.error === 'string' ? data.error : 'MC number not found or lookup failed.'
          );
          setFmcsaCarrierMcDigits(null);
          return;
        }
        const mcRole = parseAuthorityRole(data);
        if (mcRole === 'BROKER') {
          setCarrierMcLookupError(
            'This MC number belongs to a Brokerage. Please use the Broker signup page.'
          );
          setFmcsaCarrierMcDigits(null);
          setFmcsaCarrierDotDigits(null);
          return;
        }
        if (data.legalName) setCompanyName(String(data.legalName));
        if (data.physicalAddress) setCarrierPhysicalAddress(String(data.physicalAddress));
        const dn = data.dot_number != null ? String(data.dot_number).replace(/\D/g, '') : '';
        const mn = data.mc_number != null ? String(data.mc_number).replace(/\D/g, '') : '';
        if (dn) setUsdot(dn);
        setMcNumber(mn || digits);
        setFmcsaCarrierDotDigits(dn || null);
        setFmcsaCarrierMcDigits(mn || digits || null);
        setCarrierMcLookupError(null);
        setToast({ message: data.legalName ? `Verified: ${data.legalName}` : 'Carrier verified.', type: 'success' });
        setCompanyNameFlash(true);
      } catch {
        if (!cancelled) setCarrierMcLookupError('Lookup failed. Please try again.');
      } finally {
        if (!cancelled) setCarrierMcLookupLoading(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [mcNumber, accountType, step]);

  const carrierDotConfirmed =
    fmcsaCarrierDotDigits != null &&
    usdot.replace(/\D/g, '') === fmcsaCarrierDotDigits &&
    usdot.replace(/\D/g, '').length >= 4;

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountType) return;
    setLoading(true);
    setMessage('');

    if (accountType === 'carrier') {
      const fleetNum = fleetSize.trim() ? parseInt(fleetSize, 10) : null;
      if (fleetSize.trim() && (fleetNum == null || Number.isNaN(fleetNum) || fleetNum < 0)) {
        setLoading(false);
        setMessage('Fleet size must be a valid number.');
        return;
      }
      const res = await fetch('/api/signup-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: 'carrier',
          companyName: companyName.trim(),
          usdotNumber: usdot.trim(),
          mcNumber: mcNumber.replace(/\D/g, '') || null,
          fleetSize: fleetNum,
          address: carrierPhysicalAddress.trim() || null,
        }),
      });
      let result: { orgId?: string; error?: string } = {};
      try {
        result = await res.json();
      } catch {
        setLoading(false);
        setMessage('Could not create organization. Please try again.');
        return;
      }
      setLoading(false);
      if (!res.ok || result.error) {
        setMessage(result.error ?? 'Could not create organization.');
        return;
      }
      if (!result.orgId) {
        setMessage('Could not create organization.');
        return;
      }
      setOrgId(result.orgId);
      setStep('account');
      return;
    }

    const res = await fetch('/api/signup-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountType: 'broker',
        brokerageName: brokerageName.trim(),
        mcNumber: mcNumber.replace(/\D/g, ''),
        usdotNumber: brokerUsdot.replace(/\D/g, '') || null,
        address: brokerPhysicalAddress.trim() || null,
      }),
    });
    let result: { orgId?: string; error?: string } = {};
    try {
      result = await res.json();
    } catch {
      setLoading(false);
      setMessage('Could not create organization. Please try again.');
      return;
    }
    setLoading(false);
    if (!res.ok || result.error) {
      setMessage(result.error ?? 'Could not create organization.');
      return;
    }
    if (!result.orgId) {
      setMessage('Could not create organization.');
      return;
    }
    setOrgId(result.orgId);
    setFullName((n) => n || contactPerson.trim());
    setStep('account');
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !accountType) return;
    setLoading(true);
    setMessage('');
    const supabase = getSupabaseClient();

    const nameForProfile = fullName.trim() || contactPerson.trim() || null;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent('/dashboard')}`,
        data: {
          full_name: nameForProfile,
          user_role: accountType,
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setMessage(signUpError.message);
      return;
    }

    const user = signUpData.user;
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          org_id: orgId,
          role: 'Owner',
          full_name: nameForProfile,
          account_type: accountType,
        })
        .or(`id.eq.${user.id},user_id.eq.${user.id}`);

      if (profileError) {
        setLoading(false);
        setMessage(profileError.message || 'Could not update profile.');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_beta_tester, account_type')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .single();

      const isBeta = (profile as { is_beta_tester?: boolean } | null)?.is_beta_tester === true;
      const at = (profile as { account_type?: string | null } | null)?.account_type ?? accountType;

      if (isBeta) {
        const dest = at === 'broker' ? '/dashboard/loads' : '/dashboard/dispatch';
        router.push(`${dest}?welcome=beta`);
      } else {
        router.push('/pricing');
      }
      router.refresh();
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push('/login?message=Check your email to confirm your account.');
    router.refresh();
  };

  const selectRole = (t: SignupAccountType) => {
    setAccountType(t);
    setMessage('');
    setCompanyName('');
    setUsdot('');
    setFleetSize('');
    setBrokerageName('');
    setBrokerPhysicalAddress('');
    setBrokerUsdot('');
    setMcNumber('');
    setCarrierPhysicalAddress('');
    setContactPerson('');
    setBrokerMcLookupLoading(false);
    setBrokerDotLookupLoading(false);
    setBrokerMcLookupError(null);
    setBrokerDotLookupError(null);
    setBrokerVerifiedBroker(false);
    setFmcsaBrokerDotDigits(null);
    setFmcsaBrokerMcDigits(null);
    setFmcsaCarrierDotDigits(null);
    setFmcsaCarrierMcDigits(null);
    setCarrierDotLookupLoading(false);
    setCarrierMcLookupLoading(false);
    setCarrierDotLookupError(null);
    setCarrierMcLookupError(null);
    setStep('company');
  };


  const roleCardClass =
    'relative flex flex-col items-center text-center gap-3 rounded-2xl border-2 border-white/15 bg-midnight-ink/60 p-8 transition-all min-h-[160px] justify-center hover:border-cyber-amber/40 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyber-amber/50';

  if (step === 'role') {
    return (
      <div className="space-y-6">
        <p className="text-sm text-soft-cloud/80 text-center">Choose how you operate—we’ll tailor your workspace.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button type="button" onClick={() => selectRole('carrier')} className={roleCardClass}>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-cyber-amber/35 bg-cyber-amber/15">
              <Truck className="size-7 text-cyber-amber" strokeWidth={2} />
            </div>
            <span className="text-lg font-bold text-soft-cloud">Carrier</span>
            <span className="text-xs text-soft-cloud/60">Asset fleet, own authority, DOT operations</span>
          </button>
          <button type="button" onClick={() => selectRole('broker')} className={roleCardClass}>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-cyber-amber/35 bg-cyber-amber/15">
              <Briefcase className="size-7 text-cyber-amber" strokeWidth={2} />
            </div>
            <span className="text-lg font-bold text-soft-cloud">Broker</span>
            <span className="text-xs text-soft-cloud/60">Freight brokerage, MC#, tender loads to carriers</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'company' && accountType === 'carrier') {
    return (
      <div className="relative">
        {toast && (
          <div
            className={`mb-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
              toast.type === 'success' ? 'border-green-500/50 bg-green-500/10 text-green-200' : 'border-red-500/50 bg-red-500/10 text-red-200'
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className={`shrink-0 rounded p-1 ${toast.type === 'success' ? 'hover:bg-green-500/20' : 'hover:bg-red-500/20'}`}
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <div>
            <label htmlFor="usdot" className="block text-sm font-medium text-soft-cloud/90 mb-1">USDOT number *</label>
            <div className="relative">
              <motion.input
                id="usdot"
                type="text"
                value={usdot}
                onChange={(e) => {
                  setUsdot(e.target.value);
                  setFmcsaCarrierDotDigits(null);
                  setCarrierDotLookupError(null);
                  setDotInputError(false);
                }}
                required
                animate={dotInputError ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className={`w-full px-4 py-3 pr-24 rounded-xl bg-white/5 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 border transition-colors ${dotInputError ? 'border-red-500' : 'border-white/20'}`}
                placeholder="e.g. 1234567"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {carrierDotLookupLoading && (
                  <span className="text-xs font-medium text-cyber-amber/90">Looking up…</span>
                )}
                {!carrierDotLookupLoading &&
                  fmcsaCarrierDotDigits != null &&
                  usdot.replace(/\D/g, '') === fmcsaCarrierDotDigits && (
                    <CheckCircle2 className="size-5 shrink-0 text-green-500" aria-label="USDOT matched FMCSA" />
                  )}
              </div>
            </div>
            {carrierDotConfirmed && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-green-500">
                <CheckCircle2 className="size-4 shrink-0" />
                <span className="inline-flex items-center rounded-md bg-green-500/15 px-2 py-0.5 font-medium text-green-400">Synced with FMCSA (MCS-150 census)</span>
              </p>
            )}
            {carrierDotLookupError && <p className="mt-1 text-sm text-red-400">{carrierDotLookupError}</p>}
            {usdot.replace(/\D/g, '').length >= 2 &&
              (() => {
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
            <label htmlFor="carrierMc" className="block text-sm font-medium text-soft-cloud/90 mb-1">MC number</label>
            <div className="relative">
              <input
                id="carrierMc"
                type="text"
                inputMode="numeric"
                value={mcNumber}
                onChange={(e) => {
                  setMcNumber(e.target.value.replace(/\D/g, ''));
                  setFmcsaCarrierMcDigits(null);
                  setCarrierMcLookupError(null);
                }}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors"
                placeholder="From FMCSA (optional if unknown)"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {carrierMcLookupLoading && (
                  <span className="text-xs font-medium text-cyber-amber/90">Looking up…</span>
                )}
                {!carrierMcLookupLoading &&
                  fmcsaCarrierMcDigits != null &&
                  mcNumber.replace(/\D/g, '') === fmcsaCarrierMcDigits &&
                  mcNumber.replace(/\D/g, '').length >= 4 && (
                    <CheckCircle2 className="size-5 shrink-0 text-green-500" aria-label="MC matched FMCSA" />
                  )}
              </div>
            </div>
            {carrierMcLookupError && <p className="mt-1 text-sm text-red-400">{carrierMcLookupError}</p>}
          </div>
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-soft-cloud/90 mb-1">Company name *</label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-all duration-200 ${
                companyNameFlash ? 'border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.4)]' : carrierDotConfirmed ? 'border-green-500/50 shadow-[0_0_14px_rgba(34,197,94,0.35)]' : 'border-white/20'
              }`}
              placeholder="Acme Trucking LLC"
            />
          </div>
          <div>
            <label htmlFor="carrierPhysicalAddress" className="block text-sm font-medium text-soft-cloud/90 mb-1">
              Physical address
            </label>
            <textarea
              id="carrierPhysicalAddress"
              value={carrierPhysicalAddress}
              onChange={(e) => setCarrierPhysicalAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors resize-y min-h-[5rem]"
              placeholder="Street, city, state (from FMCSA — edit if needed)"
            />
          </div>
          <div>
            <label htmlFor="fleetSize" className="block text-sm font-medium text-soft-cloud/90 mb-1">Fleet size</label>
            <input
              id="fleetSize"
              type="number"
              min={0}
              inputMode="numeric"
              value={fleetSize}
              onChange={(e) => setFleetSize(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors"
              placeholder="e.g. 12"
            />
          </div>
          {message && <p className="text-sm text-red-400">{message}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep('role')} className="py-3 px-4 rounded-xl border border-white/20 text-soft-cloud hover:bg-white/10 font-medium transition-colors">
              Back
            </button>
            <button type="submit" disabled={loading || !carrierDotConfirmed} className="flex-1 py-3 rounded-xl bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-midnight-ink font-semibold transition-colors">
              {loading ? 'Creating…' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'company' && accountType === 'broker') {
    return (
      <form onSubmit={handleCompanySubmit} className="space-y-4">
        <div>
          <label htmlFor="mcNumber" className="block text-sm font-medium text-soft-cloud/90 mb-1">
            MC number *
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                id="mcNumber"
                type="text"
                inputMode="numeric"
                value={mcNumber}
                onChange={(e) => {
                  setMcNumber(e.target.value.replace(/\D/g, ''));
                  setFmcsaBrokerMcDigits(null);
                  setBrokerMcLookupError(null);
                  setBrokerVerifiedBroker(false);
                }}
                required
                minLength={4}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors pr-28"
                placeholder="MC number * (Brokerage Authority Required)"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {brokerMcLookupLoading && (
                  <span className="text-xs font-medium text-cyber-amber/90">Looking up…</span>
                )}
              </div>
            </div>
            {brokerVerifiedBroker && !brokerMcLookupLoading && (
              <span className="inline-flex shrink-0 items-center rounded-full border border-green-500/45 bg-green-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-green-400">
                Verified Broker
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-soft-cloud/55 leading-relaxed">
            First 5 founders: 90 days of Enterprise-level access on us. No credit card required.
          </p>
          {brokerMcLookupError && <p className="mt-2 text-sm text-red-400">{brokerMcLookupError}</p>}
        </div>
        <div>
          <label htmlFor="brokerUsdot" className="block text-sm font-medium text-soft-cloud/90 mb-1">
            USDOT number
          </label>
          <p className="text-xs text-soft-cloud/50 mb-1.5">Prefilled when you enter an MC; or enter a DOT to load MC and company data.</p>
          <div className="relative">
            <input
              id="brokerUsdot"
              type="text"
              inputMode="numeric"
              value={brokerUsdot}
              onChange={(e) => {
                setBrokerUsdot(e.target.value.replace(/\D/g, ''));
                setFmcsaBrokerDotDigits(null);
                setBrokerDotLookupError(null);
                setBrokerVerifiedBroker(false);
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors pr-24"
              placeholder="e.g. 1234567"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {brokerDotLookupLoading && (
                <span className="text-xs font-medium text-cyber-amber/90">Looking up…</span>
              )}
              {!brokerDotLookupLoading &&
                fmcsaBrokerDotDigits != null &&
                brokerUsdot.replace(/\D/g, '') === fmcsaBrokerDotDigits &&
                brokerUsdot.replace(/\D/g, '').length >= 5 && (
                  <CheckCircle2 className="size-5 shrink-0 text-green-500" aria-label="USDOT matched FMCSA" />
                )}
            </div>
          </div>
          {brokerDotLookupError && <p className="mt-1 text-sm text-red-400">{brokerDotLookupError}</p>}
        </div>
        <div>
          <label htmlFor="brokerageName" className="block text-sm font-medium text-soft-cloud/90 mb-1">
            Brokerage name *
          </label>
          <p className="text-xs text-soft-cloud/50 mb-1.5">Prefilled from FMCSA; edit if you use a DBA or the record is outdated.</p>
          <input
            id="brokerageName"
            type="text"
            value={brokerageName}
            onChange={(e) => setBrokerageName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors"
            placeholder="Legal name from FMCSA"
          />
        </div>
        <div>
          <label htmlFor="brokerPhysicalAddress" className="block text-sm font-medium text-soft-cloud/90 mb-1">
            Physical address
          </label>
          <textarea
            id="brokerPhysicalAddress"
            value={brokerPhysicalAddress}
            onChange={(e) => setBrokerPhysicalAddress(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors resize-y min-h-[5rem]"
            placeholder="Street, city, state (from FMCSA — edit if needed)"
          />
        </div>
        <div>
          <label htmlFor="contactPerson" className="block text-sm font-medium text-soft-cloud/90 mb-1">Contact person *</label>
          <input
            id="contactPerson"
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors"
            placeholder="Primary contact name"
          />
        </div>
        {message && <p className="text-sm text-red-400">{message}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setStep('role')} className="py-3 px-4 rounded-xl border border-white/20 text-soft-cloud hover:bg-white/10 font-medium transition-colors">
            Back
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-midnight-ink font-semibold transition-colors">
            {loading ? 'Creating…' : 'Continue'}
          </button>
        </div>
      </form>
    );
  }

  const companyLabel = accountType === 'carrier' ? companyName : brokerageName;

  return (
    <form onSubmit={handleAccountSubmit} className="space-y-4">
      <p className="text-soft-cloud/70 text-sm">
        {accountType === 'carrier' ? 'Carrier' : 'Broker'} · <span className="text-soft-cloud">{companyLabel}</span>
      </p>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-soft-cloud/90 mb-1">Full name</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors"
          placeholder={accountType === 'broker' ? contactPerson || 'Your name' : 'Your name'}
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-soft-cloud/90 mb-1">Email *</label>
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
        <label htmlFor="password" className="block text-sm font-medium text-soft-cloud/90 mb-1">Password *</label>
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
        <button type="button" onClick={() => setStep('company')} className="py-3 px-4 rounded-xl border border-white/20 text-soft-cloud hover:bg-white/10 font-medium transition-colors">
          Back
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-midnight-ink font-semibold transition-colors">
          {loading ? 'Signing up…' : 'Sign up'}
        </button>
      </div>
    </form>
  );
}
