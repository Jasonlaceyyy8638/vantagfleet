import type { Organization } from '@/lib/types';
import type { FleetStats, DriverRankingRow, ComplianceHealth } from '@/app/actions/enterprise-overview';
import type { FleetMapLocation, FleetStopOverlay } from '@/components/FleetMap';

/** Stable demo org id — matches sandbox cookie session (no Supabase). */
export const DEMO_ORG_ID = '00000000-0000-4000-8000-00000000d300';

/**
 * Primary TMS-first demo payload — used across landing, sandbox dashboard, and dispatch.
 * (Third load aligns with `revenue.active_loads`.)
 */
/** Carrier sandbox: asset fleet (drivers, trucks, trailers) — see migrations 001–085 + demo driver/vehicle rows below. */
export const demoCarrierData = {
  orgName: 'Lacey Logistics',
  /** Rounded fleet counts for hero cards (ties to demoVehicleRows / drivers). */
  assets: { trucks: 18, trailers: 22 },
  loads: [
    {
      id: 1,
      origin: 'Dayton, OH',
      destination: 'Atlanta, GA',
      status: 'In Transit',
      rate: 2400,
      driver: 'Jason L.',
    },
    {
      id: 2,
      origin: 'Chicago, IL',
      destination: 'Columbus, OH',
      status: 'At Pickup',
      rate: 1800,
      driver: 'Sarah W.',
    },
    {
      id: 3,
      origin: 'Memphis, TN',
      destination: 'Louisville, KY',
      status: 'In Transit',
      rate: 1950,
      driver: 'Alex R.',
    },
  ],
  drivers: [
    { name: 'Jason L.', status: 'Active', compliance: 'Compliant', hos: '4h remaining' },
    { name: 'Sarah W.', status: 'Active', compliance: 'Compliant', hos: '8h remaining' },
  ],
  revenue: { weekly: 12500, active_loads: 3 },
} as const;

/** Broker sandbox: posted freight awaiting coverage + booked lanes (not garage ops). */
export const demoBrokerData = {
  orgName: 'Vantag Brokerage Group',
  /** Trucks available across vetted carrier network (hero + settlements). */
  availableTrucks: 42,
  /** Demo net margin (customer − carrier pay) for the weekly tile. */
  netMarginWeekly: 18420,
  /** Freight posted to the marketplace / load board — needs carrier. */
  postedFreightLoads: [
    {
      id: 'PF-501',
      origin: 'Phoenix, AZ',
      destination: 'Dallas, TX',
      commodity: 'Automotive',
      customerRate: 4200,
      carrierPay: 3400,
      carrierMc: 'MC-884291',
      status: 'Needs coverage',
    },
    {
      id: 'PF-502',
      origin: 'Columbus, OH',
      destination: 'Charlotte, NC',
      commodity: 'Retail',
      customerRate: 2850,
      carrierPay: 2200,
      carrierMc: 'MC-771002',
      status: 'Needs coverage',
    },
    {
      id: 'PF-503',
      origin: 'Laredo, TX',
      destination: 'Nashville, TN',
      commodity: 'Produce',
      customerRate: 5600,
      carrierPay: 4600,
      carrierMc: null,
      status: 'Bidding',
    },
    {
      id: 'PF-504',
      origin: 'Salt Lake City, UT',
      destination: 'Portland, OR',
      commodity: 'Building materials',
      customerRate: 3100,
      carrierPay: 2550,
      carrierMc: 'MC-990441',
      status: 'Needs coverage',
    },
  ],
  /** In-motion broker loads (dispatch / map). */
  activeLoads: [
    {
      id: 101,
      origin: 'Laredo, TX',
      destination: 'Nashville, TN',
      carrier: 'Swiftway Transport',
      status: 'Dispatched',
    },
    {
      id: 102,
      origin: 'Denver, CO',
      destination: 'Kansas City, MO',
      carrier: 'Northern Star LLC',
      status: 'In transit',
    },
  ],
  complianceVetting: 'All carriers 100% verified via Vantag Engine',
} as const;

export const demoOrganization: Organization = {
  id: DEMO_ORG_ID,
  name: demoCarrierData.orgName,
  usdot_number: '2847193',
  status: 'active',
  created_at: '2025-01-15T12:00:00.000Z',
  updated_at: '2026-04-01T08:00:00.000Z',
};

/** Stable id for broker sandbox org (no Supabase row). */
export const DEMO_BROKER_ORG_ID = '00000000-0000-4000-8000-00000000d301';

export const demoBrokerOrganization: Organization = {
  id: DEMO_BROKER_ORG_ID,
  name: demoBrokerData.orgName,
  usdot_number: '4128830',
  status: 'active',
  created_at: '2025-03-01T12:00:00.000Z',
  updated_at: '2026-04-01T08:00:00.000Z',
};

/** Mock signed-in user id for client code that expects a profile reference in demo. */
export const DEMO_MOCK_USER_ID = '00000000-0000-4000-8000-00000000d100';

export const DEMO_MOCK_PROFILE_ID = '00000000-0000-4000-8000-00000000d101';

/** Lightweight driver rows for marketing / hero cards. */
export type DemoDriver = {
  id: string;
  name: string;
  med_card_expiry: string;
  compliance_status: 'compliant' | 'warning' | 'expired';
  license_state: string;
};

export const demoDrivers: DemoDriver[] = [
  {
    id: 'demo-d-1',
    name: 'Jason Lacey',
    med_card_expiry: '2027-06-15',
    compliance_status: 'compliant',
    license_state: 'OH',
  },
  {
    id: 'demo-d-2',
    name: 'Sarah Williams',
    med_card_expiry: '2026-11-01',
    compliance_status: 'compliant',
    license_state: 'IL',
  },
];

export type DemoLoadStop = {
  sequence: number;
  type: 'pickup' | 'delivery';
  location_name: string;
  city: string;
  state: string;
};

export type DemoLoad = {
  id: string;
  reference_number: string;
  status: string;
  driver_name: string;
  stops: DemoLoadStop[];
};

function parseCityState(part: string): { city: string; state: string } {
  const m = part.trim().match(/^(.+),\s*([A-Z]{2})$/i);
  if (!m) return { city: part, state: '' };
  return { city: m[1].trim(), state: m[2].toUpperCase() };
}

/** Landing / hero — derived from `demoCarrierData`. */
export const demoLoads: DemoLoad[] = demoCarrierData.loads.map((l) => {
  const o = parseCityState(l.origin);
  const d = parseCityState(l.destination);
  return {
    id: `demo-load-${l.id}`,
    reference_number: `LL-${2400 + l.id}`,
    status: l.status,
    driver_name: l.driver,
    stops: [
      {
        sequence: 1,
        type: 'pickup' as const,
        location_name: `${o.city} dock`,
        city: o.city,
        state: o.state,
      },
      {
        sequence: 2,
        type: 'delivery' as const,
        location_name: `${d.city} DC`,
        city: d.city,
        state: d.state,
      },
    ],
  };
});

export function demoLoadLaneLabel(load: DemoLoad): string {
  const first = load.stops[0];
  const last = load.stops[load.stops.length - 1];
  return `${first.city} → ${last.city}`;
}

/** Dispatch board / DB-shaped rows (snake_case statuses). */
export type DemoDispatchLoadStop = {
  id: string;
  sequence_order: number;
  stop_type: string;
  location_name: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type DemoDispatchLoadRow = {
  id: string;
  load_date: string;
  status: string;
  reference_number: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
  load_stops: DemoDispatchLoadStop[];
  driver_name: string | null;
  vehicle_label: string | null;
};

export type DemoDispatchDriverRow = {
  id: string;
  name: string;
  med_card_expiry: string | null;
  compliance_status: string | null;
  status: string | null;
};

export type DemoDispatchVehicleRow = {
  id: string;
  unit_number: string | null;
  annual_inspection_due: string | null;
};

export type DemoCustomerRow = { id: string; name: string };

export type DemoCarrierSandboxDetails = {
  organization: Organization;
  drivers: DemoDispatchDriverRow[];
  vehicles: DemoDispatchVehicleRow[];
  customers: DemoCustomerRow[];
  loads: Omit<DemoDispatchLoadRow, 'driver_name' | 'vehicle_label'>[];
};

const demoDriverRows: DemoDispatchDriverRow[] = [
  {
    id: 'demo-d-1',
    name: 'Jason Lacey',
    med_card_expiry: '2027-06-15',
    compliance_status: null,
    status: 'active',
  },
  {
    id: 'demo-d-2',
    name: 'Sarah Williams',
    med_card_expiry: '2026-11-01',
    compliance_status: null,
    status: 'active',
  },
  {
    id: 'demo-d-3',
    name: 'Alex Rivera',
    med_card_expiry: '2027-08-01',
    compliance_status: null,
    status: 'active',
  },
];

const demoVehicleRows: DemoDispatchVehicleRow[] = [
  { id: 'demo-v-1', unit_number: '101', annual_inspection_due: '2027-01-10' },
  { id: 'demo-v-2', unit_number: '102', annual_inspection_due: '2027-03-22' },
  { id: 'demo-v-3', unit_number: '103', annual_inspection_due: '2026-12-01' },
];

const demoCustomerRows: DemoCustomerRow[] = [
  { id: 'demo-cust-1', name: 'Lacey Logistics Customers' },
];

function statusToSnake(s: string): string {
  const t = s.toLowerCase();
  if (t.includes('transit')) return 'in_transit';
  if (t.includes('pickup')) return 'at_pickup';
  return 'in_transit';
}

/** Approximate lat/lng for map overlays. */
const CITY_COORD: Record<string, [number, number]> = {
  dayton: [39.7589, -84.1916],
  atlanta: [33.749, -84.388],
  chicago: [41.8781, -87.6298],
  columbus: [39.9612, -82.9988],
  memphis: [35.1495, -90.049],
  louisville: [38.2527, -85.7585],
};

function coordFor(city: string): [number, number] {
  const key = city.toLowerCase().replace(/\s+/g, '');
  for (const [k, v] of Object.entries(CITY_COORD)) {
    if (key.includes(k) || k.includes(key.slice(0, 4))) return v;
  }
  return [39.8, -86.16];
}

function buildDispatchLoadsRaw(): Array<Omit<DemoDispatchLoadRow, 'driver_name' | 'vehicle_label'>> {
  return demoCarrierData.loads.map((l, idx) => {
    const o = parseCityState(l.origin);
    const d = parseCityState(l.destination);
    const [latO, lngO] = coordFor(o.city);
    const [latD, lngD] = coordFor(d.city);
    const driverId = l.driver.startsWith('Jason')
      ? 'demo-d-1'
      : l.driver.startsWith('Sarah')
        ? 'demo-d-2'
        : l.driver.startsWith('Alex')
          ? 'demo-d-3'
          : 'demo-d-1';
    const vehicleId = `demo-v-${idx + 1}`;
    const lid = `demo-load-${l.id}`;
    return {
      id: lid,
      load_date: '2026-04-12',
      status: statusToSnake(l.status),
      reference_number: `LL-${2400 + l.id}`,
      driver_id: driverId,
      vehicle_id: vehicleId,
      load_stops: [
        {
          id: `${lid}-p`,
          sequence_order: 1,
          stop_type: 'pickup',
          location_name: `${o.city} — pickup`,
          city: o.city,
          state: o.state,
          latitude: latO,
          longitude: lngO,
        },
        {
          id: `${lid}-d`,
          sequence_order: 2,
          stop_type: 'delivery',
          location_name: `${d.city} — delivery`,
          city: d.city,
          state: d.state,
          latitude: latD,
          longitude: lngD,
        },
      ],
    };
  });
}

const demoCarrierLoadsRaw = buildDispatchLoadsRaw();

function attachDriverVehicleNames(
  loads: typeof demoCarrierLoadsRaw,
  drivers: DemoDispatchDriverRow[],
  vehicles: DemoDispatchVehicleRow[]
): DemoDispatchLoadRow[] {
  const dMap = new Map(drivers.map((d) => [d.id, d.name]));
  const vMap = new Map(vehicles.map((v) => [v.id, v.unit_number]));
  return loads.map((l) => ({
    ...l,
    driver_name: l.driver_id ? dMap.get(l.driver_id) ?? null : null,
    vehicle_label: l.vehicle_id ? vMap.get(l.vehicle_id) ?? null : null,
  }));
}

/** Extended carrier snapshot for server-driven pages that still expect `DemoCarrierSandboxDetails`. */
export const demoCarrierSandboxDetails: DemoCarrierSandboxDetails = {
  organization: demoOrganization,
  drivers: demoDriverRows,
  vehicles: demoVehicleRows,
  customers: demoCustomerRows,
  loads: demoCarrierLoadsRaw,
};

function buildBrokerDispatchLoadsRaw(): Array<Omit<DemoDispatchLoadRow, 'driver_name' | 'vehicle_label'>> {
  return demoBrokerData.activeLoads.map((l, idx) => {
    const o = parseCityState(l.origin);
    const d = parseCityState(l.destination);
    const [latO, lngO] = coordFor(o.city);
    const [latD, lngD] = coordFor(d.city);
    const lid = `demo-broker-load-${l.id}`;
    return {
      id: lid,
      load_date: '2026-04-12',
      status: 'in_transit',
      reference_number: `VBG-${3100 + idx}`,
      driver_id: null,
      vehicle_id: null,
      load_stops: [
        {
          id: `${lid}-p`,
          sequence_order: 1,
          stop_type: 'pickup',
          location_name: `${o.city} — shipper`,
          city: o.city,
          state: o.state,
          latitude: latO,
          longitude: lngO,
        },
        {
          id: `${lid}-d`,
          sequence_order: 2,
          stop_type: 'delivery',
          location_name: `${d.city} — consignee`,
          city: d.city,
          state: d.state,
          latitude: latD,
          longitude: lngD,
        },
      ],
    };
  });
}

const demoBrokerLoadsRaw = buildBrokerDispatchLoadsRaw();

export type DemoSettlementRow = {
  id: string;
  batch: string;
  carrierOrDriver: string;
  amount: number;
  status: 'paid' | 'pending';
  paidAt: string | null;
};

export const demoCarrierSettlements: DemoSettlementRow[] = [
  { id: 'demo-set-1', batch: 'SB-2026-04-A', carrierOrDriver: 'Jason Lacey', amount: 4820, status: 'paid', paidAt: '2026-04-01' },
  { id: 'demo-set-2', batch: 'SB-2026-04-A', carrierOrDriver: 'Sarah Williams', amount: 3650, status: 'paid', paidAt: '2026-04-01' },
  { id: 'demo-set-3', batch: 'SB-2026-04-B', carrierOrDriver: 'Alex Rivera', amount: 2100, status: 'pending', paidAt: null },
];

export const demoBrokerSettlements: DemoSettlementRow[] = [
  { id: 'demo-bset-1', batch: 'BB-2026-14', carrierOrDriver: 'Swiftway Transport', amount: 12400, status: 'paid', paidAt: '2026-04-02' },
  { id: 'demo-bset-2', batch: 'BB-2026-14', carrierOrDriver: 'Northern Star LLC', amount: 8900, status: 'pending', paidAt: null },
];

export type DemoSafetyReportRow = {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  openedAt: string;
  status: 'open' | 'closed';
};

export const demoSafetyReports: DemoSafetyReportRow[] = [
  { id: 'demo-sr-1', title: 'HOS audit — 0 violations (sample)', severity: 'info', openedAt: '2026-03-28', status: 'closed' },
  { id: 'demo-sr-2', title: 'Vehicle 102 — inspection due in 45 days', severity: 'warning', openedAt: '2026-04-01', status: 'open' },
  { id: 'demo-sr-3', title: 'Clearinghouse — annual query on file', severity: 'info', openedAt: '2026-01-10', status: 'closed' },
];

export type DemoIftaReceiptRow = {
  id: string;
  receipt_date: string | null;
  state: string | null;
  gallons: number | null;
  status: string;
  file_url: string | null;
};

export const demoIftaReceipts: DemoIftaReceiptRow[] = [
  {
    id: 'demo-ifta-1',
    receipt_date: '2026-04-02',
    state: 'OH',
    gallons: 142.5,
    status: 'approved',
    file_url: '/image_1044c3.png',
  },
  {
    id: 'demo-ifta-2',
    receipt_date: '2026-04-05',
    state: 'TN',
    gallons: 88.0,
    status: 'pending',
    file_url: '/image_1044c3.png',
  },
  {
    id: 'demo-ifta-3',
    receipt_date: '2026-04-08',
    state: 'GA',
    gallons: 210.25,
    status: 'approved',
    file_url: '/image_1044c3.png',
  },
];

export type DemoRateConfirmationRow = {
  id: string;
  loadRef: string;
  lane: string;
  rate: number;
  carrier: string;
  signedAt: string;
};

export const demoRateConfirmations: DemoRateConfirmationRow[] = [
  { id: 'demo-rc-1', loadRef: 'LL-2401', lane: 'Dayton → Atlanta', rate: 2400, carrier: 'Lacey Logistics', signedAt: '2026-04-10' },
  { id: 'demo-rc-2', loadRef: 'LL-2402', lane: 'Chicago → Columbus', rate: 1800, carrier: 'Lacey Logistics', signedAt: '2026-04-10' },
];

export type DemoCustomerRowExtended = DemoCustomerRow & {
  legal_name?: string | null;
  mc_number?: string | null;
  dot_number?: string | null;
  credit_terms?: string | null;
};

export const demoCustomers: DemoCustomerRowExtended[] = [
  {
    id: 'demo-cust-1',
    name: 'Summit Retail DC',
    legal_name: 'Summit Retail Holdings LLC',
    mc_number: '884921',
    dot_number: '2410192',
    credit_terms: 'Net 30',
  },
  {
    id: 'demo-cust-2',
    name: 'Heartland Foods',
    legal_name: 'Heartland Foods Co.',
    mc_number: '991102',
    dot_number: '3398841',
    credit_terms: 'Quick pay',
  },
];

export function getEnterpriseDemoOverview(): {
  fleetStats: FleetStats;
  driverRanking: DriverRankingRow[];
  complianceHealth: ComplianceHealth;
} {
  const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  return {
    fleetStats: {
      revenueCents: 1_842_000,
      fuelCents: 412_000,
      revenueFormatted: '$18,420.00',
      fuelFormatted: '$4,120.00',
      monthLabel,
    },
    driverRanking: [
      {
        driverId: 'demo-d-1',
        driverName: 'Jason Lacey',
        totalRevenueCents: 620_000,
        totalFuelCents: 140_000,
        totalMiles: 4200,
        profitPerMile: 1.14,
        loadCount: 6,
      },
      {
        driverId: 'demo-d-2',
        driverName: 'Sarah Williams',
        totalRevenueCents: 510_000,
        totalFuelCents: 118_000,
        totalMiles: 3800,
        profitPerMile: 1.03,
        loadCount: 5,
      },
      {
        driverId: 'demo-d-3',
        driverName: 'Alex Rivera',
        totalRevenueCents: 480_000,
        totalFuelCents: 112_000,
        totalMiles: 3600,
        profitPerMile: 1.02,
        loadCount: 5,
      },
    ],
    complianceHealth: 'green',
  };
}

export function getDemoFleetMapLocations(): FleetMapLocation[] {
  return [
    {
      id: 'demo-map-1',
      lat: 39.7589,
      lng: -84.1916,
      vehicleName: 'Unit 101',
      driverName: 'Jason Lacey',
      speed: 62,
      status: 'Moving',
      eta: '14:20',
      orgId: DEMO_ORG_ID,
      orgName: demoCarrierData.orgName,
    },
    {
      id: 'demo-map-2',
      lat: 41.8781,
      lng: -87.6298,
      vehicleName: 'Unit 102',
      driverName: 'Sarah Williams',
      speed: 0,
      status: 'Stationary',
      eta: null,
      orgId: DEMO_ORG_ID,
      orgName: demoCarrierData.orgName,
    },
    {
      id: 'demo-map-3',
      lat: 35.1495,
      lng: -90.049,
      vehicleName: 'Unit 103',
      driverName: 'Alex Rivera',
      speed: 58,
      status: 'Moving',
      eta: '16:05',
      orgId: DEMO_ORG_ID,
      orgName: demoCarrierData.orgName,
    },
  ];
}

export function getDemoFleetStopOverlays(): FleetStopOverlay[] {
  const loads = attachDriverVehicleNames(demoCarrierLoadsRaw, demoDriverRows, demoVehicleRows);
  const out: FleetStopOverlay[] = [];
  for (const load of loads) {
    for (const s of load.load_stops) {
      if (s.latitude == null || s.longitude == null) continue;
      out.push({
        id: `${load.id}-${s.sequence_order}`,
        lat: s.latitude,
        lng: s.longitude,
        label: s.location_name ?? `${s.city ?? ''}, ${s.state ?? ''}`,
        stopType: s.stop_type === 'pickup' ? 'pickup' : 'delivery',
      });
    }
  }
  return out;
}

export type DemoPageKey =
  | 'dashboard'
  | 'dispatch'
  | 'loads'
  | 'drivers'
  | 'vehicles'
  | 'customers'
  | 'settlements'
  | 'compliance'
  | 'ifta'
  | 'documents'
  | 'map'
  | 'enterprise';

/** Central registry for client `useVantagQuery` and server-side demo branches. */
export function resolveDemoPage(role: 'carrier' | 'broker', page: DemoPageKey): unknown {
  const carrier: Partial<Record<DemoPageKey, unknown>> = {
    dashboard: demoCarrierData,
    dispatch: getDispatchDemoSnapshot('carrier'),
    loads: { quarterLabel: 'Q2 2026', totalMiles: 12840, milesByState: [{ state_code: 'OH', miles: 4200 }, { state_code: 'TN', miles: 3100 }] },
    drivers: {
      drivers: demoDrivers.map((d) => ({
        id: d.id,
        name: d.name,
        license_number: 'DL-****' + d.id.slice(-2),
        license_state: d.license_state,
        med_card_expiry: d.med_card_expiry,
        clearinghouse_status: 'cleared',
      })),
      complianceDocs: [
        { id: 'demo-cd-1', driver_id: 'demo-d-1', doc_type: 'med_card', file_path: '/demo/med1.pdf', expiry_date: '2027-06-15' },
        { id: 'demo-cd-2', driver_id: 'demo-d-2', doc_type: 'med_card', file_path: '/demo/med2.pdf', expiry_date: '2026-11-01' },
      ],
    },
    vehicles: {
      drivers: demoDriverRows.map((d) => ({ id: d.id, name: d.name, assigned_vehicle_id: `demo-v-${d.id.slice(-1)}`, status: 'active' })),
      vehicles: demoVehicleRows.map((v) => ({ id: v.id, vin: `1HGBH41JXMN80${v.unit_number}`, plate: `OH-${v.unit_number}X`, year: 2022, status: 'active' })),
    },
    customers: demoCustomers,
    settlements: demoCarrierSettlements,
    compliance: { safetyReports: demoSafetyReports, drivers: demoCarrierData.drivers },
    ifta: demoIftaReceipts,
    documents: { drivers: demoDrivers.map((d) => ({ id: d.id, name: d.name })), docs: demoRateConfirmations.map((rc) => ({ id: rc.id, driver_id: 'demo-d-1', document_type: 'Rate Confirmation', file_url: rc.loadRef, expiry_date: rc.signedAt })) },
    map: { locations: getDemoFleetMapLocations(), stops: getDemoFleetStopOverlays() },
    enterprise: getEnterpriseDemoOverview(),
  };
  const broker: Partial<Record<DemoPageKey, unknown>> = {
    dashboard: demoBrokerData,
    dispatch: getDispatchDemoSnapshot('broker'),
    loads: { quarterLabel: 'Q2 2026', totalMiles: 8400, milesByState: [{ state_code: 'TX', miles: 5100 }, { state_code: 'TN', miles: 2200 }] },
    drivers: {
      drivers: demoDrivers.slice(0, 2).map((d) => ({
        id: d.id,
        name: d.name + ' (vetted)',
        license_number: null,
        license_state: d.license_state,
        med_card_expiry: d.med_card_expiry,
        clearinghouse_status: 'cleared',
      })),
      complianceDocs: [],
    },
    vehicles: carrier.vehicles,
    customers: [{ id: 'demo-bcust-1', name: 'Shipper — Laredo lane', legal_name: null, mc_number: '771122', dot_number: '9910012', credit_terms: 'Net 21' }],
    settlements: demoBrokerSettlements,
    compliance: { safetyReports: demoSafetyReports.slice(0, 2), drivers: demoBrokerData.activeLoads.map((l) => ({ name: l.carrier, status: 'Booked', compliance: 'Verified', hos: '—' })) },
    ifta: demoIftaReceipts.slice(0, 2),
    documents: { drivers: [{ id: 'demo-d-1', name: 'Carrier packet' }], docs: demoRateConfirmations.map((rc) => ({ id: rc.id, driver_id: 'demo-d-1', document_type: 'Rate Confirmation', file_url: rc.lane, expiry_date: rc.signedAt })) },
    map: carrier.map,
    enterprise: getEnterpriseDemoOverview(),
  };
  const table = role === 'broker' ? broker : carrier;
  return table[page] ?? (role === 'broker' ? demoBrokerData : demoCarrierData);
}

export function getDispatchDemoSnapshot(role: 'carrier' | 'broker' = 'carrier'): {
  orgId: string;
  initialLoads: DemoDispatchLoadRow[];
  drivers: DemoDispatchDriverRow[];
  vehicles: DemoDispatchVehicleRow[];
  customers: DemoCustomerRow[];
} {
  if (role === 'broker') {
    const initialLoads = attachDriverVehicleNames(demoBrokerLoadsRaw, demoDriverRows, demoVehicleRows);
    return {
      orgId: DEMO_BROKER_ORG_ID,
      initialLoads,
      drivers: demoDriverRows,
      vehicles: demoVehicleRows,
      customers: [{ id: 'demo-bcust-1', name: 'Broker shipper network' }],
    };
  }
  const initialLoads = attachDriverVehicleNames(demoCarrierLoadsRaw, demoDriverRows, demoVehicleRows);
  return {
    orgId: DEMO_ORG_ID,
    initialLoads,
    drivers: demoDriverRows,
    vehicles: demoVehicleRows,
    customers: demoCustomerRows,
  };
}

export type MockMapRoute = {
  id: string;
  loadId: string;
  pathD: string;
  stroke: string;
  durationSec: number;
};

export const mockMapRoutes: MockMapRoute[] = [
  {
    id: 'route-1',
    loadId: 'demo-load-1',
    pathD: 'M 48 95 L 210 88 L 352 118',
    stroke: 'rgba(52, 211, 153, 0.65)',
    durationSec: 14,
  },
  {
    id: 'route-2',
    loadId: 'demo-load-2',
    pathD: 'M 268 168 Q 220 120 195 95 Q 175 78 158 62',
    stroke: 'rgba(96, 165, 250, 0.65)',
    durationSec: 17,
  },
  {
    id: 'route-3',
    loadId: 'demo-load-3',
    pathD: 'M 88 195 L 165 140 L 248 105 L 318 92',
    stroke: 'rgba(251, 191, 36, 0.65)',
    durationSec: 12,
  },
];

/** Accounting / settlements / IFTA / analytics — for sandbox dashboards and marketing. */
export const demoAccountingData = {
  settlements: [
    { id: 'SET-9901', date: '2026-04-10', driver: 'Jason Lacey', load_count: 5, gross: 8500.0, fuel_deduction: 1200.0, net_pay: 7300.0, status: 'Paid' },
    { id: 'SET-9902', date: '2026-04-12', driver: 'Sarah Williams', load_count: 3, gross: 4200.0, fuel_deduction: 450.0, net_pay: 3750.0, status: 'Pending' },
  ],
  ifta: [
    { id: 'REC-001', date: '2026-04-01', state: 'OH', gallons: 150.5, fuel_type: 'Diesel', amount: 585.2, vendor: 'Pilot Flying J' },
    { id: 'REC-002', date: '2026-04-03', state: 'IN', gallons: 110.2, fuel_type: 'Diesel', amount: 432.1, vendor: "Love's Travel Stop" },
    { id: 'REC-003', date: '2026-04-05', state: 'IL', gallons: 205.0, fuel_type: 'Diesel', amount: 810.0, vendor: 'TA Express' },
  ],
  analytics: {
    revenuePerMile: 2.85,
    emptyMilePercentage: 8.2,
    totalProfitYTD: 142500.0,
  },
} as const;

/** Shape expected by `IFTADashboardClient` receipt table + demo receipt viewer. */
export type DemoAccountingIftaReceiptRow = {
  id: string;
  receipt_date: string | null;
  state: string | null;
  gallons: number | null;
  status: string;
  file_url: string | null;
  vendor?: string;
  fuel_type?: string;
  amount?: number;
};

export function getDemoAccountingIftaReceiptRows(): DemoAccountingIftaReceiptRow[] {
  return demoAccountingData.ifta.map((r) => ({
    id: r.id,
    receipt_date: r.date,
    state: r.state,
    gallons: r.gallons,
    status: 'verified',
    file_url: '/image_1044c3.png',
    vendor: r.vendor,
    fuel_type: r.fuel_type,
    amount: r.amount,
  }));
}
