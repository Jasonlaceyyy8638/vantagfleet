import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SignUpForm } from './SignUpForm';

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
      <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-card p-6 shadow-xl">
        <h1 className="text-xl font-bold text-cloud-dancer mb-1">Create your account</h1>
        <p className="text-cloud-dancer/70 text-sm mb-6">Register your company, then set your login.</p>
        <SignUpForm />
        <p className="mt-4 text-center text-sm text-cloud-dancer/70">
          Already have an account?{' '}
          <a href="/login" className="text-transformative-teal hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
