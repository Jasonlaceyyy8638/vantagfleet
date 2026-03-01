'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  searchCustomers,
  getCustomerCharges,
  addNewCustomer,
  type CustomerRow,
  type ChargeRow,
} from '@/app/actions/admin';
import { createRefund, REFUND_REASONS } from '@/app/actions/stripe-refund';
import { Search, Plus, DollarSign, Loader2, RefreshCw } from 'lucide-react';

export function AdminSupportClient() {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [chargesByCustomer, setChargesByCustomer] = useState<Record<string, ChargeRow[]>>({});
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addUsdot, setAddUsdot] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [refundModal, setRefundModal] = useState<{ charge: ChargeRow; stripeCustomerId: string; orgId: string } | null>(null);
  const [refundReason, setRefundReason] = useState<string>(REFUND_REASONS[0].value);
  const [refundAmountCents, setRefundAmountCents] = useState<string>('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const list = await searchCustomers(query);
      setCustomers(list);
      setChargesByCustomer({});
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (customers.length === 0) return;
    const withStripe = customers.filter((c) => c.stripe_customer_id);
    withStripe.forEach((c) => {
      const id = c.stripe_customer_id!;
      if (chargesByCustomer[id]) return;
      getCustomerCharges(id).then((charges) => {
        setChargesByCustomer((prev) => ({ ...prev, [id]: charges }));
      });
    });
  }, [customers]);

  const openRefundModal = (charge: ChargeRow, stripeCustomerId: string, orgId: string) => {
    setRefundModal({ charge, stripeCustomerId, orgId });
    setRefundReason(REFUND_REASONS[0].value);
    setRefundAmountCents('');
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModal) return;
    setRefundSubmitting(true);
    try {
      const amountCents = refundAmountCents.trim()
        ? Math.round(Number(refundAmountCents) * 100)
        : undefined;
      if (refundAmountCents.trim() && (Number.isNaN(Number(refundAmountCents)) || (amountCents ?? 0) < 1)) {
        showToast('error', 'Enter a valid amount.');
        return;
      }
      const result = await createRefund({
        chargeId: refundModal.charge.id,
        reason: refundReason,
        amountCents,
        targetOrgId: refundModal.orgId,
      });
      if ('error' in result) {
        showToast('error', result.error);
        return;
      }
      showToast('success', 'Refund processed successfully.');
      setRefundModal(null);
      const updated = await getCustomerCharges(refundModal.stripeCustomerId);
      setChargesByCustomer((prev) => ({ ...prev, [refundModal.stripeCustomerId]: updated }));
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSubmitting(true);
    try {
      const result = await addNewCustomer(addName, addUsdot || null);
      if ('error' in result) {
        setAddError(result.error);
        return;
      }
      setAddModal(false);
      setAddName('');
      setAddUsdot('');
      doSearch();
    } finally {
      setAddSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-electric-teal/90 text-midnight-ink' : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
      <h1 className="text-2xl font-bold text-soft-cloud">Support — Customer search</h1>
      <p className="text-soft-cloud/70">
        Search customers, add new ones (DB + Stripe), and issue refunds on recent payments.
      </p>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] flex rounded-xl border border-white/10 bg-card overflow-hidden">
          <span className="flex items-center pl-3 text-soft-cloud/50">
            <Search className="size-4" />
          </span>
          <input
            type="search"
            placeholder="Search by company name or USDOT..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            className="flex-1 bg-transparent px-3 py-2.5 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={doSearch}
            disabled={loading}
            className="px-4 py-2.5 bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'Search'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-electric-teal text-midnight-ink font-semibold hover:bg-electric-teal/90"
        >
          <Plus className="size-4" />
          Add New Customer
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
        {customers.length === 0 && !loading && (
          <div className="p-8 text-center text-soft-cloud/60">
            Enter a search term and click Search, or add a new customer.
          </div>
        )}
        {customers.length > 0 && (
          <ul className="divide-y divide-white/10">
            {customers.map((org) => (
              <li key={org.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-soft-cloud">{org.name}</p>
                    {org.usdot_number && (
                      <p className="text-sm text-soft-cloud/60">USDOT {org.usdot_number}</p>
                    )}
                    {org.stripe_customer_id && (
                      <p className="text-xs text-soft-cloud/50 font-mono mt-0.5">
                        {org.stripe_customer_id}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-soft-cloud/50">{org.status}</span>
                </div>
                {org.stripe_customer_id && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-soft-cloud/60 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <DollarSign className="size-3" />
                      Recent payments
                    </p>
                    {!chargesByCustomer[org.stripe_customer_id] ? (
                      <p className="text-sm text-soft-cloud/50">Loading…</p>
                    ) : chargesByCustomer[org.stripe_customer_id].length === 0 ? (
                      <p className="text-sm text-soft-cloud/50">No charges yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {chargesByCustomer[org.stripe_customer_id].map((ch) => (
                          <li
                            key={ch.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm py-1.5 px-2 rounded-lg bg-midnight-ink/80"
                          >
                            <span className="text-soft-cloud/90">
                              {(ch.amount / 100).toFixed(2)} {ch.currency.toUpperCase()}
                              {ch.description && ` — ${ch.description}`}
                            </span>
                            <span className="text-soft-cloud/50 text-xs">
                              {new Date(ch.created * 1000).toLocaleDateString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => openRefundModal(ch, org.stripe_customer_id!, org.id)}
                              disabled={ch.refunded || ch.status !== 'succeeded'}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyber-amber/20 text-cyber-amber text-xs font-medium hover:bg-cyber-amber/30 disabled:opacity-50"
                            >
                              <RefreshCw className="size-3" />
                              Refund
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {addModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !addSubmitting && setAddModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-soft-cloud mb-4">Add New Customer</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label htmlFor="add-name" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  Company name *
                </label>
                <input
                  id="add-name"
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                />
              </div>
              <div>
                <label htmlFor="add-usdot" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  USDOT number (optional)
                </label>
                <input
                  id="add-usdot"
                  type="text"
                  value={addUsdot}
                  onChange={(e) => setAddUsdot(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                />
              </div>
              {addError && (
                <p className="text-sm text-red-400">{addError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  disabled={addSubmitting}
                  className="px-4 py-2 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60"
                >
                  {addSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Create customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {refundModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !refundSubmitting && setRefundModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-soft-cloud mb-4">Confirm refund</h2>
            <p className="text-soft-cloud/80 mb-4">
              Transaction amount:{' '}
              <span className="font-semibold text-cyber-amber">
                {(refundModal.charge.amount / 100).toFixed(2)} {refundModal.charge.currency.toUpperCase()}
              </span>
            </p>
            <form onSubmit={handleConfirmRefund} className="space-y-4">
              <div>
                <label htmlFor="refund-reason" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  Reason for refund *
                </label>
                <select
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                >
                  {REFUND_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="refund-amount" className="block text-sm font-medium text-soft-cloud/80 mb-1">
                  Amount (optional, $)
                </label>
                <input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Leave blank for full refund"
                  value={refundAmountCents}
                  onChange={(e) => setRefundAmountCents(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModal(null)}
                  disabled={refundSubmitting}
                  className="px-4 py-2 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60"
                >
                  {refundSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Process refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
