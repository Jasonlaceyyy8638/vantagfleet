'use client';

import Image from 'next/image';

type MapPreviewProps = {
  /** Optional high-quality image URL (e.g. static fleet map screenshot). Falls back to CSS map-style background. */
  imageSrc?: string | null;
  /** Optional alt text when using image. */
  imageAlt?: string;
  /** Height of the preview area. Defaults to full viewport. */
  className?: string;
};

/**
 * Static, high-quality map-style background with heavy blur and dark overlay.
 * Used as the background for Solo Pro users on the Live Map upgrade experience.
 */
export function MapPreview({ imageSrc, imageAlt = 'Fleet map preview', className = 'min-h-[calc(100vh-8rem)]' }: MapPreviewProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-xl ${className}`}>
      {/* Base: image or CSS map-style background */}
      {imageSrc ? (
        <div className="absolute inset-0">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      ) : (
        <>
          <div
            className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
            }}
            aria-hidden
          />
          {/* Subtle "roads" for map feel */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 20%, rgba(255,255,255,0.03) 80%, transparent 100%),
                linear-gradient(0deg, transparent 0%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0.03) 70%, transparent 100%)
              `,
              backgroundSize: '120px 80px',
            }}
            aria-hidden
          />
        </>
      )}
      {/* Heavy blur + dark semi-transparent overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-midnight-ink/70" aria-hidden />
    </div>
  );
}
