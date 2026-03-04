'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, FileWarning, RefreshCw } from 'lucide-react';
import { syncOrganizationFromFmcsa } from '@/app/actions/fmcsa';

type Props = {
  orgId: string;
  orgName: string;
  usdotNumber: string | null;
  authorityVerified: boolean;
  legalName: string | null;
  address: string | null;
  safetyRating: string | null;
};

type DotStatus = { active: boolean } | null;

export function CarrierProfile({
  orgId,
  orgName,
  usdotNumber,
  authorityVerified,
  legalName,
  address,
  safetyRating,
}: Props) {
  const router = useRouter();
  const [dotStatus, setDotStatus] = useState<DotStatus>(null);
  const [dotLoading, setDotLoading] = useState(!!usdotNumber?.trim());
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!usdotNumber?.trim()) {
      setDotLoading(false);
      return;
    }
    let cancelled = false;
    setDotLoading(true);
    fetch(`/api/verify-dot?dotNumber=${encodeURIComponent(usdotNumber.trim())}`)
      .then((res) => res.json())
      .then((data: { active?: boolean }) => {
        if (!cancelled && typeof data?.active === 'boolean') setDotStatus({ active: data.active });
        else if (!cancelled) setDotStatus({ active: false });
      })
      .catch(() => {
        if (!cancelled) setDotStatus({ active: false });
      })
      .finally(() => {
        if (!cancelled) setDotLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [usdotNumber]);

  async function handleSyncFromFmcsa() {
    if (!usdotNumber?.trim()) return;
    setSyncError(null);
    setSyncLoading(true);
    try {
      const result = await syncOrganizationFromFmcsa(orgId);
      if (result.ok) {
        router.refresh();
      } else {
        setSyncError(result.error);
      }
    } finally {
      setSyncLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-card p-6 mb-6">
      <h2 className="text-lg font-semibold text-soft-cloud mb-2">Carrier profile</h2>
      <p className="text-sm text-soft-cloud/70 mb-4">
        Your company and FMCSA status. Authority (insurance) verification unlocks full dispatch features.
      </p>

      <div className="space-y-3 text-sm">
        <div>
          <span className="text-soft-cloud/60">Company</span>
          <p className="font-medium text-soft-cloud">{orgName}</p>
        </div>
        {legalName != null && legalName.trim() !== '' && (
          <div>
            <span className="text-soft-cloud/60">Legal name (FMCSA)</span>
            <p className="font-medium text-soft-cloud">{legalName}</p>
          </div>
        )}
        {address && (
          <div>
            <span className="text-soft-cloud/60">Address</span>
            <p className="font-medium text-soft-cloud whitespace-pre-line">{address}</p>
          </div>
        )}
        {usdotNumber && (
          <div className="flex items-center gap-2 flex-wrap">
            <div>
              <span className="text-soft-cloud/60">USDOT number</span>
              <p className="font-medium text-soft-cloud">{usdotNumber}</p>
            </div>
            <button
              type="button"
              onClick={handleSyncFromFmcsa}
              disabled={syncLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-electric-teal/20 text-electric-teal px-3 py-1.5 text-sm font-medium hover:bg-electric-teal/30 disabled:opacity-50"
            >
              {syncLoading ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  Syncing…
                </>
              ) : (
                <>
                  <RefreshCw className="size-3.5" />
                  Sync from FMCSA
                </>
              )}
            </button>
          </div>
        )}
        {syncError && (
          <p className="text-amber-400 text-sm">{syncError}</p>
        )}
        {safetyRating != null && (
          <div>
            <span className="text-soft-cloud/60">Safety rating</span>
            <p className="font-medium text-soft-cloud">{safetyRating}</p>
          </div>
        )}

        <div className="pt-2 flex flex-wrap gap-3">
          {/* DOT Status (Census) */}
          <div className="flex flex-col gap-1">
            <span className="text-soft-cloud/60 text-xs uppercase tracking-wider">DOT status (Census)</span>
            {dotLoading ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-soft-cloud/70">
                Checking…
              </span>
            ) : dotStatus ? (
              dotStatus.active ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-green-500/15 px-2.5 py-1 font-medium text-green-400">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2.5 py-1 font-medium text-amber-400">
                  <AlertCircle className="size-4 shrink-0" />
                  Inactive
                </span>
              )
            ) : usdotNumber ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-soft-cloud/10 px-2.5 py-1 text-soft-cloud/60">
                Unavailable
              </span>
            ) : (
              <span className="text-soft-cloud/50">No DOT on file</span>
            )}
          </div>

          {/* Authority Status */}
          <div className="flex flex-col gap-1">
            <span className="text-soft-cloud/60 text-xs uppercase tracking-wider">Authority status</span>
            {authorityVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-green-500/15 px-2.5 py-1 font-medium text-green-400">
                <CheckCircle2 className="size-4 shrink-0" />
                Verified
              </span>
            ) : (
              <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 max-w-md">
                <p className="font-medium text-amber-400/95 flex items-center gap-1.5">
                  <FileWarning className="size-4 shrink-0" />
                  Verification pending
                </p>
                <p className="text-xs text-soft-cloud/70 mt-1">
                  Please upload proof of current Insurance (BMC-91) to unlock full dispatch features.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
