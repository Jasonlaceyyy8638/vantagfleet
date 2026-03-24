import Link from 'next/link';
import { Mail, Monitor } from 'lucide-react';
import { EMAIL_SUPPORT, EMAIL_INFO, EMAIL_BILLING } from '@/lib/email-addresses';

export function Footer() {
  return (
    <footer className="border-t border-cyber-amber/60 bg-midnight-ink text-soft-cloud">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="order-2 sm:order-1 text-soft-cloud/70">
            © 2026 VantagFleet. All rights reserved.
          </div>
          <nav className="order-1 sm:order-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6" aria-label="Footer">
            <Link
              href="/privacy"
              className="text-soft-cloud/80 hover:text-cyber-amber transition-colors py-2 min-h-[44px] inline-flex items-center"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-soft-cloud/80 hover:text-cyber-amber transition-colors py-2 min-h-[44px] inline-flex items-center"
            >
              Terms of Service
            </Link>
            <Link
              href="/#pricing"
              className="text-soft-cloud/80 hover:text-cyber-amber transition-colors py-2 min-h-[44px] inline-flex items-center"
            >
              Pricing
            </Link>
            <Link
              href="/#integrations"
              className="text-soft-cloud/80 hover:text-cyber-amber transition-colors py-2 min-h-[44px] inline-flex items-center"
            >
              Integrations
            </Link>
            <Link
              href="/download"
              className="hidden md:inline-flex items-center gap-2 text-soft-cloud/80 hover:text-cyber-amber transition-colors py-2 min-h-[44px]"
            >
              <Monitor className="size-4" aria-hidden />
              Download Desktop App
            </Link>
          </nav>
          <div className="order-3 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`mailto:${EMAIL_SUPPORT}`}
              className="inline-flex items-center gap-2 text-soft-cloud/80 hover:text-cyber-amber transition-colors py-2 min-h-[44px]"
            >
              <Mail className="size-4" aria-hidden />
              Help
            </a>
            <a
              href={`mailto:${EMAIL_BILLING}`}
              className="inline-flex items-center gap-2 text-soft-cloud/80 hover:text-cyber-amber transition-colors py-2 min-h-[44px]"
            >
              Billing
            </a>
            <a
              href={`mailto:${EMAIL_INFO}`}
              className="inline-flex items-center gap-2 text-soft-cloud/80 hover:text-cyber-amber transition-colors py-2 min-h-[44px]"
            >
              General Inquiries
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
