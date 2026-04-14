import { Pricing } from '@/components/Pricing';
import Link from 'next/link';
import { SUBSCRIPTION_TRIAL_DAYS } from '@/lib/beta-config';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="p-6 md:p-10 pb-16">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Pricing</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Solo, Fleet & Enterprise</h1>
          <p className="text-slate-600 mt-3 text-lg">
            TMS-class freight operations—dispatch, visibility, settlements, and broker workflows in one subscription.
          </p>
          <p className="text-slate-500 text-sm mt-4 max-w-xl mx-auto leading-relaxed">
            Every paid plan includes a <strong className="text-slate-700">{SUBSCRIPTION_TRIAL_DAYS}-day trial</strong>.
            Create an account at{' '}
            <Link href="/signup" className="text-amber-700 font-semibold hover:underline">
              /signup
            </Link>{' '}
            (email only), then choose a plan when you&apos;re ready.
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
