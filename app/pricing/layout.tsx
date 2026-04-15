import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vantag Fleet — TMS Pricing | One full plan',
  description:
    'Single TMS workspace plan for carriers and brokers: monthly or annual billing while integrations expand.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
