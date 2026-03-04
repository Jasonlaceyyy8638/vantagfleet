'use client';

import { useEffect, useRef } from 'react';

const HERO_VIDEO_SOURCES = [
  ...(typeof process !== 'undefined' && process.env.NEXT_PUBLIC_HERO_VIDEO_URL
    ? [process.env.NEXT_PUBLIC_HERO_VIDEO_URL]
    : []),
  '/videos/hero-truck.mp4',
  'https://dmejysrnxvpjenutdypx.supabase.co/storage/v1/object/public/hero-assets/hero-truck.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-highway-traffic-at-night-with-long-exposure-4010-large.mp4',
].filter(Boolean);

export function AuthBackground({ children }: { children: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 min-h-screen min-w-full overflow-hidden bg-midnight-ink">
      {/* Gradient fallback when video is blocked or fails */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-midnight-ink via-midnight-ink to-cyber-amber/20"
        aria-hidden
      />
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      >
        {HERO_VIDEO_SOURCES.map((src) => (
          <source key={src} src={src} type="video/mp4" />
        ))}
      </video>
      <div className="absolute inset-0 bg-black/50 z-[1]" aria-hidden />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
