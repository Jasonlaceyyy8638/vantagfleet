import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { SignUpForm } from './SignUpForm';
import { Logo } from '@/components/Logo';
import { AuthBackground } from '@/components/AuthBackground';
import Link from 'next/link';

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const admin = await isAdmin(supabase);
    redirect(admin ? '/admin' : '/dashboard');
  }

  return (
    <AuthBackground>
      <div className="w-full max-w-md rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-6 sm:p-8 shadow-[0_0_40px_-12px_rgba(255,176,0,0.15)]">
        <div className="flex flex-col items-center text-center mb-4">
          <Logo size={64} className="h-16 w-16 shrink-0" />
          <h1 className="text-xl font-bold text-soft-cloud mt-4">
            Welcome to <span className="text-soft-cloud">Vantag</span><span className="text-cyber-amber">Fleet</span>
          </h1>
        </div>
        <div className="text-soft-cloud/70 text-sm mb-4 space-y-2 text-left">
          <p>
            Register your company, then set your login. Subscriptions include a 7-day trial; a card is collected in
            Stripe when you choose a plan.
          </p>
        </div>
        <SignUpForm />
        <p className="mt-4 text-center text-sm text-soft-cloud/90">
          Already have an account?{' '}
          <Link href="/login" className="text-cyber-amber font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
}
