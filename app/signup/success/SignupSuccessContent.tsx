'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

const LINES = [
  { key: 'dot', prefix: '[SYSTEM] Verifying DOT: ', suffix: '... SUCCESS', paramKey: 'dot' as const },
  { key: 'motive', prefix: '[SYSTEM] Linking Motive API... ', suffix: 'CONNECTED', paramKey: null },
  { key: 'trial', prefix: '[SYSTEM] Initializing 30-Day Diamond Trial... ', suffix: 'ACTIVE', paramKey: null },
] as const;

function playSystemBeep() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch {
    // ignore
  }
}

export default function SignupSuccessContent() {
  const searchParams = useSearchParams();
  const dotNumber = searchParams.get('dot')?.trim() || '••••••';
  const [visibleLines, setVisibleLines] = useState<typeof LINES[number]['key'][]>([]);
  const [showReveal, setShowReveal] = useState(false);
  const beepPlayed = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines((prev) => [...prev, line.key]), 400 + i * 350));
    });
    timers.push(setTimeout(() => setShowReveal(true), 3000));
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!showReveal || beepPlayed.current) return;
    beepPlayed.current = true;
    const w = typeof window !== 'undefined' ? (window as unknown as { __TAURI__?: unknown; __TAURI_INTERNAL__?: unknown }) : null;
    if (w && (w.__TAURI__ || w.__TAURI_INTERNAL__)) {
      import('@tauri-apps/api/core')
        .then(({ invoke }) => invoke('play_system_beep').catch(() => playSystemBeep()))
        .catch(() => playSystemBeep());
    } else {
      playSystemBeep();
    }
  }, [showReveal]);

  return (
    <div className="relative min-h-screen bg-[#0B0F19] overflow-hidden">
      {/* Amber scanning line */}
      <div
        className="absolute left-0 right-0 h-px bg-[#FFBF00]/40 pointer-events-none z-10 animate-scan-line"
        aria-hidden
      />
      <div
        className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-[#FFBF00]/10 to-transparent pointer-events-none z-10 animate-scan-line"
        style={{ animationDelay: '0.5s' }}
        aria-hidden
      />

      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Boot text */}
        <div className="font-mono text-sm sm:text-base text-soft-cloud/90 space-y-2 max-w-lg w-full">
          {LINES.map((line) => (
            <AnimatePresence key={line.key}>
              {visibleLines.includes(line.key) && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-wrap items-baseline gap-1"
                >
                  <span className="text-soft-cloud/70">{line.prefix}</span>
                  <span className="text-[#FFBF00]">
                    {line.paramKey === 'dot' ? dotNumber : ''}
                  </span>
                  <span className="text-green-400 font-medium">{line.suffix}</span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Big reveal: checkmark + button */}
        <AnimatePresence>
          {showReveal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-16 flex flex-col items-center gap-8"
            >
              <div className="rounded-full bg-[#FFBF00]/20 p-6 ring-4 ring-[#FFBF00]/30">
                <Check className="size-20 sm:size-24 text-[#FFBF00]" strokeWidth={2.5} />
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#FFBF00] px-8 py-4 text-lg font-bold text-[#0B0F19] hover:bg-[#FFBF00]/90 transition-colors shadow-[0_0_40px_-8px_rgba(255,191,0,0.5)]"
              >
                Enter Command Center
                <ArrowRight className="size-5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
