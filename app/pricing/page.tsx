import { Pricing } from '@/components/Pricing';
import Link from 'next/link';
import { SUBSCRIPTION_TRIAL_DAYS } from '@/lib/beta-config';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="p-6 md:p-10 pb-16">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Pricing</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">One plan · full workspace</h1>
          <p className="text-slate-600 mt-3 text-lg">
            $129/mo or $1,290/yr for the full workspace while we keep expanding integrations.
          </p>
          <p className="text-slate-500 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
            Checkout always uses your live Stripe prices (env price IDs). Displayed amounts should match those Prices.
          </p>
          <p className="text-slate-500 text-sm mt-4 max-w-xl mx-auto leading-relaxed">
            Subscriptions include a <strong className="text-slate-700">{SUBSCRIPTION_TRIAL_DAYS}-day trial</strong>.
            Create an account at{' '}
            <Link href="/signup" className="text-amber-700 font-semibold hover:underline">
              /signup
            </Link>{' '}
            (email only), then subscribe when you&apos;re ready.
          </p>
        </div>
        <Pricing variant="light" />
        <p className="text-center text-slate-500 text-sm mt-10">
          <Link href="/" className="hover:text-slate-800 font-medium">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
