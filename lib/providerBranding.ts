/**
 * Provider-specific branding for ELD integrations (Motive, Geotab, Samsara).
 * Use in Connection Success popup and anywhere we surface the connected provider.
 */

export type ProviderBrandId = 'motive' | 'geotab' | 'samsara' | 'fmcsa';

export type ProviderBranding = {
  id: ProviderBrandId;
  name: string;
  /** Primary brand color (hex). */
  primary: string;
  /** Lighter variant for text on dark backgrounds (hex). */
  primaryLight: string;
  /** Secondary/dark color for contrast (hex). */
  secondary?: string;
  /** CSS class for bg with opacity, e.g. "bg-[#0066FF]/20". */
  bgClass: string;
  /** CSS class for text/icon, e.g. "text-[#0066FF]". */
  textClass: string;
  /** CSS class for border, e.g. "border-[#0066FF]/40". */
  borderClass: string;
};

const MOTIVE_BLUE = '#0066FF';
const GEOTAB_BLUE = '#003366';
const GEOTAB_BLACK = '#0F0F0F';
const SAMSARA_TEAL = '#14B8A6';
const FMCSA_NEUTRAL = '#0EA5E9'; // neutral blue for government

export const PROVIDER_BRANDING: Record<ProviderBrandId, ProviderBranding> = {
  motive: {
    id: 'motive',
    name: 'Motive',
    primary: MOTIVE_BLUE,
    primaryLight: '#3B82F6',
    secondary: '#0047AB',
    bgClass: 'bg-[#0066FF]/20',
    textClass: 'text-[#0066FF]',
    borderClass: 'border-[#0066FF]/50',
  },
  geotab: {
    id: 'geotab',
    name: 'Geotab',
    primary: GEOTAB_BLUE,
    primaryLight: '#60A5FA',
    secondary: GEOTAB_BLACK,
    bgClass: 'bg-[#003366]/25',
    textClass: 'text-[#003366]',
    borderClass: 'border-[#003366]/50',
  },
  samsara: {
    id: 'samsara',
    name: 'Samsara',
    primary: SAMSARA_TEAL,
    primaryLight: '#2DD4BF',
    secondary: '#0D9488',
    bgClass: 'bg-[#14B8A6]/20',
    textClass: 'text-[#14B8A6]',
    borderClass: 'border-[#14B8A6]/50',
  },
  fmcsa: {
    id: 'fmcsa',
    name: 'FMCSA',
    primary: FMCSA_NEUTRAL,
    primaryLight: '#38BDF8',
    bgClass: 'bg-[#0EA5E9]/20',
    textClass: 'text-[#0EA5E9]',
    borderClass: 'border-[#0EA5E9]/50',
  },
};

export function getProviderBranding(provider: string | null | undefined): ProviderBranding {
  const p = (provider || '').toLowerCase().replace(/\s+/g, '_');
  if (p === 'motive') return PROVIDER_BRANDING.motive;
  if (p === 'geotab') return PROVIDER_BRANDING.geotab;
  if (p === 'samsara') return PROVIDER_BRANDING.samsara;
  if (p === 'fmcsa') return PROVIDER_BRANDING.fmcsa;
  return PROVIDER_BRANDING.motive;
}
