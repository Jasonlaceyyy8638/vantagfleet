import Link from 'next/link';

const LAST_UPDATED = 'March 4, 2026';

export function PrivacyContent() {
  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-block text-sm text-soft-cloud/70 hover:text-cyber-amber mb-8 transition-colors"
        >
          ← Back to home
        </Link>

        <p className="text-soft-cloud/60 text-sm mb-2">Last Updated: {LAST_UPDATED}</p>
        <h1 className="text-3xl font-bold text-soft-cloud border-b border-cyber-amber/40 pb-2 mb-6">
          VantagFleet Privacy Policy
        </h1>
        <p className="text-soft-cloud/80 text-base leading-relaxed mb-10">
          This policy describes how we collect and protect data from your Electronic Logging Devices (ELD),
          Federal DOT records, and other sources when you use the VantagFleet fleet management and compliance platform.
        </p>

        <div className="space-y-8 text-soft-cloud/90">
          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">1. Information We Collect</h2>
            <p className="mb-3">
              We collect information you provide directly (account registration, company and DOT details, driver and vehicle data, documents),
              information we obtain automatically when you use the Service (log data, device information), and information from third parties
              (e.g., FMCSA or ELD providers). We use this information to provide, maintain, and improve the Service, ensure compliance-related
              functionality, and communicate with you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">2. Telematics & ELD Data</h2>
            <p className="mb-3">
              When you connect your ELD provider (Motive or Geotab) to VantagFleet, we collect and process the following data via their APIs
              for the purpose of IFTA automation, live fleet tracking, and compliance reporting:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li><strong>GPS coordinates</strong> - Vehicle location data (bread-crumb and real-time) for mileage and route reporting.</li>
              <li><strong>Engine hours</strong> - For utilization and maintenance-related features.</li>
              <li><strong>Odometer readings</strong> - For trip distance, IFTA state-mile allocation, and audit support.</li>
              <li><strong>VIN and vehicle identifiers</strong> - To match vehicles across our platform and your ELD.</li>
              <li><strong>HOS (Hours of Service) data</strong> - When provided by the ELD, for compliance and driver visibility.</li>
            </ul>
            <p>
              This data is used solely for IFTA automation, live fleet tracking, and compliance tools within your organization.
              We do not use ELD data for marketing, resale, or unrelated analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">3. Carrier Information (DOT Numbers & Company Names)</h2>
            <p className="mb-3">
              We collect and use your U.S. DOT number and company (carrier) name to:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li><strong>Verify fleet authority</strong> - Confirming your carrier identity with FMCSA and related sources where applicable.</li>
              <li><strong>Pre-fill IFTA filings</strong> - So that mileage and tax reports are correctly associated with your authority.</li>
              <li>Display carrier identity within your organization&apos;s dashboard and in exported reports.</li>
            </ul>
            <p>
              DOT numbers and company names are not sold or shared with third parties for advertising or unrelated purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">4. How We Use Your Information</h2>
            <p className="mb-3">
              We use the information we collect to operate the fleet management and compliance platform, provide IFTA automation and live fleet
              tracking, process transactions, send service-related communications, enforce our terms, comply with legal obligations, and for
              security. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">5. Data Retention</h2>
            <p className="mb-3">
              We retain your data as follows:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li><strong>Bread-crumb GPS and trip data</strong> - Retained for up to <strong>four (4) years</strong> to support IFTA audit
              requirements and regulatory record-keeping. You may request earlier deletion where not required by law.</li>
              <li><strong>Account and carrier data</strong> - Retained for as long as your account is active and as needed to provide the
              Service and comply with legal and compliance requirements.</li>
              <li><strong>Integration tokens (OAuth) and ELD credentials</strong> - Stored only as long as the integration is active; you may
              revoke access at any time from Integrations settings, after which we cease synchronization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">6. Data Security</h2>
            <p className="mb-3">
              We implement appropriate technical and organizational measures to protect your data. ELD credentials (including session tokens
              and, where applicable, encrypted passwords used for re-authentication) are stored using industry-standard encryption. Access to
              telematics and ELD data is restricted to authorized systems and personnel necessary to operate the Service. We do not use your
              ELD credentials for any purpose other than to retrieve data on your behalf as your read-only representative.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">7. Data Sharing and Disclosure</h2>
            <p className="mb-3">
              We may share information with service providers who assist in operating our Service (e.g., hosting, analytics, payment processing),
              when required by law, or to protect our rights and safety. We may share aggregated or de-identified data that cannot reasonably
              identify you. Data collected from Motive or Geotab is not sold or shared with third-party advertisers or insurance providers.
              It is only shared with authorized carrier administrators within your VantagFleet organization and, when explicitly exported by you,
              in DOT-ready or audit reports.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">8. Your Rights and Choices</h2>
            <p className="mb-3">
              Depending on your location, you may have rights to access, correct, delete, or port your personal data, or to object to or
              restrict certain processing. You can manage account settings, disconnect ELD integrations at any time, and contact us at{' '}
              <a href="mailto:info@vantagfleet.com" className="text-cyber-amber hover:underline">info@vantagfleet.com</a> for requests or questions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on
              this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">10. Contact Us</h2>
            <p>
              For privacy-related questions or requests, contact us at{' '}
              <a href="mailto:info@vantagfleet.com" className="text-cyber-amber hover:underline">info@vantagfleet.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
