'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, FileText, Fuel, ExternalLink, RefreshCw, Truck } from 'lucide-react';

const FleetMapDynamic = dynamic(
  () => import('@/components/FleetMapDynamic').then((m) => ({ default: m.FleetMapDynamic })),
  { ssr: false }
);

export type RoadsideIncidentRow = {
  id: string;
  incident_type: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  driver_profile_image_url?: string | null;
  driver_truck_number?: string | null;
};

export type PendingIftaRow = {
  id: string;
  receipt_date: string | null;
  state: string | null;
  gallons: number | null;
  status: string;
};

type Props = {
  orgId: string;
  initialIncidents: RoadsideIncidentRow[];
  pendingIfta: PendingIftaRow[];
  mapboxToken: string;
};

export function DispatcherDashboardClient({
  orgId,
  initialIncidents,
  pendingIfta,
  mapboxToken,
}: Props) {
  const [incidents, setIncidents] = useState<RoadsideIncidentRow[]>(initialIncidents);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/dispatcher/roadside-incidents');
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.reports)) setIncidents(data.reports);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const t = setInterval(fetchIncidents, 30000);
    return () => clearInterval(t);
  }, []);

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return s;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-soft-cloud">Dispatcher Dashboard</h1>
        <button
          type="button"
          onClick={fetchIncidents}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-amber/20 text-cyber-amber font-medium text-sm hover:bg-cyber-amber/30 disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh incidents
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live feed: Roadside Incidents */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-card overflow-hidden">
          <h2 className="px-4 py-3 border-b border-white/10 text-lg font-semibold text-soft-cloud flex items-center gap-2">
            <FileText className="size-5 text-cyber-amber" />
            Roadside incidents (live)
          </h2>
          <div className="max-h-[400px] overflow-y-auto">
            {incidents.length === 0 ? (
              <p className="p-6 text-soft-cloud/60 text-sm">No incidents reported yet.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {incidents.map((r) => (
                  <li key={r.id} className="px-4 py-3 hover:bg-white/5 flex items-start gap-3">
                    {(r.driver_profile_image_url || r.driver_truck_number) && (
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        {r.driver_profile_image_url ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-midnight-ink">
                            <Image
                              src={r.driver_profile_image_url}
                              alt="Driver"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Truck className="size-5 text-soft-cloud/50" />
                          </div>
                        )}
                        {r.driver_truck_number && (
                          <span className="text-[10px] text-cyber-amber font-medium">#{r.driver_truck_number}</span>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-soft-cloud">{r.incident_type}</p>
                        <p className="text-xs text-soft-cloud/60 mt-0.5">{formatDate(r.created_at)}</p>
                        {r.notes && <p className="text-sm text-soft-cloud/80 mt-1">{r.notes}</p>}
                      </div>
                      {r.latitude != null && r.longitude != null && (
                        <a
                          href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyber-amber hover:underline text-xs flex items-center gap-1"
                        >
                          <MapPin className="size-3" />
                          View location
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Pending IFTA */}
        <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
          <h2 className="px-4 py-3 border-b border-white/10 text-lg font-semibold text-soft-cloud flex items-center gap-2">
            <Fuel className="size-5 text-cyber-amber" />
            Pending IFTA
          </h2>
          <div className="max-h-[400px] overflow-y-auto">
            {pendingIfta.length === 0 ? (
              <p className="p-6 text-soft-cloud/60 text-sm">No pending receipts.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {pendingIfta.map((r) => (
                  <li key={r.id} className="px-4 py-3 text-sm text-soft-cloud/90">
                    <span className="text-soft-cloud/70">{r.receipt_date ?? '—'}</span>
                    {r.state && ` · ${r.state}`}
                    {r.gallons != null && ` · ${r.gallons} gal`}
                  </li>
                ))}
              </ul>
            )}
            <div className="p-3 border-t border-white/10">
              <Link
                href="/dashboard/ifta"
                className="text-cyber-amber hover:underline text-sm font-medium flex items-center gap-1"
              >
                <ExternalLink className="size-4" />
                Open IFTA dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mini-Map: fleet map + link to full map */}
      <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <h2 className="px-4 py-3 border-b border-white/10 text-lg font-semibold text-soft-cloud flex items-center gap-2">
          <MapPin className="size-5 text-cyber-amber" />
          Fleet map
        </h2>
        <div className="relative min-h-[280px]">
          {mapboxToken ? (
            <>
              <div className="h-[280px] w-full">
                <FleetMapDynamic
                  accessToken={mapboxToken}
                  organizationId={orgId}
                  height="280px"
                  className="rounded-b-xl w-full h-full"
                />
              </div>
              <Link
                href="/dashboard/map"
                className="absolute bottom-3 right-3 px-3 py-2 rounded-lg bg-midnight-ink/90 border border-white/10 text-cyber-amber text-sm font-medium hover:bg-cyber-amber/20 transition-colors"
              >
                Open full Live Map →
              </Link>
            </>
          ) : (
            <div className="p-4 min-h-[280px] flex flex-col items-center justify-center">
              <p className="text-soft-cloud/60 text-sm">Map not configured. Open Live Map from the sidebar.</p>
              <Link href="/dashboard/map" className="mt-3 text-cyber-amber hover:underline text-sm font-medium">
                Go to Live Map →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
