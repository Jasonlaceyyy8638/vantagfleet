'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  searchCustomers,
  getCustomerCharges,
  getSubscriptionStatus,
  addNewCustomer,
  createOrgInviteLink,
  createManualSubscription,
  type CustomerRow,
  type ChargeRow,
  type SubscriptionStatus,
} from '@/app/actions/admin';
import { createRefund, REFUND_REASONS } from '@/app/actions/stripe-refund';
import { createCustomerPortal } from '@/app/actions/stripe';
import { Search, Plus, DollarSign, Loader2, RefreshCw, Settings, CreditCard, ExternalLink } from 'lucide-react';

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

  const [manageOrg, setManageOrg] = useState<CustomerRow | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [subStatusByOrg, setSubStatusByOrg] = useState<Record<string, SubscriptionStatus>>({});
  const [manualSubModal, setManualSubModal] = useState<{ org: CustomerRow } | null>(null);
  const [manualSubTier, setManualSubTier] = useState<'starter' | 'pro'>('starter');
  const [manualSubmitting, setManualSubmitting] = useState(false);

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
      getSubscriptionStatus(id).then((status) => {
        setSubStatusByOrg((prev) => ({ ...prev, [c.id]: status }));
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
      <h1 className="text-2xl font-bold text-soft-cloud">Customer Support</h1>
      <p className="text-soft-cloud/70">
        List fleets with subscription status. Search by DOT number or email. Manage organizations, issue refunds, or manually add a subscription.
      </p>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] flex rounded-xl border border-white/10 bg-card overflow-hidden">
          <span className="flex items-center pl-3 text-soft-cloud/50">
            <Search className="size-4" />
          </span>
          <input
            type="search"
            placeholder="Search by DOT number or Email..."
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
                  <div className="flex items-center gap-2">
                    {org.stripe_customer_id && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          subStatusByOrg[org.id] === 'active' || subStatusByOrg[org.id] === 'trialing'
                            ? 'bg-electric-teal/20 text-electric-teal'
                            : subStatusByOrg[org.id] === 'past_due'
                              ? 'bg-cyber-amber/20 text-cyber-amber'
                              : 'bg-soft-cloud/10 text-soft-cloud/60'
                        }`}
                      >
                        {subStatusByOrg[org.id] === undefined
                          ? '…'
                          : subStatusByOrg[org.id] === 'none'
                            ? 'No subscription'
                            : `${subStatusByOrg[org.id]} subscription`}
                      </span>
                    )}
                    <span className="text-xs text-soft-cloud/50">{org.status}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setManageOrg(org);
                        setInviteUrl(null);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyber-amber/20 text-cyber-amber text-xs font-medium hover:bg-cyber-amber/30"
                    >
                      <Settings className="size-3" />
                      Manage Organization
                    </button>
                    {org.stripe_customer_id && (
                      <button
                        type="button"
                        onClick={() => setManualSubModal({ org })}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-electric-teal/20 text-electric-teal text-xs font-medium hover:bg-electric-teal/30"
                      >
                        <CreditCard className="size-3" />
                        Add subscription
                      </button>
                    )}
                  </div>
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

      {manageOrg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setManageOrg(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-soft-cloud mb-2">Manage organization</h2>
            <p className="text-sm text-soft-cloud/70 mb-4">{manageOrg.name}</p>
            <div className="space-y-3">
              <div>
                <button
                  type="button"
                  disabled={manageLoading}
                  onClick={async () => {
                    setManageLoading(true);
                    try {
                      const result = await createOrgInviteLink(manageOrg.id);
                      if ('url' in result) setInviteUrl(result.url);
                      else showToast('error', result.error);
                    } finally {
                      setManageLoading(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-amber/20 text-cyber-amber text-sm font-medium hover:bg-cyber-amber/30 disabled:opacity-60"
                >
                  {manageLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Create invite link for drivers
                </button>
                {inviteUrl && (
                  <p className="mt-2 text-xs text-soft-cloud/80 break-all">
                    <a href={inviteUrl} target="_blank" rel="noreferrer" className="text-cyber-amber hover:underline">
                      {inviteUrl}
                    </a>
                  </p>
                )}
              </div>
              {manageOrg.stripe_customer_id && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await createCustomerPortal(manageOrg.stripe_customer_id!);
                    if ('url' in res) window.open(res.url);
                    else showToast('error', res.error);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-soft-cloud/80 text-sm hover:bg-white/5"
                >
                  <ExternalLink className="size-4" />
                  Open billing portal for customer
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setManageOrg(null)}
              className="mt-4 px-4 py-2 rounded-lg border border-white/20 text-soft-cloud text-sm hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {manualSubModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !manualSubmitting && setManualSubModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-soft-cloud mb-2">Create manual subscription</h2>
            <p className="text-sm text-soft-cloud/70 mb-4">{manualSubModal.org.name}</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setManualSubmitting(true);
                try {
                  const result = await createManualSubscription(manualSubModal.org.id, manualSubTier);
                  if ('subscriptionId' in result) {
                    showToast('success', 'Subscription created. Customer may need to add a payment method in the billing portal.');
                    setManualSubModal(null);
                    doSearch();
                  } else {
                    showToast('error', result.error);
                  }
                } finally {
                  setManualSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Tier</label>
                <select
                  value={manualSubTier}
                  onChange={(e) => setManualSubTier(e.target.value as 'starter' | 'pro')}
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud"
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setManualSubModal(null)}
                  disabled={manualSubmitting}
                  className="px-4 py-2 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-60"
                >
                  {manualSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Create subscription
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
