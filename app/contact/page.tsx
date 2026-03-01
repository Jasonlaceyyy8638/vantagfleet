import { createClient } from '@/lib/supabase/server';
import { ContactForm } from './ContactForm';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export const metadata = {
  title: 'Contact Support — VantagFleet',
  description: 'Contact VantagFleet support for fleet management and compliance.',
};

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const defaultEmail = user?.email ?? null;

  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud">
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-block text-sm text-soft-cloud/70 hover:text-cyber-amber mb-8 transition-colors"
        >
          ← Back to home
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-cyber-amber/20">
            <MessageCircle className="size-8 text-cyber-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-soft-cloud">Contact Support</h1>
            <p className="text-soft-cloud/70 text-sm mt-0.5">
              We&apos;ll respond as soon as we can.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-card p-6 shadow-lg">
          <ContactForm defaultEmail={defaultEmail} />
        </div>
      </div>
    </div>
  );
}
