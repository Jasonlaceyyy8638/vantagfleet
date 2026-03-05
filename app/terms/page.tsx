import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - VantagFleet',
  description: 'Terms of Service for VantagFleet fleet management and compliance platform. IFTA disclaimer, ELD access, subscription terms.',
};

const LAST_UPDATED = 'March 4, 2026';

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

        <p className="text-soft-cloud/60 text-sm mb-2">Last Updated: {LAST_UPDATED}</p>
        <h1 className="text-3xl font-bold text-soft-cloud border-b border-cyber-amber/40 pb-2 mb-6">
          Terms of Service
        </h1>
        <p className="text-soft-cloud/80 text-base leading-relaxed mb-10">
          Welcome to VantagFleet. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the VantagFleet 
          fleet management and compliance platform, including our websites, applications, and related services (the &quot;Service&quot;) 
          that help motor carriers, fleet operators, and drivers manage compliance, documentation, safety, and operational data.
        </p>

        <div className="space-y-8 text-soft-cloud/90">
          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account, accessing, or using the Service, you agree to be bound by these Terms and our{' '}
              <Link href="/privacy" className="text-cyber-amber hover:underline">Privacy Policy</Link>. If you are using 
              the Service on behalf of an organization, you represent that you have authority to bind that organization. 
              If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">2. Description of Service</h2>
            <p>
              VantagFleet provides a software-as-a-service platform for fleet management and regulatory compliance, including 
              driver and vehicle tracking, document management, compliance alerts, IFTA reporting tools, and integration with 
              third-party ELD providers (e.g., Motive, Geotab). We reserve the right to modify, suspend, or discontinue any 
              part of the Service with reasonable notice where practicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">3. Account and Authorized Use</h2>
            <p className="mb-3">
              You must provide accurate registration information and keep it current. You are responsible for maintaining the 
              confidentiality of your account credentials and for all activity under your account. You agree to use the Service 
              only for lawful purposes and in accordance with these Terms and applicable laws.
            </p>
            <p className="mb-3">
              <strong>Authorized Use of DOT Numbers.</strong> You represent and warrant that you have the legal authority to 
              connect and use the U.S. DOT number(s) you provide to VantagFleet. You may only link DOT numbers for carriers 
              for which you are an authorized representative, owner, or otherwise permitted to manage compliance and reporting. 
              Misrepresentation of authority may result in immediate termination of your account.
            </p>
            <p>
              You may not misuse the Service, attempt to gain unauthorized access, or use the Service in any way that could 
              harm us or other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">4. ELD Access and Read-Only Representative</h2>
            <p>
              When you connect an Electronic Logging Device (ELD) provider (Motive, Geotab, or other supported providers) to 
              VantagFleet, you grant VantagFleet permission to act as your <strong>read-only</strong> representative for that 
              ELD account. We will access your ELD data solely to retrieve GPS, odometer, trip, and related information 
              necessary to provide IFTA automation, live fleet tracking, and compliance features. We do not modify, delete, 
              or submit data to your ELD on your behalf unless explicitly part of a feature you use. You may revoke this 
              access at any time by disconnecting the integration in your VantagFleet Integrations settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">5. Your Data and Compliance</h2>
            <p>
              You retain ownership of data you submit to the Service. By using the Service, you grant us a limited license to 
              use, store, and process your data as necessary to provide and improve the Service and as described in our Privacy 
              Policy. You are responsible for the accuracy of data you provide and for ensuring that your use of the Service 
              complies with applicable regulatory and legal requirements for your fleet and operations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">6. Fees and Subscription Terms</h2>
            <p className="mb-3">
              Certain parts of the Service are subject to fees as described on our pricing page or in a separate agreement. 
              Subscription terms include:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li><strong>Free trial.</strong> Eligible plans may include a <strong>7-day free trial</strong>. You will not 
              be charged until the trial ends unless you cancel before then.</li>
              <li><strong>Billing cycles.</strong> Paid plans (e.g., Fleet Master at $199/month, Enterprise at $399/month, 
              or their annual equivalents) are billed in advance on a monthly or annual basis as selected by you.</li>
              <li>We may change fees with reasonable notice. Failure to pay may result in suspension or termination of access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">7. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available.&quot; We disclaim all warranties of any kind, express or 
              implied, including merchantability and fitness for a particular purpose. We do not warrant that the Service 
              will be uninterrupted, error-free, or that it will meet your specific compliance or operational requirements. 
              You use the Service at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">8. Tax & Compliance Disclaimer</h2>
            <p className="mb-3">
              VantagFleet provides automated IFTA calculations and reporting tools based on data retrieved from third-party 
              ELD providers and other sources you provide. VantagFleet is <strong>not</strong> a licensed tax professional 
              or a government agency.
            </p>
            <p className="mb-3">
              The Customer (Carrier) maintains <strong>sole responsibility</strong> for the accuracy, filing, and payment 
              of all IRP and IFTA taxes. Under IFTA/IRP rules, the Carrier is the &quot;Record Keeper&quot; and is ultimately 
              responsible for the accuracy of their tax filings. VantagFleet shall not be held liable for any audits, fines, 
              or penalties resulting from data discrepancies, calculation errors, or failure to file or pay taxes on time.
            </p>
            <p>
              You are encouraged to review all generated reports and consult a qualified tax or compliance professional 
              before submitting any filings to state or provincial authorities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">9. Service Interruptions and Third-Party ELD APIs</h2>
            <p>
              VantagFleet depends on third-party ELD and telematics providers (including but not limited to Motive and 
              Geotab) for data synchronization. We are <strong>not liable</strong> for any failure or delay in the Service 
              caused by the unavailability, outage, or failure of Motive, Geotab, or any other third-party API or service. 
              We will use commercially reasonable efforts to restore connectivity when possible but do not guarantee 
              uninterrupted access to ELD-derived features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, VantagFleet and its affiliates shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or for loss of profits, data, or business opportunity, 
              arising from or related to your use of the Service (including but not limited to reliance on IFTA or compliance 
              outputs). Our total liability shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless VantagFleet and its officers, directors, employees, and agents from 
              any claims, damages, or expenses (including reasonable attorneys&apos; fees) arising from your use of the Service, 
              your violation of these Terms, your violation of any applicable law or third-party rights, or any tax or 
              compliance liability arising from your filings or reporting.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">12. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time for violation of these Terms or for any 
              other reason. You may terminate your account by contacting us. Upon termination, your right to use the Service 
              ceases; we may retain and use your data as permitted by law and our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">13. General</h2>
            <p>
              These Terms constitute the entire agreement between you and VantagFleet regarding the Service. Our failure to 
              enforce any right does not waive that right. If any provision is held invalid, the remaining provisions 
              remain in effect. We may modify these Terms from time to time; continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">14. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:info@vantagfleet.com" className="text-cyber-amber hover:underline">info@vantagfleet.com</a>. 
              Our Privacy Policy is available at <Link href="/privacy" className="text-cyber-amber hover:underline">/privacy</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
