'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FleetMapDynamic } from '@/components/FleetMapDynamic';
import type { FleetStopOverlay } from '@/components/FleetMap';
import { DemoMapMock } from '@/components/landing/DemoMapMock';
import { getDemoFleetMapLocations } from '@/src/constants/demoData';
import { createDispatchLoad } from '@/app/actions/dispatch-loads';
import {
  driverDispatchIneligibilityReason,
  isDriverDispatchEligible,
  isVehicleDispatchEligible,
  vehicleDispatchIneligibilityReason,
} from '@/lib/dispatch-eligibility';

type LoadStopRow = {
  id: string;
  sequence_order: number;
  stop_type: string;
  location_name: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
};

type LoadRow = {
  id: string;
  load_date: string;
  status: string;
  reference_number: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
  load_stops: LoadStopRow[];
  driver_name: string | null;
  vehicle_label: string | null;
};

type DriverRow = {
  id: string;
  name: string;
  med_card_expiry: string | null;
  compliance_status: string | null;
  status: string | null;
};

type VehicleRow = {
  id: string;
  unit_number: string | null;
  annual_inspection_due: string | null;
};

type CustomerRow = { id: string; name: string };

const ACTIVE = new Set(['available', 'assigned', 'dispatched', 'in_transit', 'at_pickup', 'delivered']);

export function DispatchCommandCenterClient({
  orgId,
  mapboxToken,
  mapAccess,
  initialLoads,
  drivers,
  vehicles,
  customers,
  demoMode = false,
  brokerMode = false,
}: {
  orgId: string;
  mapboxToken: string;
  mapAccess: boolean;
  initialLoads: LoadRow[];
  drivers: DriverRow[];
  vehicles: VehicleRow[];
  customers: CustomerRow[];
  demoMode?: boolean;
  brokerMode?: boolean;
}) {
  const router = useRouter();
  const [loadRows, setLoadRows] = useState<LoadRow[]>(initialLoads);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [loadDate, setLoadDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [rateToCarrier, setRateToCarrier] = useState('');
  const [driverPay, setDriverPay] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupState, setPickupState] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [notes, setNotes] = useState('');
  const [shipperInfo, setShipperInfo] = useState('');
  const [consigneeInfo, setConsigneeInfo] = useState('');
  const [linehaulCustomer, setLinehaulCustomer] = useState('');
  const [maxBuyCarrier, setMaxBuyCarrier] = useState('');

  useEffect(() => {
    setLoadRows(initialLoads);
  }, [initialLoads]);

  /** Broker demo: pre-fill produce lane when opening Create load. */
  useEffect(() => {
    if (!modalOpen || !demoMode || !brokerMode) return;
    setShipperInfo('Green Valley Produce Co. · dock, Salinas, CA');
    setConsigneeInfo('Metro Fresh Distribution · Bronx, NY');
    setLinehaulCustomer('8400');
    setMaxBuyCarrier('7200');
    setReferenceNumber('Produce Shipment: Salinas, CA to Bronx, NY');
    setPickupCity('Salinas');
    setPickupState('CA');
    setDeliveryCity('Bronx');
    setDeliveryState('NY');
    setNotes('Temperature controlled · reefer required');
  }, [modalOpen, demoMode, brokerMode]);

  const stopOverlays: FleetStopOverlay[] = useMemo(() => {
    const out: FleetStopOverlay[] = [];
    for (const load of loadRows) {
      if (!load.load_stops?.length || !ACTIVE.has(load.status)) continue;
      if (load.status === 'available') continue;
      for (const s of load.load_stops) {
        if (s.latitude == null || s.longitude == null) continue;
        if (s.stop_type !== 'pickup' && s.stop_type !== 'delivery') continue;
        out.push({
          id: `${load.id}-${s.id}`,
          lat: s.latitude,
          lng: s.longitude,
          label: `${s.stop_type === 'pickup' ? 'Pickup' : 'Delivery'} · ${s.city ?? ''}, ${s.state ?? ''}`.trim(),
          stopType: s.stop_type,
        });
      }
    }
    return out;
  }, [loadRows]);

  const marketplaceLoads = useMemo(
    () => loadRows.filter((l) => l.status === 'available'),
    [loadRows]
  );

  const inMotionLoads = useMemo(
    () => loadRows.filter((l) => ACTIVE.has(l.status) && l.status !== 'available'),
    [loadRows]
  );

  const resetForm = () => {
    setLoadDate(new Date().toISOString().slice(0, 10));
    setDriverId('');
    setVehicleId('');
    setCustomerId('');
    setReferenceNumber('');
    setRateToCarrier('');
    setDriverPay('');
    setPickupCity('');
    setPickupState('');
    setDeliveryCity('');
    setDeliveryState('');
    setNotes('');
    setShipperInfo('');
    setConsigneeInfo('');
    setLinehaulCustomer('');
    setMaxBuyCarrier('');
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!pickupCity.trim() || !pickupState.trim() || !deliveryCity.trim() || !deliveryState.trim()) {
      setFormError('Enter pickup and delivery city and state.');
      return;
    }

    if (brokerMode) {
      if (!shipperInfo.trim() || !consigneeInfo.trim()) {
        setFormError('Enter shipper and consignee information.');
        return;
      }
      const linehaul = parseFloat(linehaulCustomer);
      const maxBuy = parseFloat(maxBuyCarrier);
      if (!Number.isFinite(linehaul) || linehaul < 0) {
        setFormError('Enter a valid linehaul (customer) rate.');
        return;
      }
      if (!Number.isFinite(maxBuy) || maxBuy < 0) {
        setFormError('Enter a valid max buy (carrier pay).');
        return;
      }

      setSubmitting(true);

      if (demoMode) {
        await new Promise((r) => setTimeout(r, 450));
        const newId = `demo-broker-load-${Date.now()}`;
        const ref =
          referenceNumber.trim() ||
          `VF-MKT-${Math.floor(10000 + Math.random() * 89999)}`;
        const newLoad: LoadRow = {
          id: newId,
          load_date: loadDate,
          status: 'available',
          reference_number: ref,
          driver_id: null,
          vehicle_id: null,
          load_stops: [
            {
              id: `${newId}-p`,
              sequence_order: 1,
              stop_type: 'pickup',
              location_name: null,
              city: pickupCity.trim(),
              state: pickupState.trim().toUpperCase().slice(0, 2),
              latitude: 36.67,
              longitude: -121.65,
            },
            {
              id: `${newId}-d`,
              sequence_order: 2,
              stop_type: 'delivery',
              location_name: null,
              city: deliveryCity.trim(),
              state: deliveryState.trim().toUpperCase().slice(0, 2),
              latitude: 40.85,
              longitude: -73.87,
            },
          ],
          driver_name: null,
          vehicle_label: null,
        };
        setLoadRows((prev) => [newLoad, ...prev]);
        setSubmitting(false);
        setModalOpen(false);
        resetForm();
        return;
      }

      const result = await createDispatchLoad(orgId, {
        broker_listing: true,
        load_date: loadDate,
        shipper_info: shipperInfo.trim(),
        consignee_info: consigneeInfo.trim(),
        linehaul_customer_usd: linehaul,
        max_buy_carrier_usd: maxBuy,
        customer_id: customerId || null,
        reference_number: referenceNumber.trim() || null,
        notes: notes.trim() || null,
        stops: [
          {
            sequence_order: 1,
            stop_type: 'pickup',
            city: pickupCity.trim(),
            state: pickupState.trim().toUpperCase().slice(0, 2),
          },
          {
            sequence_order: 2,
            stop_type: 'delivery',
            city: deliveryCity.trim(),
            state: deliveryState.trim().toUpperCase().slice(0, 2),
          },
        ],
      });

      setSubmitting(false);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setModalOpen(false);
      resetForm();
      router.refresh();
      return;
    }

    if (!driverId || !vehicleId) {
      setFormError('Select a driver and vehicle.');
      return;
    }
    const d = drivers.find((x) => x.id === driverId);
    const v = vehicles.find((x) => x.id === vehicleId);
    if (!d || !isDriverDispatchEligible(d)) {
      setFormError('Selected driver is not eligible to dispatch.');
      return;
    }
    if (!v || !isVehicleDispatchEligible(v)) {
      setFormError('Selected vehicle is not eligible (maintenance / inspection).');
      return;
    }

    setSubmitting(true);
    const rate = rateToCarrier.trim() ? parseFloat(rateToCarrier) : null;
    const pay = driverPay.trim() ? parseFloat(driverPay) : null;
    if (rate != null && Number.isNaN(rate)) {
      setFormError('Invalid rate to carrier.');
      setSubmitting(false);
      return;
    }
    if (pay != null && Number.isNaN(pay)) {
      setFormError('Invalid driver pay.');
      setSubmitting(false);
      return;
    }

    if (demoMode) {
      await new Promise((r) => setTimeout(r, 450));
      const newId = `demo-load-${Date.now()}`;
      const ref =
        referenceNumber.trim() ||
        `VF-${Math.floor(10000 + Math.random() * 89999)}`;
      const newLoad: LoadRow = {
        id: newId,
        load_date: loadDate,
        status: 'assigned',
        reference_number: ref,
        driver_id: driverId,
        vehicle_id: vehicleId,
        load_stops: [
          {
            id: `${newId}-p`,
            sequence_order: 1,
            stop_type: 'pickup',
            location_name: null,
            city: pickupCity.trim(),
            state: pickupState.trim().toUpperCase().slice(0, 2),
            latitude: 39.78,
            longitude: -86.15,
          },
          {
            id: `${newId}-d`,
            sequence_order: 2,
            stop_type: 'delivery',
            location_name: null,
            city: deliveryCity.trim(),
            state: deliveryState.trim().toUpperCase().slice(0, 2),
            latitude: 32.78,
            longitude: -96.8,
          },
        ],
        driver_name: d?.name ?? null,
        vehicle_label: v?.unit_number ?? null,
      };
      setLoadRows((prev) => [newLoad, ...prev]);
      setSubmitting(false);
      setModalOpen(false);
      resetForm();
      return;
    }

    const result = await createDispatchLoad(orgId, {
      broker_listing: false,
      load_date: loadDate,
      driver_id: driverId,
      vehicle_id: vehicleId,
      customer_id: customerId || null,
      reference_number: referenceNumber.trim() || null,
      rate_to_carrier: rate,
      driver_pay: pay,
      notes: notes.trim() || null,
      stops: [
        {
          sequence_order: 1,
          stop_type: 'pickup',
          city: pickupCity.trim(),
          state: pickupState.trim().toUpperCase().slice(0, 2),
        },
        {
          sequence_order: 2,
          stop_type: 'delivery',
          city: deliveryCity.trim(),
          state: deliveryState.trim().toUpperCase().slice(0, 2),
        },
      ],
    });

    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setModalOpen(false);
    resetForm();
    router.refresh();
  };

  const boardSubtitle = brokerMode
    ? 'Post freight to the marketplace, tender carriers, and track in-motion shipments.'
    : 'Live fleet positions (ELD) with active load stops. Create loads only when drivers and equipment pass safety gates.';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cloud-dancer">Dispatch Board</h1>
          <p className="text-cloud-dancer/70 text-sm mt-1">{boardSubtitle}</p>
        </div>
        <button
          type="button"
          id="tour-create-load"
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="rounded-lg bg-electric-teal/90 hover:bg-electric-teal text-midnight-ink font-semibold px-4 py-2.5 text-sm shrink-0"
        >
          Create load
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-card/40 min-h-[420px] overflow-hidden">
          {demoMode && (!mapAccess || !mapboxToken.trim()) ? (
            <div className="h-[420px] p-3 flex items-center justify-center">
              <DemoMapMock className="w-full max-w-2xl" />
            </div>
          ) : !mapAccess || !mapboxToken ? (
            <div className="h-[420px] flex items-center justify-center p-6 text-center text-soft-cloud/70 text-sm">
              {!mapAccess
                ? 'Live map requires an eligible subscription. Use Live Map from the sidebar when unlocked.'
                : 'Configure NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to show the command center map.'}
            </div>
          ) : (
            <FleetMapDynamic
              sandboxMode={demoMode}
              accessToken={mapboxToken}
              organizationId={demoMode ? undefined : orgId}
              initialLocations={demoMode ? getDemoFleetMapLocations() : undefined}
              stopOverlays={stopOverlays}
              height="420px"
              className="rounded-xl border-0"
            />
          )}
        </div>
        <div className="rounded-xl border border-white/10 bg-card/40 p-4 flex flex-col gap-5 max-h-[520px] overflow-y-auto">
          {brokerMode ? (
            <>
              <div>
                <h2 className="text-sm font-semibold text-cloud-dancer mb-3">Active marketplace</h2>
                <ul className="space-y-3 text-sm">
                  {marketplaceLoads.length === 0 ? (
                    <li className="text-cloud-dancer/60">No loads posted. Create a load to list it here.</li>
                  ) : (
                    marketplaceLoads.map((l) => (
                      <li key={l.id} className="border-b border-white/5 pb-3 last:border-0">
                        <p className="font-medium text-soft-cloud">
                          {l.reference_number || l.id.slice(0, 8)}
                          <span className="text-emerald-400/90 font-normal ml-2">Available</span>
                        </p>
                        <p className="text-cloud-dancer/70 text-xs mt-0.5">
                          {l.load_stops?.[0]?.city}, {l.load_stops?.[0]?.state} → {l.load_stops?.[1]?.city},{' '}
                          {l.load_stops?.[1]?.state}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-cloud-dancer mb-3">In motion</h2>
                <ul className="space-y-3 text-sm">
                  {inMotionLoads.length === 0 ? (
                    <li className="text-cloud-dancer/60">No loads in motion yet.</li>
                  ) : (
                    inMotionLoads.map((l) => (
                      <li key={l.id} className="border-b border-white/5 pb-3 last:border-0">
                        <p className="font-medium text-soft-cloud">
                          {l.reference_number || l.id.slice(0, 8)}
                          <span className="text-cloud-dancer/50 font-normal ml-2 capitalize">
                            {l.status.replace(/_/g, ' ')}
                          </span>
                        </p>
                        <p className="text-cloud-dancer/70 text-xs mt-0.5">
                          {l.driver_name ?? '—'} · {l.vehicle_label ?? '—'}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-cloud-dancer mb-3">Active loads</h2>
              <ul className="space-y-3 text-sm">
                {inMotionLoads.length === 0 ? (
                  <li className="text-cloud-dancer/60">
                    No loads in motion. Create one or move a load out of Available.
                  </li>
                ) : (
                  inMotionLoads.map((l) => (
                    <li key={l.id} className="border-b border-white/5 pb-3 last:border-0">
                      <p className="font-medium text-soft-cloud">
                        {l.reference_number || l.id.slice(0, 8)}
                        <span className="text-cloud-dancer/50 font-normal ml-2 capitalize">
                          {l.status.replace(/_/g, ' ')}
                        </span>
                      </p>
                      <p className="text-cloud-dancer/70 text-xs mt-0.5">
                        {l.driver_name ?? '—'} · {l.vehicle_label ?? '—'}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60" role="dialog" aria-modal>
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-midnight-ink shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-cloud-dancer">
                {brokerMode ? 'Create marketplace load' : 'Create load'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-soft-cloud/70 hover:text-soft-cloud text-sm"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              {formError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div>
                <label className="block text-xs text-cloud-dancer/60 mb-1">Load date</label>
                <input
                  type="date"
                  required
                  value={loadDate}
                  onChange={(e) => setLoadDate(e.target.value)}
                  className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                />
              </div>

              {brokerMode ? (
                <>
                  <div>
                    <label className="block text-xs text-cloud-dancer/60 mb-1">Shipper info</label>
                    <textarea
                      required
                      value={shipperInfo}
                      onChange={(e) => setShipperInfo(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                      placeholder="Company, contact, pickup location"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-cloud-dancer/60 mb-1">Consignee info</label>
                    <textarea
                      required
                      value={consigneeInfo}
                      onChange={(e) => setConsigneeInfo(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                      placeholder="Receiver, delivery location"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-cloud-dancer/60 mb-1">Linehaul rate — customer ($)</label>
                      <input
                        inputMode="decimal"
                        required
                        value={linehaulCustomer}
                        onChange={(e) => setLinehaulCustomer(e.target.value)}
                        className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-cloud-dancer/60 mb-1">Max buy — carrier pay ($)</label>
                      <input
                        inputMode="decimal"
                        required
                        value={maxBuyCarrier}
                        onChange={(e) => setMaxBuyCarrier(e.target.value)}
                        className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-cloud-dancer/60 mb-1">Customer (optional)</label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                    >
                      <option value="">—</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-cloud-dancer/60 mb-1">Reference #</label>
                    <input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                      placeholder="Lane description / PO"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-cloud-dancer/60 mb-1">Driver</label>
                      <select
                        required
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                      >
                        <option value="">Select driver</option>
                        {drivers.map((dr) => {
                          const ok = isDriverDispatchEligible(dr);
                          const reason = driverDispatchIneligibilityReason(dr);
                          return (
                            <option key={dr.id} value={dr.id} disabled={!ok}>
                              {dr.name}
                              {!ok && reason ? ` — Ineligible (${reason})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-cloud-dancer/60 mb-1">Vehicle</label>
                      <select
                        required
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                        className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                      >
                        <option value="">Select vehicle</option>
                        {vehicles.map((v) => {
                          const ok = isVehicleDispatchEligible(v);
                          const reason = vehicleDispatchIneligibilityReason(v);
                          return (
                            <option key={v.id} value={v.id} disabled={!ok}>
                              {v.unit_number || v.id.slice(0, 8)}
                              {!ok && reason ? ` — Ineligible (${reason})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-cloud-dancer/60 mb-1">Customer (optional)</label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                    >
                      <option value="">—</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-cloud-dancer/60 mb-1">Reference #</label>
                    <input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                      placeholder="PO / load ID"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-cloud-dancer/60 mb-1">Rate to carrier ($)</label>
                      <input
                        inputMode="decimal"
                        value={rateToCarrier}
                        onChange={(e) => setRateToCarrier(e.target.value)}
                        className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-cloud-dancer/60 mb-1">Driver pay ($)</label>
                      <input
                        inputMode="decimal"
                        value={driverPay}
                        onChange={(e) => setDriverPay(e.target.value)}
                        className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-cloud-dancer/60 mb-1">Pickup city</label>
                  <input
                    required
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cloud-dancer/60 mb-1">ST</label>
                  <input
                    required
                    value={pickupState}
                    onChange={(e) => setPickupState(e.target.value)}
                    maxLength={2}
                    className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud uppercase"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-cloud-dancer/60 mb-1">Delivery city</label>
                  <input
                    required
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cloud-dancer/60 mb-1">ST</label>
                  <input
                    required
                    value={deliveryState}
                    onChange={(e) => setDeliveryState(e.target.value)}
                    maxLength={2}
                    className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-cloud-dancer/60 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg bg-midnight-ink/80 border border-white/10 px-3 py-2 text-sm text-soft-cloud"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-soft-cloud hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-electric-teal/90 text-midnight-ink hover:bg-electric-teal disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : brokerMode ? 'Post to marketplace' : 'Create & assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
