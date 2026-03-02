'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navbar } from '@/components/Navbar';
import { PricingSection } from '@/components/PricingSection';
import { HeroLoginCard } from '@/components/HeroLoginCard';
import { FileCheck, Users, Truck, Shield, ArrowRight, Plug, Quote, MapPin, X } from 'lucide-react';
import type { NavbarRole } from '@/lib/admin';

const glassCardClass =
  'backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_0_40px_-12px_rgba(255,176,0,0.15)]';

type LandingPageProps = { isAuthenticated?: boolean; navbarRole?: NavbarRole | null };

// Hero video: local/public first, then Supabase, then Mixkit (browser tries sources in order)
const HERO_VIDEO_SOURCES = [
  '/videos/hero-truck.mp4',
  'https://dmejysrnxvpjenutdypx.supabase.co/storage/v1/object/public/hero-assets/hero-truck.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-highway-traffic-at-night-with-long-exposure-4010-large.mp4',
];

// Founder story: local first, then optional env fallback (NEXT_PUBLIC_FOUNDER_VIDEO_URL e.g. Supabase URL)
const FOUNDER_VIDEO_SOURCES = [
  '/videos/founder-story.mp4',
  ...(typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FOUNDER_VIDEO_URL
    ? [process.env.NEXT_PUBLIC_FOUNDER_VIDEO_URL]
    : []),
];

export function LandingPage({ isAuthenticated = false, navbarRole = null }: LandingPageProps) {
  const searchParams = useSearchParams();
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const founderVideoRef = useRef<HTMLVideoElement>(null);
  const [founderVideoSourceIndex, setFounderVideoSourceIndex] = useState(0);
  const [founderVideoFailed, setFounderVideoFailed] = useState(false);

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

  return (
    <div className="min-h-screen bg-midnight-ink">
      <Navbar isAuthenticated={isAuthenticated} />

      {/* Hero: video when it loads; gradient fallback so it's never plain black */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-midnight-ink">
        <div className="absolute inset-0 z-0">
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
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto">
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
              <div className="mt-10 w-full flex justify-center">
                <HeroLoginCard redirectTo="/dashboard" />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6 flex flex-wrap items-center justify-center gap-4"
              >
                <p className="text-sm text-soft-cloud/70">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-[#FFBF00] hover:underline font-medium">
                    Get started free
                  </Link>
                </p>
              </motion.div>
              <motion.a
                href="mailto:info@vantagfleet.com"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 w-full max-w-md mx-auto block text-center backdrop-blur-2xl bg-black/40 border border-white/10 rounded-3xl py-4 px-6 shadow-[0_0_50px_-12px_rgba(255,191,0,0.25)] text-[#FFBF00] font-medium hover:bg-black/50 hover:border-[#FFBF00]/40 transition-colors"
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
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-black/60 text-soft-cloud/80 p-6">
                  <p className="text-sm">Video couldn&apos;t load. Try refreshing or contact us.</p>
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
                  key={founderVideoSourceIndex}
                  className="w-full h-full object-cover"
                  src={FOUNDER_VIDEO_SOURCES[founderVideoSourceIndex]}
                  controls
                  playsInline
                  preload="auto"
                  onError={() => {
                    if (founderVideoSourceIndex < FOUNDER_VIDEO_SOURCES.length - 1) {
                      setFounderVideoSourceIndex((i) => i + 1);
                    } else {
                      setFounderVideoFailed(true);
                    }
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
            <div className="aspect-video bg-midnight-ink flex items-center justify-center relative">
              {/* Optional: use /images/map-preview.png when you have a screenshot */}
              <img
                src="/images/map-preview.png"
                alt="VantagFleet map preview"
                className="absolute inset-0 w-full h-full object-cover z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="map-preview-placeholder absolute inset-0 flex items-center justify-center bg-gradient-to-br from-midnight-ink via-card to-midnight-ink">
                <div className="absolute inset-0 opacity-20 map-grid-pattern" aria-hidden />
                <div className="relative flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-cyber-amber/20 border border-cyber-amber/40">
                    <MapPin className="size-12 text-cyber-amber" />
                  </div>
                  <p className="text-soft-cloud/70 text-sm font-medium">Live Mapbox fleet view</p>
                  <p className="text-soft-cloud/50 text-xs">Add /images/map-preview.png for a custom screenshot</p>
                </div>
              </div>
            </div>
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

      <PricingSection />

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
}: {
  isAuthenticated: boolean;
  navbarRole?: NavbarRole | null;
}) {
  return (
    <section className="relative py-28 px-4 bg-midnight-ink border-t border-white/10">
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
                : '/signup'
            }
            className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-cyber-amber text-midnight-ink font-bold text-xl hover:bg-cyber-amber/90 transition-colors shadow-[0_0_60px_-8px_rgba(255,176,0,0.5)]"
          >
            {isAuthenticated
              ? navbarRole === 'ADMIN' || navbarRole === 'EMPLOYEE'
                ? 'Admin Console'
                : 'Go to Dashboard'
              : 'Get Started'}
            <ArrowRight className="size-6" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
