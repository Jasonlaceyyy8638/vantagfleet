'use client';

import { getProviderBranding, type ProviderBrandId } from '@/lib/providerBranding';

type ProviderBrandingProps = {
  provider: ProviderBrandId | string;
  /** Show logo only (icon circle). */
  logoOnly?: boolean;
  /** Size of the logo container. */
  size?: 'sm' | 'md' | 'lg';
  /** Use lighter color for icon/text on dark backgrounds. */
  variant?: 'default' | 'dark';
  className?: string;
};

const sizeClasses = { sm: 'h-12 w-12', md: 'h-16 w-16', lg: 'h-20 w-20' };

/** Motive-style M mark (simplified). */
function MotiveLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden>
      <path d="M8 8h4v16h-4V8zm6 0h4l4 8 4-8h4v16h-4V14l-4 6-4-6v10h-4V8z" />
    </svg>
  );
}

/** Geotab G mark (simplified). */
function GeotabLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden>
      <path d="M16 6a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 2v6l4-3-4-3z" />
    </svg>
  );
}

/** Samsara wave/road (simplified). */
function SamsaraLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden>
      <path d="M6 18h4v-4H6v4zm6 0h4v-4h-4v4zm6-4v4h4v-4h-4zm6 4h4v-4h-4v4zM6 14h20v2H6v-2z" />
    </svg>
  );
}

/** FMCSA shield outline. */
function FmcsaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M16 4L4 10v6c0 6 6 10 12 12 6-2 12-6 12-12v-6L16 4z" stroke="currentColor" />
    </svg>
  );
}

function ProviderLogoIcon({ provider, size }: { provider: ProviderBrandId; size: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-7 w-7' : 'h-9 w-9';
  switch (provider) {
    case 'motive':
      return <MotiveLogo className={iconSize} />;
    case 'geotab':
      return <GeotabLogo className={iconSize} />;
    case 'samsara':
      return <SamsaraLogo className={iconSize} />;
    case 'fmcsa':
      return <FmcsaLogo className={iconSize} />;
    default:
      return <MotiveLogo className={iconSize} />;
  }
}

export function ProviderBranding({ provider, logoOnly = false, size = 'md', variant = 'default', className = '' }: ProviderBrandingProps) {
  const branding = getProviderBranding(provider);
  const id = branding.id as ProviderBrandId;
  const sizeClass = sizeClasses[size];
  const iconColor = variant === 'dark' ? branding.primaryLight : branding.primary;

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center ${branding.bgClass} ${branding.borderClass} border-2`}
        style={{ borderColor: branding.primary }}
        role="img"
        aria-label={`${branding.name} logo`}
      >
        <span style={{ color: iconColor }}>
          <ProviderLogoIcon provider={id} size={size} />
        </span>
      </div>
      {!logoOnly && (
        <span className="text-sm font-semibold" style={{ color: iconColor }}>
          {branding.name}
        </span>
      )}
    </div>
  );
}

export { getProviderBranding };
export type { ProviderBranding as ProviderBrandingType } from '@/lib/providerBranding';
