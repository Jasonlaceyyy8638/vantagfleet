'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navbar } from '@/components/Navbar';
import { Pricing } from '@/components/Pricing';
import { HeroLoginCard } from '@/components/HeroLoginCard';
import {
  Truck,
  ArrowRight,
  Plug,
  Map,
  Wallet,
  BarChart3,
  X,
  ChevronDown,
  Smartphone,
  Monitor,
  LayoutGrid,
  Route,
  Radio,
  Landmark,
  Fuel,
  ShieldCheck,
} from 'lucide-react';
import type { NavbarRole } from '@/lib/admin';
import { HeroDispatchPreview } from '@/components/landing/HeroDispatchPreview';
import { DemoMapMock } from '@/components/landing/DemoMapMock';
import { DemoRolePickerModal } from '@/components/landing/DemoRolePickerModal';
import { demoLoads, demoLoadLaneLabel } from '@/src/constants/demoData';

const glassCardClass =
  'backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_0_40px_-12px_rgba(255,176,0,0.15)]';

/** Full TMS-style pillars — matches how buyers evaluate Alvys-class platforms (without naming competitors). */
const ENTERPRISE_STACK = [
  {
    title: 'Dispatch & load control',
    body: 'Plan, assign, and execute loads from one board—status, equipment, and exceptions visible at a glance.',
    Icon: Route,
  },
  {
    title: 'Real-time visibility',
    body: 'ELD-linked positions and stop-level context so dispatch, ops, and customers share one truth.',
    Icon: Radio,
  },
  {
    title: 'Settlements & pay',
    body: 'Driver pay, carrier rates, and customer billing logic tied to the same load record—fewer disputes, faster closes.',
    Icon: Landmark,
  },
  {
    title: 'IFTA & fuel',
    body: 'Mileage and fuel data organized for reporting—built for audit-ready workflows, not end-of-quarter panic.',
    Icon: Fuel,
  },
  {
    title: 'Safety & compliance',
    body: 'Documents, expirations, and fleet health signals in-app—operations-first, not a bolt-on filing shop.',
    Icon: ShieldCheck,
  },
  {
    title: 'Integrations',
    body: 'Motive, Geotab, and the rest of your stack connected where it matters—fewer portals, fewer copy-paste errors.',
    Icon: Plug,
  },
] as const;

type LandingPageProps = { isAuthenticated?: boolean; navbarRole?: NavbarRole | null };

export function LandingPage({ isAuthenticated = false, navbarRole = null }: LandingPageProps) {
  const searchParams = useSearchParams();

  const [demoRoleModalOpen, setDemoRoleModalOpen] = useState(false);

  const [driverAppNotifyOpen, setDriverAppNotifyOpen] = useState(false);
  const [driverAppNotifyEmail, setDriverAppNotifyEmail] = useState('');
  const [driverAppNotifySubmitting, setDriverAppNotifySubmitting] = useState(false);
  const [driverAppNotifySuccess, setDriverAppNotifySuccess] = useState(false);
  const [driverAppNotifyError, setDriverAppNotifyError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      const url = new URL('/auth/callback', window.location.origin);
      url.searchParams.set('code', code);
      url.searchParams.set('redirectTo', '/dashboard');
      window.location.replace(url.toString());
    }
  }, [searchParams]);

  const handleDriverAppNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriverAppNotifyError(null);
    setDriverAppNotifySubmitting(true);
    try {
      const res = await fetch('/api/driver-app-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: driverAppNotifyEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDriverAppNotifyError(data?.error ?? 'Something went wrong.');
        return;
      }
      setDriverAppNotifySuccess(true);
      setDriverAppNotifyEmail('');
    } catch {
      setDriverAppNotifyError('Network error. Try again.');
    } finally {
      setDriverAppNotifySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-midnight-ink overflow-x-hidden w-full max-w-[100vw]">
      <Navbar
        isAuthenticated={isAuthenticated}
        signupHref="/signup"
        signupLabel="Get Started"
        topOffsetPx={0}
        showAnnouncementInBar
      />
      <DemoRolePickerModal open={demoRoleModalOpen} onClose={() => setDemoRoleModalOpen(false)} />

      {/* Spacer: matches Navbar — safe-area + h-20 row (see Navbar.tsx) */}
      <div
        className="w-full shrink-0"
        style={{
          minHeight: 'calc(5rem + max(0.5rem, env(safe-area-inset-top, 0px)))',
        }}
        aria-hidden
      />

      {/* Hero: fixed Navbar is z-50; extra top padding + stacking so headline never sits under the bar */}
      <section className="relative z-0 flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-midnight-ink pt-24 sm:pt-28 md:pt-32 sm:min-h-screen">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-midnight-ink via-[#0a1020] to-cyber-amber/15" aria-hidden />
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,176,0,0.12),transparent)]" aria-hidden />

        <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-0 px-4 pb-safe pt-2 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:py-10 xl:gap-16">
          <div className="flex-1 text-center lg:text-left min-w-0">
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight"
            >
              Freight Operations,{' '}
              <span style={{ color: '#FFBF00' }}>Hardened</span>.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-lg sm:text-xl text-soft-cloud/85 max-w-2xl mx-auto lg:mx-0"
            >
              VantagFleet gives Carriers and Brokers a unified command center for live dispatching and high-fidelity load
              management.
            </motion.p>
            {!isAuthenticated && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4"
              >
                <button
                  type="button"
                  onClick={() => document.getElementById('command-center')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="text-sm text-cyber-amber/90 hover:text-cyber-amber underline underline-offset-2"
                >
                  See the command center →
                </button>
              </motion.p>
            )}
            {!isAuthenticated ? (
              <>
                <div className="mt-10 w-full flex flex-col items-center lg:items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setDemoRoleModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 min-h-[56px] sm:min-h-[60px] px-8 sm:px-12 py-4 rounded-2xl bg-cyber-amber text-midnight-ink font-extrabold text-base sm:text-lg hover:bg-cyber-amber/90 active:scale-[0.98] transition-all shadow-[0_0_44px_-8px_rgba(255,176,0,0.45)] touch-manipulation border-2 border-cyber-amber/85 w-full sm:w-auto text-center"
                  >
                    Click to Launch Live Interactive Demo
                    <LayoutGrid className="size-5 shrink-0" />
                  </button>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 sm:px-8 py-3 rounded-xl border-2 border-white/25 text-white font-semibold hover:border-cyber-amber/50 hover:text-cyber-amber transition-colors w-full sm:w-auto"
                  >
                    Start Moving Freight
                    <ArrowRight className="size-5 shrink-0" />
                  </Link>
                  <a
                    href="mailto:info@vantagfleet.com"
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl text-sm text-soft-cloud/80 hover:text-cyber-amber transition-colors no-underline"
                  >
                    Contact Sales
                  </a>
                  <HeroLoginCard redirectTo="/dashboard" />
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4"
                >
                  <p className="text-sm text-slate-300">
                    Already have an account?{' '}
                    <Link href="/login" className="text-cyber-amber hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-10 flex flex-col items-center lg:items-start gap-6"
              >
                <Link
                  href={
                    navbarRole === 'ADMIN' || navbarRole === 'EMPLOYEE' ? '/admin' : '/dashboard'
                  }
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-cyber-amber text-midnight-ink font-bold text-lg hover:bg-cyber-amber/90 transition-colors shadow-lg shadow-cyber-amber/20"
                >
                  {navbarRole === 'ADMIN' || navbarRole === 'EMPLOYEE'
                    ? 'Admin Console'
                    : 'Go to Dashboard'}
                  <ArrowRight className="size-5" />
                </Link>
              </motion.div>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15 }}
            className="flex-1 mt-12 lg:mt-0 w-full max-w-xl mx-auto lg:max-w-none lg:mx-0"
          >
            <p className="sr-only">Live interactive dashboard preview</p>
            <HeroDispatchPreview />
          </motion.div>
        </main>
      </section>

      {/* Truth / Why — three columns */}
      <section className="relative py-24 px-4 bg-[#0f172a] border-t border-slate-600/30">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-4 tracking-tight"
          >
            The <span className="text-cyber-amber">Truth</span>
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              { text: 'Dispatch and settlements in one system—so your team spends less time on the phone and more time moving loads.' },
              { text: 'Motive & Geotab live positions on the map, with load status and ETAs visible from the same board you dispatch from.' },
              { text: 'Desktop-grade speed with Tauri: a command center that feels as serious as your operation.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-slate-600/50 bg-slate-800/40 text-center"
              >
                <p className="text-slate-200 text-lg font-medium leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise TMS stack — buyer checklist (parity framing vs all-in-one TMS category) */}
      <section className="relative py-24 px-4 bg-brand-navy border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-3 tracking-tight"
          >
            One platform. <span className="text-cyber-amber">Serious logistics</span> infrastructure.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-center text-soft-cloud/65 max-w-2xl mx-auto mb-12 text-base"
          >
            The same operational pillars buyers expect from an all-in-one TMS—dispatch, money, compliance, and
            visibility—without stitching together five different tools.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ENTERPRISE_STACK.map(({ title, body, Icon }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className="rounded-2xl border border-white/[0.08] bg-[var(--brand-navy-deep)]/90 p-6 flex flex-col gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyber-amber/25 bg-cyber-amber/10">
                  <Icon className="size-5 text-cyber-amber" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-white leading-snug">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed flex-1">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live demo CTA (replaces founder video block) */}
      <section className="relative py-20 px-4 bg-midnight-ink border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-2xl sm:text-3xl font-bold text-soft-cloud mb-4"
          >
            Try the full <span className="text-cyber-amber">TMS sandbox</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-soft-cloud/65 mb-10 max-w-xl mx-auto"
          >
            No signup required for the interactive demo—click through Dispatch, operations, and Accounting with sample
            data.
          </motion.p>
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <button
                type="button"
                onClick={() => setDemoRoleModalOpen(true)}
                className="inline-flex items-center justify-center gap-3 min-h-[60px] px-10 sm:px-14 py-4 rounded-2xl bg-cyber-amber text-midnight-ink font-extrabold text-lg sm:text-xl hover:bg-cyber-amber/90 transition-all shadow-[0_0_48px_-10px_rgba(255,176,0,0.4)] border-2 border-cyber-amber/85"
              >
                Click to Launch Live Interactive Demo
                <LayoutGrid className="size-6 shrink-0" />
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Command center preview — map + dispatch board mock */}
      <section id="command-center" className="relative py-24 px-4 bg-midnight-ink border-t border-white/5 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-soft-cloud text-center mb-2"
          >
            Your <span className="text-cyber-amber">command center</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-soft-cloud/60 text-center mb-12 max-w-2xl mx-auto"
          >
            Live Mapbox tracking plus dispatch context in one view—see trucks, loads, and stops without jumping between tools.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7 }}
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-card shadow-[0_0_80px_-20px_rgba(255,176,0,0.15)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[280px] lg:min-h-[320px]">
              <div className="lg:col-span-3 relative bg-gradient-to-br from-[#0b1220] via-midnight-ink to-[#0f172a] border-b lg:border-b-0 lg:border-r border-white/10">
                <div className="absolute inset-0 opacity-25 map-grid-pattern" aria-hidden />
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-soft-cloud/80">
                  <Map className="size-3.5 text-cyber-amber" aria-hidden />
                  Map view
                </div>
                <div className="relative h-full min-h-[200px] lg:min-h-0 flex items-center justify-center p-4 sm:p-6">
                  <div className="relative w-full max-w-md">
                    <DemoMapMock className="shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]" />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 flex flex-col bg-[#0a0f1a]/95 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyber-amber/30 bg-cyber-amber/10">
                    <LayoutGrid className="size-4 text-cyber-amber" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-cyber-amber/90">Dispatch board</p>
                    <p className="text-xs text-soft-cloud/50">Active loads · ELD-linked</p>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  {demoLoads.map((load) => {
                    const dot =
                      load.status === 'In Transit'
                        ? 'bg-emerald-400'
                        : load.status === 'At Pickup'
                          ? 'bg-cyber-amber'
                          : load.status === 'Delivered'
                            ? 'bg-sky-400'
                            : 'bg-slate-400';
                    return (
                      <div
                        key={load.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-midnight-ink/60 px-3 py-2.5 text-left"
                      >
                        <div>
                          <p className="text-xs font-semibold text-soft-cloud">{load.reference_number}</p>
                          <p className="text-[11px] text-soft-cloud/50">{demoLoadLaneLabel(load)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
                          <span className="text-[10px] font-medium text-soft-cloud/70">{load.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-[10px] text-soft-cloud/40 text-center">Preview UI — not live data</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Enterprise Pillar — freight operations */}
      <section className="relative py-24 px-4 bg-midnight-ink border-t border-slate-600/30">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold text-white text-center mb-3 tracking-tight"
          >
            The VantagFleet Standard: <span className="text-cyber-amber">Move freight.</span> Stay defensible.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14"
          >
            <div className="rounded-2xl border border-slate-600/50 bg-slate-900/50 p-8 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-cyber-amber/15 border border-cyber-amber/30 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-cyber-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Asset Protection</h3>
              <p className="text-slate-400 text-sm mb-4 flex-1">Engine diagnostics and real-time GPS keep your fleet visible and your assets protected. Know where every unit is, every minute.</p>
              <ul className="text-slate-300 text-sm space-y-1.5">
                <li className="flex items-center gap-2"><span className="text-cyber-amber">•</span> Real-time GPS tracking</li>
                <li className="flex items-center gap-2"><span className="text-cyber-amber">•</span> Engine diagnostics</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-600/50 bg-slate-900/50 p-8 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-electric-teal/15 border border-electric-teal/30 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-electric-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Profitability Analytics</h3>
              <p className="text-slate-400 text-sm mb-4 flex-1">Lane-level margin signals and settlement visibility so you know which freight actually pays—before you book the next load.</p>
              <ul className="text-slate-300 text-sm space-y-1.5">
                <li className="flex items-center gap-2"><span className="text-electric-teal">•</span> Revenue vs. cost by lane</li>
                <li className="flex items-center gap-2"><span className="text-electric-teal">•</span> Settlement rollups</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-600/50 bg-slate-900/50 p-8 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-cyber-amber/15 border border-cyber-amber/30 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-cyber-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Real-Time Load Tracking</h3>
              <p className="text-slate-400 text-sm mb-4 flex-1">Live positions and status in one place—dispatch, customers, and ops see the same truth without chasing screenshots.</p>
              <ul className="text-slate-300 text-sm space-y-1.5">
                <li className="flex items-center gap-2"><span className="text-cyber-amber">•</span> ELD-linked map context</li>
                <li className="flex items-center gap-2"><span className="text-cyber-amber">•</span> Pickup & delivery visibility</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Fleet health score */}
      <section id="compliance-score" className="relative py-24 px-4 bg-[#0f172a] border-t border-slate-600/30 overflow-hidden scroll-mt-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(255,176,0,0.06),transparent)] pointer-events-none" aria-hidden />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight"
          >
            Fleet health score
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-slate-400 text-lg mb-10 font-medium max-w-xl mx-auto"
          >
            Built for carriers that can&apos;t afford downtime or missed deliveries—operations first, visibility everywhere.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="inline-flex flex-col items-center justify-center rounded-2xl border-2 border-cyber-amber/50 bg-slate-800/60 backdrop-blur-sm px-12 py-10 shadow-[0_0_60px_-12px_rgba(255,176,0,0.2)]"
          >
            <span className="text-6xl sm:text-7xl md:text-8xl font-black text-cyber-amber tracking-tighter leading-none">A+</span>
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-widest mt-3">Road-ready</span>
          </motion.div>
        </div>
      </section>

      {/* Integrations — single premium section */}
      <section id="integrations" className="relative py-24 sm:py-28 px-4 bg-[#0f172a] border-t border-slate-600/30 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-center text-cyber-amber text-xs font-semibold uppercase tracking-[0.2em] mb-4"
          >
            Telematics & TMS in one place
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-[2.25rem] font-bold text-white text-center mb-2 tracking-tight"
          >
            One dashboard. Every integration.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-slate-400 text-center mb-14 font-medium max-w-xl mx-auto"
          >
            Connect your ELD and telematics. One source of truth for dispatch, miles, and load lifecycle.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            <Link
              href={isAuthenticated ? '/dashboard/integrations' : '/signup'}
              className="rounded-xl border border-slate-600/50 bg-slate-800/50 p-6 flex flex-col justify-between min-h-[160px] hover:border-cyber-amber/40 hover:bg-slate-800/70 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-cyber-amber/15 border border-cyber-amber/25">
                  <Plug className="size-5 text-cyber-amber" strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-white">Motive</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">Fleet and HOS in one click.</p>
              <span className="inline-flex items-center gap-1.5 text-cyber-amber text-sm font-semibold group-hover:gap-2 transition-all">
                Connect <ArrowRight className="size-4" />
              </span>
            </Link>
            <Link
              href={isAuthenticated ? '/dashboard/integrations' : '/signup'}
              className="rounded-xl border border-slate-600/50 bg-slate-800/50 p-6 flex flex-col justify-between min-h-[160px] hover:border-cyber-amber/40 hover:bg-slate-800/70 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-cyber-amber/15 border border-cyber-amber/25">
                  <Plug className="size-5 text-cyber-amber" strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-white">Motus</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">Fuel and mileage data.</p>
              <span className="inline-flex items-center gap-1.5 text-cyber-amber text-sm font-semibold group-hover:gap-2 transition-all">
                Connect <ArrowRight className="size-4" />
              </span>
            </Link>
            <Link
              href={isAuthenticated ? '/dashboard/integrations' : '/signup'}
              className="rounded-xl border border-slate-600/50 bg-slate-800/50 p-6 flex flex-col justify-between min-h-[160px] hover:border-cyber-amber/40 hover:bg-slate-800/70 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-cyber-amber/15 border border-cyber-amber/25">
                  <Plug className="size-5 text-cyber-amber" strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-white">Geotab</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">Fleet and IFTA in one place.</p>
              <span className="inline-flex items-center gap-1.5 text-cyber-amber text-sm font-semibold group-hover:gap-2 transition-all">
                Connect <ArrowRight className="size-4" />
              </span>
            </Link>
            <div className="rounded-xl border border-slate-600/40 bg-slate-800/30 p-6 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-slate-600/30 border border-slate-500/30">
                  <Plug className="size-5 text-slate-500" strokeWidth={2} />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-300">Samsara</h3>
                  <span className="rounded bg-cyber-amber/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyber-amber">
                    Soon
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-4">Cameras and ELD. Notify when ready.</p>
              <span className="text-slate-500 text-sm font-medium">Coming soon</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof — scrolling logos bar */}
      <section className="relative py-16 overflow-hidden border-y border-white/10 bg-white/[0.02]">
        <p className="text-center text-soft-cloud/50 text-sm uppercase tracking-wider mb-8">
          Trusted by carriers on the road
        </p>
        <div className="flex w-max gap-16 items-center animate-scroll-logos">
          {[...Array(2)].map((_, set) => (
            <div key={set} className="flex gap-16 items-center shrink-0">
              {[
                'Midwest Haulers',
                'Cross-State Freight',
                'Eagle Line Logistics',
                'Tri-River Transport',
                'Summit Trucking',
                'Valley Fleet Co.',
                'Northern Routes',
                'Plains Carrier Group',
              ].map((name) => (
                <div
                  key={`${set}-${name}`}
                  className="flex items-center justify-center w-32 h-12 rounded-lg bg-white/5 border border-white/10 text-soft-cloud/60 text-sm font-semibold"
                >
                  {name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Features: glassmorphism cards */}
      <FeaturesSection />

      <section id="pricing" className="py-16 px-4 border-t border-slate-600/30 bg-[#0f172a] scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2 tracking-tight">Solo Pro, Fleet Master & Enterprise</h2>
          <p className="text-slate-400 text-center mb-10 font-medium">Enterprise grade. One dashboard. Choose what fits your fleet.</p>
          <Pricing />
        </div>
      </section>

      {/* Driver app — PWA: Add to Home Screen */}
      <section id="driver-app" className="relative py-24 px-4 bg-midnight-ink border-t border-slate-600/30 scroll-mt-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyber-amber/15 border border-cyber-amber/30 mb-6">
              <Smartphone className="size-7 text-cyber-amber" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
              Get VantagFleet on your phone
            </h2>
            <p className="text-slate-400 font-medium mb-10 max-w-xl mx-auto">
              Drivers: open this site on your phone, then add it to your home screen. You’ll get the full app experience—Roadside Shield, DOT logs, and incident reporting—without the app store.
            </p>
            <div className="text-left rounded-2xl border border-slate-600/50 bg-slate-800/40 p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="rounded-full w-8 h-8 flex items-center justify-center bg-cyber-amber/20 text-cyber-amber text-sm">1</span>
                Open VantagFleet in your phone’s browser
              </h3>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="rounded-full w-8 h-8 flex items-center justify-center bg-cyber-amber/20 text-cyber-amber text-sm">2</span>
                Add to Home Screen
              </h3>
              <ul className="space-y-4 pl-10 text-slate-300 font-medium">
                <li className="flex items-start gap-3">
                  <span className="text-cyber-amber mt-0.5">iPhone:</span>
                  <span>Tap the <strong className="text-white">Share</strong> icon (square with arrow) at the bottom of Safari, scroll down, then tap <strong className="text-white">Add to Home Screen</strong>. Name it “VantagFleet” and tap Add.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyber-amber mt-0.5">Android:</span>
                  <span>Tap the <strong className="text-white">three dots</strong> (⋮) in the top right of Chrome, then tap <strong className="text-white">Add to Home screen</strong> or <strong className="text-white">Install app</strong>. Confirm and the VantagFleet icon will appear on your home screen.</span>
                </li>
              </ul>
              <p className="text-slate-400 text-sm pt-2">
                Once added, open VantagFleet from your home screen like any other app. Log in with your driver account to access Roadside Shield and DOT inspection tools.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* Native app — Coming soon with store badges */}
      <section className="relative py-16 px-4 border-t border-slate-600/30 bg-[#0f172a]">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-cyber-amber font-semibold text-sm uppercase tracking-wider mb-3">Coming Soon</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">The VantagFleet Driver App</h2>
          <p className="text-slate-400 text-lg mb-6">
            Native App Store apps coming later. Get notified when they launch.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="opacity-50 grayscale pointer-events-none inline-block"
              aria-label="Download on the App Store (coming soon)"
            >
              <img
                src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83"
                alt="Download on the App Store"
                className="h-10 w-auto object-contain"
              />
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="opacity-50 grayscale pointer-events-none inline-block"
              aria-label="Get it on Google Play (coming soon)"
            >
              <img
                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                alt="Get it on Google Play"
                className="h-12 w-auto object-contain"
              />
            </a>
          </div>
          <button
            type="button"
            onClick={() => setDriverAppNotifyOpen(true)}
            className="text-cyber-amber text-sm font-semibold hover:underline"
          >
            Notify me when the Driver App launches
          </button>
        </div>
      </section>

      <CTASection isAuthenticated={isAuthenticated} navbarRole={navbarRole} />

      {/* Driver App — Notify Me modal */}
      <AnimatePresence>
        {driverAppNotifyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
              onClick={() => setDriverAppNotifyOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-5 overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="driver-app-notify-title"
            >
              <div className="w-full max-w-[min(28rem,100vw-2rem)] mx-auto my-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(255,191,0,0.2)] p-4 sm:p-6 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="driver-app-notify-title" className="text-lg font-semibold text-soft-cloud">
                    Notify me when the Driver App launches
                  </h3>
                  <button
                    type="button"
                    onClick={() => setDriverAppNotifyOpen(false)}
                    className="rounded-full p-2 text-soft-cloud/70 hover:text-amber-400 hover:bg-white/10 transition-colors"
                    aria-label="Close"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <p className="text-sm text-soft-cloud/70 mb-5">
                  We&apos;ll email you when the VantagFleet Driver App is available on the App Store and Google Play (Q3 2026).
                </p>
                {driverAppNotifySuccess ? (
                  <p className="text-soft-cloud py-4 text-center">You&apos;re on the list. We&apos;ll notify you at launch.</p>
                ) : (
                  <form onSubmit={handleDriverAppNotifySubmit} className="space-y-4">
                    <div>
                      <label htmlFor="driver-app-notify-email" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                        Email *
                      </label>
                      <input
                        id="driver-app-notify-email"
                        type="email"
                        required
                        value={driverAppNotifyEmail}
                        onChange={(e) => setDriverAppNotifyEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                      />
                    </div>
                    {driverAppNotifyError && (
                      <p className="text-sm text-red-400">{driverAppNotifyError}</p>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setDriverAppNotifyOpen(false)}
                        className="flex-1 py-2.5 rounded-xl border border-white/20 text-soft-cloud/80 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={driverAppNotifySubmitting}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 text-midnight-ink font-medium hover:bg-amber-400 disabled:opacity-60"
                      >
                        {driverAppNotifySubmitting ? 'Submitting…' : 'Notify Me'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Truck,
      title: 'Intelligent Dispatching',
      description:
        'Assign loads to the right drivers based on HOS and compliance status—so every truck you dispatch is eligible before it rolls.',
    },
    {
      icon: Map,
      title: 'Live Freight Tracking',
      description:
        'Real-time GPS visibility via Motive and Geotab integrations—see your fleet on the map with context, not just dots.',
    },
    {
      icon: Wallet,
      title: 'Financial Command',
      description:
        'One-click driver settlements, factoring integration, and IFTA automation—money moves with the load, not after the fact.',
    },
    {
      icon: BarChart3,
      title: 'Digital Document Vault',
      description:
        'Automate Rate Cons, BOLs, and PODs in a unified dashboard—paper trail without the paper cuts.',
    },
  ];

  return (
    <section id="tms-pillars" className="relative py-24 px-4 bg-midnight-ink border-t border-slate-600/30 scroll-mt-24">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-2 tracking-tight">
          Built for <span className="text-cyber-amber">modern carriers</span>
        </h2>
        <p className="text-slate-400 text-center max-w-2xl mx-auto mb-14 font-medium">
          Four pillars of a TMS that runs your operation—and keeps compliance in the loop by design.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: i * 0.08 }}
              className="p-6 rounded-2xl border border-slate-600/50 bg-slate-800/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
            >
              <item.icon className="size-10 text-cyber-amber mb-4" strokeWidth={2} />
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">{item.title}</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'What is IFTA?',
    a: 'IFTA (International Fuel Tax Agreement) lets you file one fuel tax report for all member jurisdictions. VantagFleet pulls mileage and fuel data from your ELD so you can generate IFTA-ready reports and stay compliant across states.',
  },
  {
    q: 'How do settlements and documents work?',
    a: 'Loads, rates, and driver pay roll up in one place. Export what your accounting team needs without stitching spreadsheets from five systems.',
  },
  {
    q: 'Do you integrate with my ELD?',
    a: 'We integrate with Motive, Motus, Geotab, and Samsara (coming soon). If you use one of these, connect it in Settings to sync logs and mileage. More integrations are on the roadmap.',
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="relative py-24 px-4 bg-[#0f172a] border-t border-slate-600/30">
      <div className="max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-white text-center mb-2 tracking-tight"
        >
          Frequently Asked Questions
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-slate-400 text-center mb-12 font-medium"
        >
          Quick answers about TMS features, IFTA, and integrations.
        </motion.p>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-slate-600/50 bg-slate-800/40 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-white font-semibold hover:bg-slate-700/30 transition-colors"
              >
                {item.q}
                <ChevronDown
                  className={`size-5 shrink-0 text-slate-400 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 pt-0 text-slate-400 font-medium">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({
  isAuthenticated,
  navbarRole,
}: {
  isAuthenticated: boolean;
  navbarRole?: NavbarRole | null;
}) {
  return (
    <section id="contact" className="relative py-20 sm:py-28 md:py-32 px-4 sm:px-6 bg-[#0f172a] border-t border-slate-600/30 scroll-mt-24">
      <motion.div
        className="max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Modern TMS for carriers
        </h2>
        <p className="text-slate-400 text-lg mb-12 font-medium max-w-2xl mx-auto">
          Next-gen dispatch, tracking, and settlements in one secure platform. Join carriers and brokers who run from one command center.
        </p>
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4"
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Link
            href={isAuthenticated ? (navbarRole === 'ADMIN' || navbarRole === 'EMPLOYEE' ? '/admin' : '/dashboard') : '/signup'}
            className="inline-flex items-center justify-center gap-3 min-h-[52px] sm:min-h-[56px] px-8 sm:px-12 py-4 sm:py-5 rounded-2xl bg-cyber-amber text-midnight-ink font-bold text-lg sm:text-xl hover:bg-cyber-amber/90 active:scale-[0.98] transition-all shadow-[0_0_40px_-8px_rgba(255,176,0,0.5)] touch-manipulation border border-cyber-amber/30"
          >
            {isAuthenticated
              ? navbarRole === 'ADMIN' || navbarRole === 'EMPLOYEE'
                ? 'Admin Console'
                : 'Go to Dashboard'
              : 'Start Moving Freight'}
            <ArrowRight className="size-6" />
          </Link>
          {!isAuthenticated && (
            <>
              <a
                href="mailto:info@vantagfleet.com"
                className="inline-flex items-center justify-center min-h-[52px] px-8 py-4 rounded-2xl border-2 border-slate-500/50 text-white font-bold text-lg hover:border-cyber-amber/50 hover:text-cyber-amber transition-colors no-underline"
              >
                Contact Sales
              </a>
              <Link
                href="/download"
                className="hidden md:inline-flex items-center justify-center gap-2 min-h-[52px] px-8 py-4 rounded-2xl border-2 border-cyber-amber/50 bg-cyber-amber/10 text-cyber-amber font-bold text-lg hover:bg-cyber-amber/20 hover:border-cyber-amber transition-colors"
              >
                <Monitor className="size-5 shrink-0" aria-hidden />
                Download Desktop App
              </Link>
            </>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
