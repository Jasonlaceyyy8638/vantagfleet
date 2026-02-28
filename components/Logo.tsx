'use client';

const ELECTRIC_TEAL = '#00F5D4';
const CYBER_AMBER = '#FFB000';

type LogoProps = {
  className?: string;
  size?: number;
};

/**
 * VantagFleet logo: a 'V' made of two sharp, overlapping geometric blades.
 * Left blade: Electric Teal. Right blade: Cyber Amber.
 */
export function Logo({ className = '', size = 36 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Left blade (Electric Teal) – sharp geometric blade */}
      <path
        d="M 12 14 L 48 86 L 52 86 L 16 14 Z"
        fill={ELECTRIC_TEAL}
        stroke={ELECTRIC_TEAL}
        strokeWidth="1"
        strokeLinejoin="miter"
      />
      {/* Right blade (Cyber Amber) – overlapping sharp blade */}
      <path
        d="M 88 14 L 52 86 L 48 86 L 84 14 Z"
        fill={CYBER_AMBER}
        stroke={CYBER_AMBER}
        strokeWidth="1"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
