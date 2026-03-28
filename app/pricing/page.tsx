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
            Sign up at <Link href="/signup" className="text-cyber-amber/90 font-medium hover:underline">/signup</Link> with{' '}
            <strong className="text-soft-cloud/80">no credit card</strong>. The first 5 carriers get{' '}
            <strong className="text-cyber-amber/90">90 days of Enterprise-level access</strong>. After those founder slots are filled, Enterprise offers a{' '}
            <strong className="text-cyber-amber/90">14-day trial with no credit card at checkout</strong>.{' '}
            Fleet Master includes a <strong className="text-soft-cloud/80">7-day trial</strong>, also{' '}
            <strong className="text-soft-cloud/80">without a card at checkout</strong>. Add payment before the trial ends to stay subscribed.
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
