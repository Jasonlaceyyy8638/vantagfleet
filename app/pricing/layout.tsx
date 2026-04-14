import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vantag Fleet — TMS Pricing | Solo, Fleet & Enterprise',
  description:
    'Transparent TMS pricing for carriers and brokers: Solo, Fleet, and Enterprise. Founder access, trials, and annual savings.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
