import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — VantagFleet',
  description: 'Terms of Service for VantagFleet fleet management and compliance platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-block text-sm text-soft-cloud/70 hover:text-cyber-amber mb-8 transition-colors"
        >
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-soft-cloud border-b border-cyber-amber/40 pb-2 mb-8">
          Terms of Service
        </h1>
        <p className="text-soft-cloud/80 text-sm mb-6">Last updated: January 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-soft-cloud/90">
          <p>
            Welcome to VantagFleet. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the
            VantagFleet fleet management and compliance platform, including our websites, applications, and
            related services (the &quot;Service&quot;) that help motor carriers, fleet operators, and drivers manage
            compliance, documentation, safety, and operational data.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">1. Acceptance of Terms</h2>
          <p>
            By creating an account, accessing, or using the Service, you agree to be bound by these Terms
            and our Privacy Policy. If you are using the Service on behalf of an organization, you represent
            that you have authority to bind that organization. If you do not agree, do not use the Service.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">2. Description of Service</h2>
          <p>
            VantagFleet provides a software-as-a-service platform for fleet management and regulatory
            compliance, including but not limited to driver and vehicle tracking, document management,
            compliance alerts, and tools to help users meet applicable regulatory requirements (e.g., DOT,
            FMCSA). We reserve the right to modify, suspend, or discontinue any part of the Service with
            reasonable notice where practicable.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">3. Account and Use</h2>
          <p>
            You must provide accurate registration information and keep it current. You are responsible
            for maintaining the confidentiality of your account credentials and for all activity under your
            account. You agree to use the Service only for lawful purposes and in accordance with these
            Terms and applicable laws. You may not misuse the Service, attempt to gain unauthorized
            access, or use the Service in any way that could harm us or other users.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">4. Your Data and Compliance</h2>
          <p>
            You retain ownership of data you submit to the Service. By using the Service, you grant us a
            limited license to use, store, and process your data as necessary to provide and improve the
            Service and as described in our Privacy Policy. You are responsible for the accuracy of data
            you provide and for ensuring that your use of the Service complies with applicable regulatory
            and legal requirements for your fleet and operations.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">5. Fees and Payment</h2>
          <p>
            Certain parts of the Service may be subject to fees as described in our pricing or in a separate
            agreement. You agree to pay all applicable fees when due. We may change fees with reasonable
            notice. Failure to pay may result in suspension or termination of access.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">6. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available.&quot; We disclaim all warranties of any kind,
            express or implied, including merchantability and fitness for a particular purpose. We do not
            warrant that the Service will be uninterrupted, error-free, or that it will meet your specific
            compliance or operational requirements. You use the Service at your own risk.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, VantagFleet and its affiliates shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages, or for loss of profits,
            data, or business opportunity, arising from or related to your use of the Service. Our total
            liability shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">8. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless VantagFleet and its officers, directors, employees,
            and agents from any claims, damages, or expenses (including reasonable attorneys&apos; fees) arising
            from your use of the Service, your violation of these Terms, or your violation of any
            applicable law or third-party rights.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">9. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time for violation of these
            Terms or for any other reason. You may terminate your account by contacting us. Upon
            termination, your right to use the Service ceases; we may retain and use your data as
            permitted by law and our Privacy Policy.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">10. General</h2>
          <p>
            These Terms constitute the entire agreement between you and VantagFleet regarding the
            Service. Our failure to enforce any right does not waive that right. If any provision is held
            invalid, the remaining provisions remain in effect. We may modify these Terms from time to
            time; continued use after changes constitutes acceptance.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">11. Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:info@vantagfleet.com" className="text-cyber-amber hover:underline">
              info@vantagfleet.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
