import { Pricing } from '@/components/Pricing';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud">
      <div className="p-6 md:p-10">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h1 className="text-3xl font-bold text-soft-cloud">Solo Pro, Fleet Master & Enterprise</h1>
          <p className="text-soft-cloud/70 mt-2">One dashboard. Choose what fits your fleet.</p>
          <p className="text-soft-cloud/60 text-sm mt-2 max-w-xl mx-auto">
            Fleet Master: 7-day trial (card at checkout). When founder beta is full, Enterprise includes a{' '}
            <strong className="text-cyber-amber/90">14-day trial with no credit card</strong> — add payment before the trial ends to stay on Enterprise.
          </p>
        </div>
        <Pricing />
        <p className="text-center text-soft-cloud/50 text-sm mt-8">
          <Link href="/" className="hover:text-soft-cloud/80">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
