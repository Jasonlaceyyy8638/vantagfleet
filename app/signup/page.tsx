import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SignUpForm } from './SignUpForm';

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md rounded-xl border border-slate-700/80 bg-slate-800/80 p-6 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-slate-400 text-sm mb-6">Register your company, then set your login.</p>
        <SignUpForm />
        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <a href="/login" className="text-primary-400 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
