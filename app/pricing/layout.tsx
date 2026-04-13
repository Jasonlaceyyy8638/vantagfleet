import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vantag Fleet — Powerful Tools for Serious Logistics Teams',
  description:
    'Freight operations in one platform—Solo Pro, Fleet Master, and Enterprise TMS pricing.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
