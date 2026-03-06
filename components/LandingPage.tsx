'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navbar } from '@/components/Navbar';
import { Pricing } from '@/components/Pricing';
import { HeroLoginCard } from '@/components/HeroLoginCard';
import { FileCheck, Users, Truck, Shield, ArrowRight, Plug, Quote, MapPin, X, Scale, FileText, Fuel, ChevronDown, Smartphone, Monitor } from 'lucide-react';
import type { NavbarRole } from '@/lib/admin';

const glassCardClass =
  'backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_0_40px_-12px_rgba(255,176,0,0.15)]';

type LandingPageProps = { isAuthenticated?: boolean; navbarRole?: NavbarRole | null };

// Hero video: env URL first (for production), then local, then Supabase, then Mixkit. Dedupe so React keys are unique.
const HERO_VIDEO_SOURCES = [
  ...(typeof process !== 'undefined' && process.env.NEXT_PUBLIC_HERO_VIDEO_URL
    ? [process.env.NEXT_PUBLIC_HERO_VIDEO_URL]
    : []),
  '/videos/hero-truck.mp4',
  'https://dmejysrnxvpjenutdypx.supabase.co/storage/v1/object/public/hero-assets/hero-truck.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-highway-traffic-at-night-with-long-exposure-4010-large.mp4',
]
  .filter(Boolean)
  .filter((url, i, arr) => arr.indexOf(url) === i);

// Founder story: env URL first (use Supabase when set), then local, then hardcoded Supabase. Dedupe for unique keys.
const FOUNDER_VIDEO_SOURCES = [
  ...(typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FOUNDER_VIDEO_URL
    ? [process.env.NEXT_PUBLIC_FOUNDER_VIDEO_URL]
    : []),
  '/videos/founder-story.mp4',
  'https://dmejysrnxvpjenutdypx.supabase.co/storage/v1/object/public/hero-assets/founder-story.mp4',
]
  .filter(Boolean)
  .filter((url, i, arr) => arr.indexOf(url) === i);

export function LandingPage({ isAuthenticated = false, navbarRole = null }: LandingPageProps) {
  const searchParams = useSearchParams();
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const founderVideoRef = useRef<HTMLVideoElement>(null);
  const [founderVideoSourceIndex, setFounderVideoSourceIndex] = useState(0);
  const [founderVideoFailed, setFounderVideoFailed] = useState(false);
  const [founderVideoError, setFounderVideoError] = useState<string | null>(null);

  const [earlyAccessModal, setEarlyAccessModal] = useState<'audit' | 'boc3' | 'mcs150' | 'ifta' | null>(null);
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('');
  const [earlyAccessDot, setEarlyAccessDot] = useState('');
  const [earlyAccessSubmitting, setEarlyAccessSubmitting] = useState(false);
  const [earlyAccessSuccess, setEarlyAccessSuccess] = useState(false);
  const [earlyAccessError, setEarlyAccessError] = useState<string | null>(null);

  const [roadmapModalOpen, setRoadmapModalOpen] = useState(false);
  const [roadmapEmail, setRoadmapEmail] = useState('');
  const [roadmapDot, setRoadmapDot] = useState('');
  const [roadmapSubmitting, setRoadmapSubmitting] = useState(false);
  const [roadmapSuccess, setRoadmapSuccess] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  const [roadmapSectionModalOpen, setRoadmapSectionModalOpen] = useState(false);
  const [roadmapSectionEmail, setRoadmapSectionEmail] = useState('');
  const [roadmapSectionDot, setRoadmapSectionDot] = useState('');
  const [roadmapSectionSubmitting, setRoadmapSectionSubmitting] = useState(false);
  const [roadmapSectionError, setRoadmapSectionError] = useState<string | null>(null);
  const [roadmapSectionToast, setRoadmapSectionToast] = useState<string | null>(null);

  const [driverAppNotifyOpen, setDriverAppNotifyOpen] = useState(false);
  const [driverAppNotifyEmail, setDriverAppNotifyEmail] = useState('');
  const [driverAppNotifySubmitting, setDriverAppNotifySubmitting] = useState(false);
  const [driverAppNotifySuccess, setDriverAppNotifySuccess] = useState(false);
  const [driverAppNotifyError, setDriverAppNotifyError] = useState<string | null>(null);

  const [betaSpotsRemaining, setBetaSpotsRemaining] = useState<number | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  useEffect(() => {
    const fetchBeta = () => {
      fetch('/api/beta-spots')
        .then((res) => res.json())
        .then((data: { remaining?: number }) => setBetaSpotsRemaining(data?.remaining ?? null))
        .catch(() => setBetaSpotsRemaining(null));
    };
    fetchBeta();
    const interval = setInterval(fetchBeta, 45000);
    return () => clearInterval(interval);
  }, []);
  const betaOpen = betaSpotsRemaining != null && betaSpotsRemaining > 0;
  const betaFull = betaSpotsRemaining !== null && betaSpotsRemaining === 0;

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = waitlistEmail.trim();
    if (!email) return;
    setWaitlistError(null);
    setWaitlistSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWaitlistError(data?.error ?? 'Something went wrong.');
        return;
      }
      setWaitlistSuccess(true);
      setWaitlistEmail('');
    } catch {
      setWaitlistError('Network error. Try again.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      const url = new URL('/auth/callback', window.location.origin);
      url.searchParams.set('code', code);
      url.searchParams.set('redirectTo', '/dashboard');
      window.location.replace(url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    const play = () => video.play().catch(() => {});
    play();
    video.addEventListener('loadeddata', play);
    video.addEventListener('canplay', play);
    return () => {
      video.removeEventListener('loadeddata', play);
      video.removeEventListener('canplay', play);
    };
  }, []);

  useEffect(() => {
    if (!storyModalOpen) return;
    const t = setTimeout(() => {
      const v = founderVideoRef.current;
      if (v) {
        v.play().catch(() => {});
      }
    }, 100);
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStoryModalOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onEscape);
      const v = founderVideoRef.current;
      if (v) v.pause();
    };
  }, [storyModalOpen]);

  const closeEarlyAccessModal = () => {
    setEarlyAccessModal(null);
    setEarlyAccessEmail('');
    setEarlyAccessDot('');
    setEarlyAccessError(null);
    setEarlyAccessSuccess(false);
  };

  const handleEarlyAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!earlyAccessModal) return;
    setEarlyAccessError(null);
    setEarlyAccessSubmitting(true);
    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: earlyAccessEmail.trim(),
          dotNumber: earlyAccessDot.trim() || undefined,
          feature: earlyAccessModal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEarlyAccessError(data?.error ?? 'Something went wrong.');
        return;
      }
      setEarlyAccessSuccess(true);
      setEarlyAccessEmail('');
      setEarlyAccessDot('');
      setTimeout(closeEarlyAccessModal, 1500);
    } catch {
      setEarlyAccessError('Network error. Try again.');
    } finally {
      setEarlyAccessSubmitting(false);
    }
  };

  useEffect(() => {
    if (!earlyAccessModal) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEarlyAccessModal();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [earlyAccessModal]);

  const closeRoadmapModal = () => {
    setRoadmapModalOpen(false);
    setRoadmapEmail('');
    setRoadmapDot('');
    setRoadmapError(null);
    setRoadmapSuccess(false);
  };

  useEffect(() => {
    if (!roadmapModalOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRoadmapModal();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [roadmapModalOpen]);

  const closeRoadmapSectionModal = () => {
    setRoadmapSectionModalOpen(false);
    setRoadmapSectionEmail('');
    setRoadmapSectionDot('');
    setRoadmapSectionError(null);
  };

  useEffect(() => {
    if (!roadmapSectionModalOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRoadmapSectionModal();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [roadmapSectionModalOpen]);

  useEffect(() => {
    if (!roadmapSectionToast) return;
    const t = setTimeout(() => setRoadmapSectionToast(null), 5000);
    return () => clearTimeout(t);
  }, [roadmapSectionToast]);

  const handleRoadmapSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoadmapSectionError(null);
    setRoadmapSectionSubmitting(true);
    try {
      const res = await fetch('/api/roadmap-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: roadmapSectionEmail.trim(),
          dotNumber: roadmapSectionDot.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRoadmapSectionError(data?.error ?? 'Something went wrong.');
        return;
      }
      const email = roadmapSectionEmail.trim();
      const dotNumber = roadmapSectionDot.trim() || '';
      try {
        await fetch('/api/notifications/new-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, dotNumber, featureInterest: 'Compliance Roadmap' }),
        });
      } catch {
        // Lead already saved; email alert is best-effort
      }
      closeRoadmapSectionModal();
      setRoadmapSectionToast("You're on the list, Jason! We'll notify you when the satellite link is active.");
      setRoadmapSectionEmail('');
      setRoadmapSectionDot('');
    } catch {
      setRoadmapSectionError('Network error. Try again.');
    } finally {
      setRoadmapSectionSubmitting(false);
    }
  };

  const handleRoadmapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoadmapError(null);
    setRoadmapSubmitting(true);
    try {
      const res = await fetch('/api/roadmap-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: roadmapEmail.trim(),
          dotNumber: roadmapDot.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRoadmapError(data?.error ?? 'Something went wrong.');
        return;
      }
      const email = roadmapEmail.trim();
      const dotNumber = roadmapDot.trim() || '';
      try {
        await fetch('/api/notifications/new-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, dotNumber, featureInterest: 'Compliance Alpha' }),
        });
      } catch {
        // Lead already saved; email alert is best-effort
      }
      setRoadmapSuccess(true);
      setRoadmapEmail('');
      setRoadmapDot('');
      setTimeout(closeRoadmapModal, 2000);
    } catch {
      setRoadmapError('Network error. Try again.');
    } finally {
      setRoadmapSubmitting(false);
    }
  };

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

      {/* Spacer: navbar height so content starts below it */}
      <div
        className="w-full"
        style={{
          minHeight: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
        }}
        aria-hidden
      />

      {/* Hero: video when it loads; gradient fallback so it's never plain black */}
      <section className="relative min-h-[100dvh] sm:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-midnight-ink">
          {/* Fallback: road/trucking vibe gradient when video is blocked or fails */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-midnight-ink via-midnight-ink to-cyber-amber/20"
            aria-hidden
          />
          <video
            ref={heroVideoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            className="min-h-full min-w-full z-[1]"
          >
            {HERO_VIDEO_SOURCES.map((src) => (
              <source key={src} src={src} type="video/mp4" />
            ))}
          </video>
          <div className="absolute inset-0 bg-black/50 z-[2]" aria-hidden />

        <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 text-center max-w-4xl mx-auto pb-8 pb-safe">
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
          >
            Built by a <span style={{ color: '#FFBF00' }}>Carrier</span>. Not a Tech Company.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg sm:text-xl text-soft-cloud/85 max-w-2xl"
          >
            VantagFleet is the first compliance dashboard that understands the road. No more audit
            anxiety. Just clean logs and a moving fleet.
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
                onClick={() => document.getElementById('compliance-score')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="text-sm text-cyber-amber/90 hover:text-cyber-amber underline underline-offset-2"
              >
                See your compliance score →
              </button>
            </motion.p>
          )}
          {!isAuthenticated ? (
            <>
              <div className="mt-10 w-full flex justify-center flex-col items-center gap-6">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 min-h-[52px] sm:min-h-[56px] px-8 sm:px-10 py-4 rounded-xl bg-cyber-amber text-midnight-ink font-bold text-base sm:text-lg hover:bg-cyber-amber/90 active:scale-[0.98] transition-all shadow-lg shadow-cyber-amber/25 touch-manipulation border border-cyber-amber/30"
                >
                  Get Started
                  <ArrowRight className="size-5 shrink-0" />
                </Link>
                <a
                  href="mailto:info@vantagfleet.com"
                  className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-xl border-2 border-white/30 text-white font-semibold hover:border-cyber-amber/50 hover:text-cyber-amber transition-colors no-underline"
                >
                  Contact Sales
                </a>
                <HeroLoginCard redirectTo="/dashboard" />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6 flex flex-wrap items-center justify-center gap-4"
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
              className="mt-10 flex flex-col items-center gap-6"
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
              { text: "The Auditor doesn't care about your excuses. We make sure they don't have a reason to." },
              { text: 'Motive + Motus + IFTA: The holy trinity of compliance, automated.' },
              { text: 'Desktop App Performance: Built with Tauri for 2026 speed.' },
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

      {/* The Story — Founder's Tape: video + quote */}
      <section className="relative py-24 px-4 bg-midnight-ink border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7 }}
            className="relative rounded-2xl border-2 border-cyber-amber/60 bg-black/40 p-2 sm:p-3 shadow-[0_0_60px_-12px_rgba(255,176,0,0.2)]"
          >
            <div className="aspect-video rounded-xl bg-midnight-ink/80 overflow-hidden border border-white/10">
              {founderVideoFailed ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-black/60 text-soft-cloud/80 p-6 text-center">
                  <p className="text-sm">Video couldn&apos;t load. Try refreshing or contact us.</p>
                  {founderVideoError && (
                    <p className="text-xs text-soft-cloud/50 max-w-md">{founderVideoError}</p>
                  )}
                  <p className="text-xs text-soft-cloud/50 max-w-md">
                    Use a standard MP4 (H.264) in <code className="bg-white/10 px-1 rounded">public/videos/founder-story.mp4</code>, or upload to Supabase and set <code className="bg-white/10 px-1 rounded">NEXT_PUBLIC_FOUNDER_VIDEO_URL</code>.
                  </p>
                  <a
                    href={FOUNDER_VIDEO_SOURCES[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FFBF00] hover:underline text-sm font-medium"
                  >
                    Open video in new tab
                  </a>
                  <a
                    href="mailto:info@vantagfleet.com"
                    className="text-soft-cloud/60 hover:text-soft-cloud text-xs"
                  >
                    info@vantagfleet.com
                  </a>
                </div>
              ) : (
                <video
                  ref={founderVideoRef}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  preload="auto"
                  src={FOUNDER_VIDEO_SOURCES[founderVideoSourceIndex]}
                  onError={(e) => {
                    const v = e.currentTarget;
                    const code = v.error?.code;
                    const msg =
                      code === 1
                        ? 'Playback was aborted.'
                        : code === 2
                          ? 'Network error (file missing or unreachable).'
                          : code === 3
                            ? 'Decode error (try re-exporting as H.264 MP4).'
                            : code === 4
                              ? 'Format not supported (use H.264 MP4).'
                              : v.error?.message || 'Unknown error.';
                    setFounderVideoError(msg);
                    if (founderVideoSourceIndex < FOUNDER_VIDEO_SOURCES.length - 1) {
                      setFounderVideoSourceIndex((i) => i + 1);
                    } else {
                      setFounderVideoFailed(true);
                    }
                  }}
                  onLoadedData={() => {
                    setFounderVideoError(null);
                  }}
                />
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <Quote className="size-8 text-cyber-amber/70 shrink-0 mt-0.5" />
              <blockquote className="text-lg sm:text-xl text-soft-cloud/90 italic leading-relaxed">
                I spent a decade looking at the white lines on the asphalt. I&apos;ve felt the stress of a roadside
                inspection and the headache of logs that just won&apos;t sync. VantagFleet wasn&apos;t built by a
                developer who never left the city; it was built by a carrier who knows that in this business, time
                is the only currency that matters. We don&apos;t just track your fleet—we protect your livelihood.
              </blockquote>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Map Preview — Mapbox fleet map teaser */}
      <section className="relative py-24 px-4 bg-midnight-ink border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-soft-cloud text-center mb-2"
          >
            Your fleet on the <span className="text-cyber-amber">map</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-soft-cloud/60 text-center mb-12"
          >
            Real-time Mapbox view. One dashboard, every unit.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7 }}
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-card shadow-[0_0_80px_-20px_rgba(255,176,0,0.12)]"
          >
            <div className="aspect-video bg-midnight-ink flex items-center justify-center relative overflow-hidden">
              <div className="map-preview-placeholder absolute inset-0 flex items-center justify-center bg-gradient-to-br from-midnight-ink via-card to-midnight-ink">
                <div className="absolute inset-0 opacity-20 map-grid-pattern" aria-hidden />
                <div className="relative flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-cyber-amber/20 border border-cyber-amber/40">
                    <MapPin className="size-12 text-cyber-amber" />
                  </div>
                  <p className="text-soft-cloud/70 text-sm font-medium">Live Mapbox fleet view</p>
                  <p className="text-soft-cloud/50 text-xs">Your fleet at a glance in the dashboard</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Compliance Suite — single clean set: Audit, BOC-3, MCS-150, IFTA */}
      <section className="relative py-24 px-4 bg-[#0f172a] border-t border-slate-600/30">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-2 tracking-tight"
          >
            Compliance <span className="text-cyber-amber">Suite</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-slate-300 text-center mb-12 font-medium"
          >
            One place for the filings that keep you legal.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { id: 'audit' as const, title: 'One-Click Audit Protection', why: 'Professional, watermarked ZIP bundle for auditors. ELD breadcrumbs, state-line crossings, fuel receipts.', Icon: Shield, comingSoon: false, badge: 'Certified' as const },
              { id: 'boc3' as const, title: 'BOC-3 Process Agents', why: 'Designate process agents in every state you operate—no missed service of process.', Icon: Scale, comingSoon: true, badge: null },
              { id: 'mcs150' as const, title: 'MCS-150 Biennial Update', why: 'Avoid $1k+ fines with automated biennial updates and reminders.', Icon: FileText, comingSoon: true, badge: null },
              { id: 'ifta' as const, title: 'Automated IFTA Reporting', why: 'Audit-ready IFTA logs. File and track IFTA fuel tax with ELD sync.', Icon: Fuel, comingSoon: false, badge: 'Certified' as const },
            ].map(({ id, title, why, Icon, comingSoon, badge }) => (
              <div key={id} className="group relative rounded-xl border border-slate-500/40 bg-slate-800/40 backdrop-blur-sm p-6 transition-all duration-300 hover:border-cyber-amber/40 hover:bg-slate-800/60">
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {badge && <span className="rounded bg-electric-teal/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-electric-teal">Certified</span>}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg border border-cyber-amber/30 bg-cyber-amber/10">
                    <Icon className="size-5 text-cyber-amber" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{why}</p>
                {comingSoon ? (
                  <button type="button" onClick={() => setEarlyAccessModal(id)} className="w-full py-2.5 rounded-lg border border-slate-500/50 bg-slate-700/30 text-slate-300 text-sm font-medium hover:border-cyber-amber/50 hover:text-cyber-amber transition-colors">
                    Get notified when available
                  </button>
                ) : id === 'audit' ? (
                  <Link href={isAuthenticated ? '/dashboard' : '/signup'} className="block w-full py-2.5 rounded-lg border border-slate-500/50 bg-slate-700/30 text-slate-300 text-sm font-semibold hover:border-cyber-amber/50 hover:text-cyber-amber text-center transition-colors">
                    {isAuthenticated ? 'View audit export' : 'Get started'}
                  </Link>
                ) : (
                  <Link href={isAuthenticated ? '/dashboard/ifta' : '/signup'} className="block w-full py-2.5 rounded-lg border border-cyber-amber/50 bg-cyber-amber/10 text-cyber-amber text-sm font-semibold hover:bg-cyber-amber/20 text-center transition-colors">
                    {isAuthenticated ? 'Go to IFTA' : 'Get started'}
                  </Link>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* The Enterprise Pillar — Audit-Ready, Always */}
      <section className="relative py-24 px-4 bg-midnight-ink border-t border-slate-600/30">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold text-white text-center mb-3 tracking-tight"
          >
            The VantagFleet Standard: Audit-Ready, Always.
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
              <h3 className="text-xl font-bold text-white mb-2">Regulatory Shield</h3>
              <p className="text-slate-400 text-sm mb-4 flex-1">IFTA automation and BOC-3 / MCS-150 management in one place. Stay current with filings and avoid fines.</p>
              <ul className="text-slate-300 text-sm space-y-1.5">
                <li className="flex items-center gap-2"><span className="text-electric-teal">•</span> IFTA automation</li>
                <li className="flex items-center gap-2"><span className="text-electric-teal">•</span> BOC-3 & MCS-150</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-600/50 bg-slate-900/50 p-8 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-cyber-amber/15 border border-cyber-amber/30 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-cyber-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Liability Defense</h3>
              <p className="text-slate-400 text-sm mb-4 flex-1">Roadside Inspection Mode and incident reporting give you a clear record when it matters most. DOT-ready at the scale.</p>
              <ul className="text-slate-300 text-sm space-y-1.5">
                <li className="flex items-center gap-2"><span className="text-cyber-amber">•</span> Roadside inspection mode</li>
                <li className="flex items-center gap-2"><span className="text-cyber-amber">•</span> Incident reporting</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Compliance Status — Fleet Compliance Score A+ */}
      <section id="compliance-score" className="relative py-24 px-4 bg-[#0f172a] border-t border-slate-600/30 overflow-hidden scroll-mt-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(255,176,0,0.06),transparent)] pointer-events-none" aria-hidden />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight"
          >
            Fleet Compliance Score
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-slate-400 text-lg mb-10 font-medium max-w-xl mx-auto"
          >
            Built for fleets that can&apos;t afford a single minute of downtime or a single DOT fine.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="inline-flex flex-col items-center justify-center rounded-2xl border-2 border-cyber-amber/50 bg-slate-800/60 backdrop-blur-sm px-12 py-10 shadow-[0_0_60px_-12px_rgba(255,176,0,0.2)]"
          >
            <span className="text-6xl sm:text-7xl md:text-8xl font-black text-cyber-amber tracking-tighter leading-none">A+</span>
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-widest mt-3">Audit-ready</span>
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
            Telematics & compliance in one place
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
            Connect your ELD and telematics. One source of truth for fleet and compliance.
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

      {/* Founder story video modal */}
      <AnimatePresence>
        {storyModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl"
              onClick={() => setStoryModalOpen(false)}
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
              aria-label="Founder story video"
            >
              <div className="relative w-full max-w-[min(56rem,100vw-2rem)] mx-auto my-auto rounded-2xl border-2 border-white/10 bg-midnight-ink/95 shadow-2xl overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setStoryModalOpen(false)}
                  className="absolute right-4 top-4 z-10 rounded-full p-2 text-soft-cloud/80 hover:text-[#FFBF00] hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                  aria-label="Close"
                >
                  <X className="size-6 drop-shadow-md hover:drop-shadow-[0_0_8px_rgba(255,191,0,0.6)]" />
                </button>
                <div className="aspect-video w-full bg-black">
                  <video
                    ref={founderVideoRef}
                    src="/videos/founder-story.mp4"
                    className="h-full w-full object-contain"
                    autoPlay
                    playsInline
                    muted
                    loop
                    controls
                    preload="auto"
                  />
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="px-6 pb-6 pt-2 text-center text-sm text-soft-cloud/70 italic"
                >
                  Built for the road. — <span className="text-soft-cloud font-medium not-italic">Jason Lacey</span>, Founder
                </motion.p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Get Early Access — lead capture modal */}
      <AnimatePresence>
        {earlyAccessModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
              onClick={closeEarlyAccessModal}
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
              aria-labelledby="early-access-title"
            >
              <div className="w-full max-w-[min(28rem,100vw-2rem)] mx-auto my-auto rounded-2xl border-2 border-amber-500/30 bg-midnight-ink/95 shadow-2xl shadow-amber-500/10 p-4 sm:p-6 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="early-access-title" className="text-lg font-semibold text-soft-cloud">
                    {earlyAccessModal === 'ifta' || earlyAccessModal === 'audit'
                      ? 'Get Started'
                      : 'Get notified when available'}
                    {' — '}
                    {earlyAccessModal === 'boc3' ? 'BOC-3' : earlyAccessModal === 'mcs150' ? 'MCS-150' : earlyAccessModal === 'audit' ? 'Audit Export' : 'Automated IFTA Reporting'}
                  </h3>
                  <button
                    type="button"
                    onClick={closeEarlyAccessModal}
                    className="rounded-full p-2 text-soft-cloud/70 hover:text-amber-400 hover:bg-white/10 transition-colors"
                    aria-label="Close"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                {earlyAccessSuccess ? (
                  <p className="text-soft-cloud py-4 text-center">You&apos;re on the list. We&apos;ll be in touch.</p>
                ) : (
                  <form onSubmit={handleEarlyAccessSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="early-access-email" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                        Email *
                      </label>
                      <input
                        id="early-access-email"
                        type="email"
                        required
                        value={earlyAccessEmail}
                        onChange={(e) => setEarlyAccessEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label htmlFor="early-access-dot" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                        DOT Number (optional)
                      </label>
                      <input
                        id="early-access-dot"
                        type="text"
                        value={earlyAccessDot}
                        onChange={(e) => setEarlyAccessDot(e.target.value)}
                        placeholder="e.g. 1234567"
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                      />
                    </div>
                    {earlyAccessError && (
                      <p className="text-sm text-red-400">{earlyAccessError}</p>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeEarlyAccessModal}
                        className="flex-1 py-2.5 rounded-lg border border-white/20 text-soft-cloud/80 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={earlyAccessSubmitting}
                        className="flex-1 py-2.5 rounded-lg bg-amber-500 text-midnight-ink font-medium hover:bg-amber-400 disabled:opacity-60"
                      >
                        {earlyAccessSubmitting ? 'Submitting…' : 'Submit'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Compliance Roadmap section — success toast */}
      <AnimatePresence>
        {roadmapSectionToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[110] max-w-md mx-auto sm:mx-0"
          >
            <div className="rounded-xl border border-amber-500/30 bg-midnight-ink/95 backdrop-blur-md px-5 py-4 shadow-lg shadow-amber-500/10 text-amber-500 text-center text-sm font-medium">
              {roadmapSectionToast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compliance Roadmap section — Join Waitlist modal */}
      <AnimatePresence>
        {roadmapSectionModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
              onClick={closeRoadmapSectionModal}
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
              aria-labelledby="roadmap-section-modal-title"
            >
              <div className="w-full max-w-[min(28rem,100vw-2rem)] mx-auto my-auto rounded-2xl border border-white/10 bg-midnight-ink/95 backdrop-blur-xl shadow-2xl p-4 sm:p-6 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="roadmap-section-modal-title" className="text-lg font-semibold text-soft-cloud">
                    Join the Waitlist
                  </h3>
                  <button
                    type="button"
                    onClick={closeRoadmapSectionModal}
                    className="rounded-full p-2 text-soft-cloud/70 hover:text-amber-500 hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <form onSubmit={handleRoadmapSectionSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="roadmap-section-email" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                      Email *
                    </label>
                    <input
                      id="roadmap-section-email"
                      type="email"
                      required
                      value={roadmapSectionEmail}
                      onChange={(e) => setRoadmapSectionEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                    />
                  </div>
                  <div>
                    <label htmlFor="roadmap-section-dot" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                      DOT Number
                    </label>
                    <input
                      id="roadmap-section-dot"
                      type="text"
                      value={roadmapSectionDot}
                      onChange={(e) => setRoadmapSectionDot(e.target.value)}
                      placeholder="e.g. 1234567"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                    />
                  </div>
                  {roadmapSectionError && (
                    <p className="text-sm text-red-400">{roadmapSectionError}</p>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeRoadmapSectionModal}
                      className="flex-1 py-2.5 rounded-xl border border-white/20 text-soft-cloud/80 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={roadmapSectionSubmitting}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-midnight-ink font-medium hover:bg-amber-400 disabled:opacity-60"
                    >
                      {roadmapSectionSubmitting ? 'Submitting…' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Join the Compliance Alpha — roadmap_leads modal */}
      <AnimatePresence>
        {roadmapModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
              onClick={closeRoadmapModal}
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
              aria-labelledby="roadmap-modal-title"
            >
              <div className="w-full max-w-[min(28rem,100vw-2rem)] mx-auto my-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(255,191,0,0.2)] p-4 sm:p-6 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="roadmap-modal-title" className="text-lg font-semibold text-soft-cloud">
                    Join the Compliance Alpha
                  </h3>
                  <button
                    type="button"
                    onClick={closeRoadmapModal}
                    className="rounded-full p-2 text-soft-cloud/70 hover:text-amber-400 hover:bg-white/10 transition-colors"
                    aria-label="Close"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <p className="text-sm text-soft-cloud/70 mb-5">
                  We will notify you the moment these tools go live.
                </p>
                {roadmapSuccess ? (
                  <p className="text-soft-cloud py-4 text-center">You&apos;re on the list. We&apos;ll be in touch.</p>
                ) : (
                  <form onSubmit={handleRoadmapSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="roadmap-email" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                        Email Address *
                      </label>
                      <input
                        id="roadmap-email"
                        type="email"
                        required
                        value={roadmapEmail}
                        onChange={(e) => setRoadmapEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label htmlFor="roadmap-dot" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                        DOT Number
                      </label>
                      <input
                        id="roadmap-dot"
                        type="text"
                        value={roadmapDot}
                        onChange={(e) => setRoadmapDot(e.target.value)}
                        placeholder="e.g. 1234567"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                      />
                    </div>
                    {roadmapError && (
                      <p className="text-sm text-red-400">{roadmapError}</p>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeRoadmapModal}
                        className="flex-1 py-2.5 rounded-xl border border-white/20 text-soft-cloud/80 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={roadmapSubmitting}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 text-midnight-ink font-medium hover:bg-amber-400 disabled:opacity-60"
                      >
                        {roadmapSubmitting ? 'Submitting…' : 'Submit'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
      icon: FileCheck,
      title: 'Compliance at a glance',
      description: 'Track med cards, licenses, and documents with expiry alerts so nothing slips.',
    },
    {
      icon: Users,
      title: 'Driver management',
      description: 'Add drivers, see status badges, and keep your roster DOT-ready.',
    },
    {
      icon: Truck,
      title: 'Vehicle tracking',
      description: 'Annual inspections and unit details in one place.',
    },
    {
      icon: Shield,
      title: 'Multi-tenant & secure',
      description: 'One login, multiple fleets. Row-level security keeps every org isolated.',
    },
  ];

  return (
    <section className="relative py-24 px-4 bg-midnight-ink border-t border-slate-600/30">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-2 tracking-tight">
          Our Features
        </h2>
        <p className="text-slate-400 text-center max-w-2xl mx-auto mb-16 font-medium">
          Alerts, scores, and docs in one dashboard. No spreadsheets.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-slate-600/50 bg-slate-800/40"
            >
              <item.icon className="size-10 text-cyber-amber mb-4" strokeWidth={2} />
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400 font-medium">{item.description}</p>
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
    q: 'How does the audit export work?',
    a: 'From your dashboard you can export a full audit package: logs, inspections, documents, and compliance status. One click gives you a downloadable bundle to hand to auditors or keep on file.',
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
          Quick answers about compliance and the platform.
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
  betaOpen?: boolean;
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
          Compliance Made Simple
        </h2>
        <p className="text-slate-400 text-lg mb-12 font-medium">
          Enterprise grade. Join fleets that stay DOT-ready with VantagFleet.
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
            {isAuthenticated ? (navbarRole === 'ADMIN' || navbarRole === 'EMPLOYEE' ? 'Admin Console' : 'Go to Dashboard') : 'Get Started'}
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
                className="inline-flex items-center justify-center gap-2 min-h-[52px] px-8 py-4 rounded-2xl border-2 border-cyber-amber/50 bg-cyber-amber/10 text-cyber-amber font-bold text-lg hover:bg-cyber-amber/20 hover:border-cyber-amber transition-colors"
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
