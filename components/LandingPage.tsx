'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navbar } from '@/components/Navbar';
import { Pricing } from '@/components/Pricing';
import { HeroLoginCard } from '@/components/HeroLoginCard';
import { FileCheck, Users, Truck, Shield, ArrowRight, Plug, Quote, MapPin, X, Scale, FileText, Fuel, ShieldCheck, CalendarClock, Gauge } from 'lucide-react';
import type { NavbarRole } from '@/lib/admin';

const glassCardClass =
  'backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_0_40px_-12px_rgba(255,176,0,0.15)]';

type LandingPageProps = { isAuthenticated?: boolean; navbarRole?: NavbarRole | null };

// Hero video: env URL first (for production), then local, then Supabase, then Mixkit
const HERO_VIDEO_SOURCES = [
  ...(typeof process !== 'undefined' && process.env.NEXT_PUBLIC_HERO_VIDEO_URL
    ? [process.env.NEXT_PUBLIC_HERO_VIDEO_URL]
    : []),
  '/videos/hero-truck.mp4',
  'https://dmejysrnxvpjenutdypx.supabase.co/storage/v1/object/public/hero-assets/hero-truck.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-highway-traffic-at-night-with-long-exposure-4010-large.mp4',
].filter(Boolean);

// Founder story: env URL first (use Supabase when set), then local, then hardcoded Supabase
const FOUNDER_VIDEO_SOURCES = [
  ...(typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FOUNDER_VIDEO_URL
    ? [process.env.NEXT_PUBLIC_FOUNDER_VIDEO_URL]
    : []),
  '/videos/founder-story.mp4',
  'https://dmejysrnxvpjenutdypx.supabase.co/storage/v1/object/public/hero-assets/founder-story.mp4',
].filter(Boolean);

export function LandingPage({ isAuthenticated = false, navbarRole = null }: LandingPageProps) {
  const searchParams = useSearchParams();
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const founderVideoRef = useRef<HTMLVideoElement>(null);
  const [founderVideoSourceIndex, setFounderVideoSourceIndex] = useState(0);
  const [founderVideoFailed, setFounderVideoFailed] = useState(false);
  const [founderVideoError, setFounderVideoError] = useState<string | null>(null);

  const [earlyAccessModal, setEarlyAccessModal] = useState<'boc3' | 'mcs150' | 'ifta' | null>(null);
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
    fetch('/api/beta-spots')
      .then((res) => res.json())
      .then((data: { remaining?: number }) => setBetaSpotsRemaining(data?.remaining ?? null))
      .catch(() => setBetaSpotsRemaining(null));
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
    <div className="min-h-screen bg-midnight-ink overflow-x-hidden">
      <Navbar
        isAuthenticated={isAuthenticated}
        signupHref={betaOpen ? '/signup' : '/pricing'}
        signupLabel={betaOpen ? 'Sign Up' : 'Start Your Fleet'}
      />

      {/* Spacer so content starts below fixed navbar; safe-area for notches */}
      <div
        className="h-14 sm:h-16"
        style={{ minHeight: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
        aria-hidden
      />

      {/* Sticky beta strip: sits below navbar, stays visible when scrolling */}
      {betaOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="sticky z-[99] w-full"
          style={{ top: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex justify-center items-center px-3 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 via-[#FFBF00] to-orange-400 shadow-[0_4px_20px_rgba(251,191,36,0.5),0_0_40px_rgba(251,191,36,0.15)] border-b border-amber-300/40">
            <motion.span
              animate={{ opacity: [1, 0.85, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="mr-1.5 text-lg sm:text-xl shrink-0"
              aria-hidden
            >
              🔥
            </motion.span>
            <span className="text-sm sm:text-base font-bold text-black drop-shadow-sm tracking-tight">
              <span className="tabular-nums">{betaSpotsRemaining}</span> Beta Spot{betaSpotsRemaining === 1 ? '' : 's'} Remaining
            </span>
            <span className="hidden sm:inline ml-2 text-black/90 text-sm font-semibold">— Claim yours free</span>
          </div>
        </motion.div>
      )}

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
          {!isAuthenticated ? (
            <>
              <div className="mt-10 w-full flex justify-center flex-col items-center gap-6">
                {betaOpen ? (
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px] px-6 sm:px-8 py-4 rounded-xl bg-[#FFBF00] text-midnight-ink font-bold text-base sm:text-lg hover:bg-[#FFBF00]/90 active:scale-[0.98] transition-all shadow-lg shadow-[#FFBF00]/20 touch-manipulation"
                  >
                    Claim Free Beta Spot
                    <ArrowRight className="size-5 shrink-0" />
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px] px-6 sm:px-8 py-4 rounded-xl bg-[#FFBF00] text-midnight-ink font-bold text-base sm:text-lg hover:bg-[#FFBF00]/90 active:scale-[0.98] transition-all shadow-lg shadow-[#FFBF00]/20 touch-manipulation"
                  >
                    Start Your Fleet
                    <ArrowRight className="size-5 shrink-0" />
                  </Link>
                )}
                <HeroLoginCard redirectTo="/dashboard" />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6 flex flex-wrap items-center justify-center gap-4"
              >
                <p className="text-sm text-soft-cloud/70">
                  {betaOpen
                    ? (
                      <>
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-[#FFBF00] hover:underline font-medium">
                          Claim Free Beta Spot
                        </Link>
                      </>
                    )
                    : (
                      <>
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#FFBF00] hover:underline font-medium">
                          Sign in
                        </Link>
                      </>
                    )}
                </p>
              </motion.div>
              <motion.a
                href="mailto:info@vantagfleet.com"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 w-full max-w-md mx-auto block text-center backdrop-blur-2xl bg-black/40 border border-white/10 rounded-3xl min-h-[48px] flex items-center justify-center py-4 px-6 shadow-[0_0_50px_-12px_rgba(255,191,0,0.25)] text-[#FFBF00] font-medium hover:bg-black/50 hover:border-[#FFBF00]/40 transition-colors touch-manipulation"
              >
                info@vantagfleet.com
              </motion.a>
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
              <a
                href="mailto:info@vantagfleet.com"
                className="block text-center backdrop-blur-2xl bg-black/40 border border-white/10 rounded-3xl py-4 px-8 shadow-[0_0_50px_-12px_rgba(255,191,0,0.25)] text-[#FFBF00] font-medium hover:bg-black/50 hover:border-[#FFBF00]/40 transition-colors"
              >
                info@vantagfleet.com
              </a>
            </motion.div>
          )}
        </div>
      </section>

      {/* Truth / Why — three columns */}
      <section className="relative py-24 px-4 bg-midnight-ink border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-3xl sm:text-4xl font-bold text-soft-cloud text-center mb-4"
          >
            The <span className="text-cyber-amber">Truth</span>
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              {
                text: "The Auditor doesn't care about your excuses. We make sure they don't have a reason to.",
              },
              {
                text: 'Motive + Motus + IFTA: The holy trinity of compliance, automated.',
              },
              {
                text: 'Desktop App Performance: Built with Tauri for 2026 speed.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`p-6 ${glassCardClass} bg-white/5 text-center`}
              >
                <p className="text-soft-cloud/90 text-lg leading-relaxed">{item.text}</p>
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

      {/* Future of Compliance — blueprint feature preview cards */}
      <section className="relative py-24 px-4 bg-midnight-ink/80 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-3xl sm:text-4xl font-bold text-soft-cloud text-center mb-2"
          >
            Future of <span className="text-cyber-amber">Compliance</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-soft-cloud/60 text-center mb-12"
          >
            Coming soon: one place for the filings that keep you legal.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                id: 'boc3' as const,
                title: 'BOC-3 Process Agents',
                why: 'Designate process agents in every state you operate—no more missed service of process.',
                Icon: Scale,
              },
              {
                id: 'mcs150' as const,
                title: 'MCS-150 Biennial Update',
                why: 'Avoid $1k+ fines with automated biennial updates and reminders.',
                Icon: FileText,
              },
              {
                id: 'ifta' as const,
                title: 'IFTA Fuel Tax',
                why: 'File and track IFTA fuel tax in one place. Stay audit-ready.',
                Icon: Fuel,
              },
            ].map(({ id, title, why, Icon }) => (
              <div
                key={id}
                className="group relative rounded-xl border-2 border-dashed border-amber-500/40 bg-white/[0.04] backdrop-blur-sm p-6 transition-all duration-300 hover:border-amber-500/70 hover:shadow-[0_0_40px_-8px_rgba(245,158,11,0.35)] hover:bg-white/[0.06]"
                title={why}
              >
                <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-amber-500/60 group-hover:bg-amber-400" aria-hidden />
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/10">
                    <Icon className="size-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-soft-cloud">{title}</h3>
                </div>
                <p className="text-sm text-soft-cloud/60 mb-3 line-clamp-2">
                  Under construction. Get notified when this power-up launches.
                </p>
                <p className="mb-4 min-h-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-amber-300/95 rounded-lg px-3 py-2 border border-amber-500/20 bg-amber-500/5">
                  <span className="font-medium text-amber-400/90">Why it matters:</span> {why}
                </p>
                <button
                  type="button"
                  onClick={() => setEarlyAccessModal(id)}
                  className="w-full py-2.5 rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 hover:border-amber-500/60 transition-colors"
                >
                  Get Early Access
                </button>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* The Future of VantagFleet — three glassmorphism cards + Compliance Alpha waitlist */}
      <section className="relative py-24 px-4 bg-midnight-ink border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-3xl sm:text-4xl font-bold text-soft-cloud text-center mb-2"
          >
            The Future of <span className="text-cyber-amber">VantagFleet</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-soft-cloud/60 text-center mb-12"
          >
            Compliance tools that work as hard as you do.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: 'BOC-3 Authority Link',
                subtext: 'Instant 50-state process agent coverage. Stay legal, stay moving.',
                Icon: Scale,
              },
              {
                title: 'Automated MCS-150',
                subtext: 'Never miss a biennial update. We pre-fill your census data from your ELD activity.',
                Icon: FileText,
              },
              {
                title: 'Quarterly IFTA Prep',
                subtext: 'Stop the spreadsheets. Automated fuel tax reporting based on GPS mileage.',
                Icon: Fuel,
              },
            ].map(({ title, subtext, Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_-12px_rgba(255,176,0,0.12)] p-6 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                    <Icon className="size-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-soft-cloud">{title}</h3>
                </div>
                <p className="text-sm text-soft-cloud/70 mb-6 flex-1">{subtext}</p>
                <button
                  type="button"
                  onClick={() => setRoadmapModalOpen(true)}
                  className="w-full py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors"
                >
                  Early Access
                </button>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Bar — Motive, Motus, Samsara (Soon), Geotab (Soon) */}
      <section className="relative py-16 px-4 border-y border-white/10 bg-white/[0.02]">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-center text-soft-cloud/50 text-sm uppercase tracking-wider mb-10"
        >
          Integrated with the tools you already run
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 sm:gap-12"
        >
          {[
            { name: 'Motive', soon: false },
            { name: 'Motus', soon: false },
            { name: 'Samsara', soon: true },
            { name: 'Geotab', soon: true },
          ].map((partner, i) => (
            <div
              key={partner.name}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <Plug className={`size-5 ${partner.soon ? 'text-soft-cloud/40' : 'text-cyber-amber'}`} />
              <span className={`font-semibold ${partner.soon ? 'text-soft-cloud/50' : 'text-soft-cloud'}`}>
                {partner.name}
              </span>
              {partner.soon && (
                <span className="rounded bg-cyber-amber/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyber-amber">
                  Coming Soon
                </span>
              )}
            </div>
          ))}
        </motion.div>
      </section>

      {/* Truth / Why — three columns */}
      <section className="relative py-24 px-4 bg-midnight-ink border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-soft-cloud text-center mb-2"
          >
            One dashboard. Every integration.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-soft-cloud/60 text-center mb-12"
          >
            Connect your telematics and compliance data in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Motive — primary, larger feel */}
            <Link
              href={isAuthenticated ? '/dashboard/integrations' : '/signup'}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 flex flex-col justify-between min-h-[180px] hover:border-cyber-amber/40 hover:bg-white/[0.07] transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-cyber-amber/20">
                  <Plug className="size-6 text-cyber-amber" />
                </div>
                <h3 className="text-lg font-semibold text-soft-cloud">Motive</h3>
              </div>
              <p className="text-sm text-soft-cloud/60">
                Connect with sign-in. Fleet and HOS in one click.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-cyber-amber text-sm font-medium group-hover:gap-2 transition-all">
                Connect <ArrowRight className="size-4" />
              </span>
            </Link>
            {/* Geotab — coming soon */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 flex flex-col justify-between min-h-[180px] opacity-90">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-cyber-amber/10" style={{ filter: 'grayscale(0.6)' }}>
                  <Plug className="size-6 text-cyber-amber/70" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-soft-cloud/80">Geotab</h3>
                  <span className="rounded bg-cyber-amber/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyber-amber">
                    Soon
                  </span>
                </div>
              </div>
              <p className="text-sm text-soft-cloud/50">Telematics and fleet data. Notify when ready.</p>
            </div>
            {/* Samsara — coming soon */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 flex flex-col justify-between min-h-[180px] opacity-90">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-cyber-amber/10" style={{ filter: 'grayscale(0.6)' }}>
                  <Plug className="size-6 text-cyber-amber/70" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-soft-cloud/80">Samsara</h3>
                  <span className="rounded bg-cyber-amber/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyber-amber">
                    Soon
                  </span>
                </div>
              </div>
              <p className="text-sm text-soft-cloud/50">Cameras and ELD. Notify when ready.</p>
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

      {/* Compliance Roadmap — The Future of Fleet Compliance */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(245,158,11,0.08),transparent)] pointer-events-none" aria-hidden />
        <div className="relative max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-3xl sm:text-4xl font-bold text-amber-500 text-center mb-2"
          >
            The Future of Fleet Compliance
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-soft-cloud/60 text-center mb-12"
          >
            Revolutionizing the back-office so you can focus on the road.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: 'One-Click Federal Authority',
                text: 'Instant 50-state process agent coverage. Stay legal and avoid the $1,000+ paperwork trap.',
                Icon: ShieldCheck,
              },
              {
                title: 'Biennial Updates on Autopilot',
                text: 'We use your real-time fleet activity to pre-fill your census data. Never face a Deactivated status again.',
                Icon: CalendarClock,
              },
              {
                title: 'Quarterly IFTA Prep',
                text: 'Stop the spreadsheets. Automatically calculate state-by-state mileage directly from your Samsara GPS data.',
                Icon: Gauge,
              },
            ].map(({ title, text, Icon }) => (
              <div
                key={title}
                className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6"
              >
                <span className="absolute top-3 right-3 rounded-md bg-amber-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-midnight-ink">
                  COMING SOON
                </span>
                <div className="flex items-center gap-3 mb-3 pr-20">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                    <Icon className="size-5 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-soft-cloud">{title}</h3>
                </div>
                <p className="text-sm text-soft-cloud/70 mb-6">{text}</p>
                <button
                  type="button"
                  onClick={() => setRoadmapSectionModalOpen(true)}
                  className="w-full py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-500 text-sm font-medium hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors"
                >
                  Join Waitlist
                </button>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-soft-cloud text-center mb-2">Solo Guard & Compliance Pro</h2>
          <p className="text-soft-cloud/60 text-center mb-10">Two plans. One dashboard. Choose what fits your fleet.</p>
          <Pricing />
        </div>
      </section>

      {/* Driver App — Coming Soon */}
      <section className="relative py-24 px-4 bg-midnight-ink border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-cyber-amber font-semibold text-sm uppercase tracking-wider mb-3">Coming Soon</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-soft-cloud mb-4">
              The VantagFleet Driver App
            </h2>
            <p className="text-soft-cloud/80 text-lg mb-6 max-w-2xl mx-auto">
              Your Roadside Shield in your pocket. Coming Q3 2026.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-cyber-amber/60 bg-cyber-amber/10 text-cyber-amber font-semibold hover:bg-cyber-amber/20 hover:border-cyber-amber/80 transition-colors"
            >
              Notify Me
            </button>
          </motion.div>
        </div>
      </section>

      <CTASection isAuthenticated={isAuthenticated} navbarRole={navbarRole} betaOpen={betaOpen} />

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
              className="fixed left-1/2 top-1/2 z-[101] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 px-4"
              role="dialog"
              aria-modal="true"
              aria-label="Founder story video"
            >
              <div className="relative rounded-2xl border-2 border-white/10 bg-midnight-ink/95 shadow-2xl overflow-hidden">
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
              className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="early-access-title"
            >
              <div className="rounded-2xl border-2 border-amber-500/30 bg-midnight-ink/95 shadow-2xl shadow-amber-500/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="early-access-title" className="text-lg font-semibold text-soft-cloud">
                    Get Early Access — {earlyAccessModal === 'boc3' ? 'BOC-3' : earlyAccessModal === 'mcs150' ? 'MCS-150' : 'IFTA'}
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
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] max-w-md px-4"
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
              className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="roadmap-section-modal-title"
            >
              <div className="rounded-2xl border border-white/10 bg-midnight-ink/95 backdrop-blur-xl shadow-2xl p-6">
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
              className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="roadmap-modal-title"
            >
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(255,191,0,0.2)] p-6">
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
              className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="driver-app-notify-title"
            >
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(255,191,0,0.2)] p-6">
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
    <section className="relative py-24 px-4 bg-midnight-ink">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-soft-cloud text-center mb-2">
          Our Features
        </h2>
        <p className="text-soft-cloud/70 text-center max-w-2xl mx-auto mb-4 text-lg">
          Built for fleets that move
        </p>
        <p className="text-soft-cloud/70 text-center max-w-2xl mx-auto mb-16">
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
              className={`p-6 ${glassCardClass} bg-white/5`}
            >
              <item.icon className="size-10 text-cyber-amber mb-4" />
              <h3 className="text-xl font-semibold text-soft-cloud mb-2">{item.title}</h3>
              <p className="text-soft-cloud/70">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function CTASection({
  isAuthenticated,
  navbarRole,
  betaOpen,
}: {
  isAuthenticated: boolean;
  navbarRole?: NavbarRole | null;
  betaOpen: boolean;
}) {
  return (
    <section className="relative py-16 sm:py-24 md:py-28 px-4 sm:px-6 bg-midnight-ink border-t border-white/10">
      <motion.div
        className="max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-soft-cloud mb-4">
          Compliance Made Simple
        </h2>
        <p className="text-soft-cloud/80 text-lg mb-12">
          Join fleets that stay DOT-ready with VantagFleet.
        </p>
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Link
            href={
              isAuthenticated
                ? navbarRole === 'ADMIN' || navbarRole === 'EMPLOYEE'
                  ? '/admin'
                  : '/dashboard'
                : betaOpen
                  ? '/signup'
                  : '/pricing'
            }
            className="inline-flex items-center justify-center gap-3 min-h-[48px] sm:min-h-[56px] px-6 sm:px-12 py-4 sm:py-5 rounded-2xl bg-cyber-amber text-midnight-ink font-bold text-lg sm:text-xl hover:bg-cyber-amber/90 active:scale-[0.98] transition-all shadow-[0_0_60px_-8px_rgba(255,176,0,0.5)] touch-manipulation"
          >
            {isAuthenticated
              ? navbarRole === 'ADMIN' || navbarRole === 'EMPLOYEE'
                ? 'Admin Console'
                : 'Go to Dashboard'
              : betaOpen
                ? 'Claim Free Beta Spot'
                : 'Start Your Fleet'}
            <ArrowRight className="size-6" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
