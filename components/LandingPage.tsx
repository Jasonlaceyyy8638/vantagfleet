'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { PricingSection } from '@/components/PricingSection';
import { FileCheck, Users, Truck, Shield, ArrowRight, Plug, Quote, MapPin } from 'lucide-react';
import type { NavbarRole } from '@/lib/admin';

const glassCardClass =
  'backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_0_40px_-12px_rgba(255,176,0,0.15)]';

type LandingPageProps = { isAuthenticated?: boolean; navbarRole?: NavbarRole | null };

export function LandingPage({ isAuthenticated = false, navbarRole = null }: LandingPageProps) {
  const searchParams = useSearchParams();
  const heroVideoRef = useRef<HTMLVideoElement>(null);

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
    return () => video.removeEventListener('loadeddata', play);
  }, []);

  return (
    <div className="min-h-screen bg-midnight-ink">
      <Navbar isAuthenticated={isAuthenticated} />

      {/* Hero: full-screen cinematic background — use NEXT_PUBLIC_HERO_VIDEO_URL (e.g. CDN) to avoid binary in repo */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            ref={heroVideoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover z-0 min-h-full min-w-full"
          >
            {/* Mixkit first (reliable CDN) so hero always shows video; your file second when Netlify serves it */}
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-highway-traffic-at-night-with-long-exposure-4010-large.mp4"
              type="video/mp4"
            />
            <source src="/videos/hero-truck.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/60" aria-hidden />
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
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-wrap gap-4 justify-center"
          >
            <Link
              href={
                isAuthenticated
                  ? navbarRole === 'ADMIN' || navbarRole === 'EMPLOYEE'
                    ? '/admin'
                    : '/dashboard'
                  : '/signup'
              }
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-cyber-amber text-midnight-ink font-bold text-lg hover:bg-cyber-amber/90 transition-colors shadow-lg shadow-cyber-amber/20"
            >
              {isAuthenticated
                ? navbarRole === 'ADMIN' || navbarRole === 'EMPLOYEE'
                  ? 'Admin Console'
                  : 'Go to Dashboard'
                : 'Get started free'}
              <ArrowRight className="size-5" />
            </Link>
            {!isAuthenticated && (
              <Link
                href="/login"
                className="glass-btn inline-flex items-center gap-2 px-8 py-4 rounded-xl text-soft-cloud font-semibold text-lg transition-colors"
              >
                Sign in
              </Link>
            )}
          </motion.div>
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
            <div className="aspect-video rounded-xl bg-midnight-ink/80 flex items-center justify-center overflow-hidden border border-white/10">
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyber-amber/20 text-cyber-amber mb-4">
                  <span className="text-4xl font-bold">▶</span>
                </div>
                <p className="text-soft-cloud/60 text-sm uppercase tracking-wider">
                  Founder&apos;s tape — video coming soon
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Quote className="size-8 text-cyber-amber/70 shrink-0 mt-0.5" />
              <blockquote className="text-lg sm:text-xl text-soft-cloud/90 italic leading-relaxed">
                I started VantagFleet because I was tired of logging into five different apps just to
                see if my fleet was legal. We deserve better.
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
