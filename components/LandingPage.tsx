'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { PricingSection } from '@/components/PricingSection';
import { FileCheck, Users, Truck, Shield, ArrowRight } from 'lucide-react';

const glassCardClass =
  'backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_0_40px_-12px_rgba(255,176,0,0.15)]';

type LandingPageProps = { isAuthenticated?: boolean };

export function LandingPage({ isAuthenticated = false }: LandingPageProps) {
  const searchParams = useSearchParams();

  // Email confirmation: Supabase redirects to /?code=... — send to auth/callback so session is set
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      const url = new URL('/auth/callback', window.location.origin);
      url.searchParams.set('code', code);
      url.searchParams.set('redirectTo', '/dashboard');
      window.location.replace(url.toString());
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-midnight-ink">
      {/* Navbar: logo top left, Sign In + Get Started / Go to Dashboard */}
      <LandingNav isAuthenticated={isAuthenticated} />

      {/* Hero: full-screen with background video */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-40"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-highway-traffic-at-night-with-long-exposure-4010-large.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50" aria-hidden />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <Logo size={72} className="h-16 w-16 sm:h-20 sm:w-20 mx-auto" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-soft-cloud max-w-4xl leading-tight"
          >
            Fleet compliance,{' '}
            <span className="text-cyber-amber">simplified</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg sm:text-xl text-soft-cloud/80 max-w-2xl"
          >
            Stay DOT-ready with driver and vehicle tracking, alerts, and one place for all your documents.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap gap-4 justify-center"
          >
            <Link
              href={isAuthenticated ? '/dashboard' : '/signup'}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-cyber-amber text-midnight-ink font-bold text-lg hover:bg-cyber-amber/90 transition-colors shadow-lg shadow-cyber-amber/20"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get started free'}
              <ArrowRight className="size-5" />
            </Link>
            {!isAuthenticated && (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-soft-cloud font-medium hover:bg-white/5 transition-colors"
              >
                Sign in
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features: scroll-triggered fade-in, glassmorphism cards */}
      <FeaturesSection />

      {/* Pricing: Starter & Pro with Stripe checkout */}
      <PricingSection />

      {/* Closer CTA: massive, high-contrast, pulsing button */}
      <CTASection isAuthenticated={isAuthenticated} />
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

function LandingNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 bg-midnight-ink/80 backdrop-blur-md border-b border-white/10">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <Logo size={40} className="h-10 w-10" />
        <span className="font-bold text-soft-cloud text-lg tracking-wide hidden sm:inline">
          Vantag<span className="text-cyber-amber">Fleet</span>
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="px-4 py-2.5 rounded-lg text-soft-cloud font-medium hover:bg-white/10 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href={isAuthenticated ? '/dashboard' : '/signup'}
          className="px-5 py-2.5 rounded-lg bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 transition-colors"
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
        </Link>
      </div>
    </nav>
  );
}

function CTASection({ isAuthenticated }: { isAuthenticated: boolean }) {
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
            href={isAuthenticated ? '/dashboard' : '/signup'}
            className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-cyber-amber text-midnight-ink font-bold text-xl hover:bg-cyber-amber/90 transition-colors shadow-[0_0_60px_-8px_rgba(255,176,0,0.5)]"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            <ArrowRight className="size-6" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
