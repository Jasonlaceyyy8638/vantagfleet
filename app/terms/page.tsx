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

        <div className="border-b border-white/10 pb-6 mb-8">
          <p className="text-soft-cloud/50 text-xs uppercase tracking-wider mb-1">Effective Date</p>
          <p className="text-soft-cloud/70 text-sm">{LAST_UPDATED}</p>
          <h1 className="text-3xl font-bold text-soft-cloud mt-4 border-b border-cyber-amber/40 pb-2">
            Terms of Service
          </h1>
        </div>

        <p className="text-soft-cloud/90 text-base leading-relaxed mb-10">
          These Terms of Service (&quot;Terms&quot;) constitute a binding agreement between you (&quot;Customer,&quot; &quot;you,&quot; or &quot;your&quot;) 
          and VantagFleet (&quot;Company,&quot; &quot;we,&quot; or &quot;us&quot;) governing your access to and use of the VantagFleet fleet management 
          and compliance platform, including our websites, applications, and related services (collectively, the &quot;Service&quot;). 
          The Service is designed to assist motor carriers, fleet operators, and drivers with compliance, documentation, 
          safety, and operational data management.
        </p>

        <div className="space-y-8 text-soft-cloud/90">
          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account or by accessing or using the Service, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms and our{' '}
              <Link href="/privacy" className="text-cyber-amber hover:underline">Privacy Policy</Link>. If you are using 
              the Service on behalf of an organization, you represent and warrant that you have the authority to bind that 
              organization to these Terms. If you do not agree to these Terms, you must not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">2. Description of Service</h2>
            <p>
              VantagFleet provides a software-as-a-service platform for fleet management and regulatory compliance, 
              including driver and vehicle tracking, document management, compliance alerts, IFTA reporting tools, and 
              integration with third-party ELD providers (e.g., Motive, Geotab, Samsara). We reserve the right to modify, 
              suspend, or discontinue any part of the Service with reasonable notice where practicable.
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
              Certain parts of the Service are subject to fees as described on our pricing page or in a separate 
              written agreement. Subscription terms include the following:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3 text-soft-cloud/90">
              <li><strong>Free trial.</strong> Eligible plans may include a 7-day free trial. You will not be charged 
              until the trial period ends unless you cancel prior to the end of the trial.</li>
              <li><strong>Billing cycles.</strong> Paid plans (including Fleet Master, Enterprise, and their annual 
              equivalents, as described on our pricing page) are billed in advance on a monthly or annual basis 
              according to your selection.</li>
              <li>We may modify fees with reasonable notice. Failure to pay amounts when due may result in suspension 
              or termination of your access to the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">7. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, 
              WE DISCLAIM ALL WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES 
              OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. WE DO NOT WARRANT THAT THE SERVICE WILL BE 
              UNINTERRUPTED, ERROR-FREE, OR THAT IT WILL MEET YOUR SPECIFIC COMPLIANCE OR OPERATIONAL REQUIREMENTS. 
              YOU USE THE SERVICE AT YOUR SOLE RISK.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">8. Tax and Compliance Disclaimer</h2>
            <p className="mb-3">
              VantagFleet provides automated IFTA calculations and reporting tools based on data retrieved from 
              third-party ELD providers and other sources you provide. VantagFleet is <strong>not</strong> a licensed 
              tax advisor, accountant, or government agency. The Service is a tool to assist with record-keeping and 
              reporting; it does not constitute tax or legal advice.
            </p>
            <p className="mb-3">
              The Customer (and, where applicable, the Carrier) retains <strong>sole responsibility</strong> for the 
              accuracy, completeness, filing, and payment of all IRP and IFTA taxes and related obligations. Under 
              IFTA and IRP rules, the Carrier is the designated &quot;Record Keeper&quot; and is ultimately responsible for the 
              accuracy of its tax filings. VantagFleet shall not be liable for any audits, fines, penalties, or other 
              consequences resulting from data discrepancies, calculation errors, or failure to file or pay taxes in a 
              timely manner.
            </p>
            <p>
              You are advised to review all generated reports and to consult a qualified tax advisor or regulatory 
              compliance professional before submitting any filings to state or provincial authorities.
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
              These Terms constitute the entire agreement between you and VantagFleet regarding the Service. Our failure 
              to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision. 
              If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall 
              remain in full force and effect. We may modify these Terms from time to time; your continued use of the 
              Service after such modifications constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-soft-cloud mt-8 mb-3">14. Contact</h2>
            <p>
              For questions or notices regarding these Terms of Service, please contact us at{' '}
              <a href="mailto:info@vantagfleet.com" className="text-cyber-amber hover:underline">info@vantagfleet.com</a>. 
              Our Privacy Policy is available at <Link href="/privacy" className="text-cyber-amber hover:underline">/privacy</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
