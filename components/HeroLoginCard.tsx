'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PasswordInput } from '@/components/PasswordInput';

const ADMIN_OWNER_ID = 'ae175e55-72b4-4441-9e3c-02ecd8225bf7';

export function HeroLoginCard({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    const destination = user?.id === ADMIN_OWNER_ID ? '/admin' : redirectTo;
    router.push(destination);
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 w-full max-w-md mx-auto px-4"
    >
      <div
        className="relative backdrop-blur-2xl bg-black/40 border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(255,191,0,0.3)]"
      >
        {/* HUD-style corner brackets — very thin amber */}
        <span className="absolute top-3 left-3 w-4 h-4 border-l border-t border-[#FFBF00] hud-corner" aria-hidden />
        <span className="absolute top-3 right-3 w-4 h-4 border-r border-t border-[#FFBF00] hud-corner" aria-hidden />
        <span className="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-[#FFBF00] hud-corner" aria-hidden />
        <span className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-[#FFBF00] hud-corner" aria-hidden />
        <h2 className="text-xl font-semibold text-white text-center mb-6 font-sans">
          Welcome to the Cab
        </h2>
        <form onSubmit={handleSignIn} className="space-y-5">
          <div>
            <label htmlFor="hero-email" className="sr-only">
              Email
            </label>
            <input
              id="hero-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00]/50 transition-colors text-base touch-manipulation"
            />
          </div>
          <div>
            <label htmlFor="hero-password" className="sr-only">
              Password
            </label>
            <PasswordInput
              id="hero-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00]/50 transition-colors text-base touch-manipulation pr-12"
            />
            <div className="mt-1.5 text-right">
              <Link href="/forgot-password" className="text-sm text-[#FFBF00] hover:text-[#FFBF00]/90">
                Forgot password?
              </Link>
            </div>
          </div>
          {message && (
            <p className="text-sm text-red-400 text-center">{message}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="hero-amber-btn w-full min-h-[48px] py-3.5 rounded-xl font-semibold text-black text-base bg-[#FFBF00] hover:bg-[#FFBF00]/95 disabled:opacity-50 transition-colors touch-manipulation"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
