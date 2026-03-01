import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — VantagFleet',
  description: 'Privacy Policy for VantagFleet fleet management and compliance platform.',
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-soft-cloud/80 text-sm mb-6">Last updated: January 2026</p>

        <div className="space-y-6 text-soft-cloud/90">
          <p>
            VantagFleet (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the VantagFleet fleet management and
            compliance platform (the &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our Service, including our websites, applications, and
            related tools designed for motor carriers, fleet operators, and drivers to manage compliance,
            documentation, and safety.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">1. Information We Collect</h2>
          <p>
            We collect information that you provide directly (e.g., account registration, company and DOT
            details, driver and vehicle data, documents), information we obtain automatically when you use
            the Service (e.g., log data, device information), and information from third parties (e.g., FMCSA
            or other compliance sources where applicable). We use this information to provide, maintain, and
            improve the Service, ensure compliance-related functionality, and communicate with you.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to operate the fleet management and compliance platform,
            process transactions, send service-related communications, enforce our terms, comply with
            legal obligations, and for analytics and security. We do not sell your personal information to
            third parties.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">3. Data Sharing and Disclosure</h2>
          <p>
            We may share information with service providers who assist in operating our Service (e.g.,
            hosting, analytics, payment processing), when required by law, or to protect our rights and
            safety. We may share aggregated or de-identified data that cannot reasonably identify you.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">4. Data Security and Retention</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your data. We
            retain your information for as long as your account is active or as needed to provide the
            Service and comply with legal and compliance requirements applicable to fleet and driver data.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">5. Your Rights and Choices</h2>
          <p>
            Depending on your location, you may have rights to access, correct, delete, or port your
            personal data, or to object to or restrict certain processing. You can manage account
            settings and contact us at{' '}
            <a href="mailto:info@vantagfleet.com" className="text-cyber-amber hover:underline">
              info@vantagfleet.com
            </a>{' '}
            for requests or questions.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">6. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes
            by posting the updated policy on this page and updating the &quot;Last updated&quot; date. Your continued
            use of the Service after changes constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-2">7. Contact Us</h2>
          <p>
            For privacy-related questions or requests, contact us at{' '}
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
