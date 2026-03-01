import Link from 'next/link';

export default function AdminRefundsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-soft-cloud">Refunds</h1>
      <p className="text-soft-cloud/70">
        Process refunds from the Customer Support page: search for the customer by DOT number or
        email, then use the Refund button on any eligible charge.
      </p>
      <Link
        href="/admin/support"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90"
      >
        Go to Customer Support →
      </Link>
    </div>
  );
}
