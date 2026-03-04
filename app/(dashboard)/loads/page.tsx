import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ProfitabilityCalculator } from './ProfitabilityCalculator';
import { IftaSection } from './IftaSection';
import { AddLoadForm } from './AddLoadForm';
import { getDashboardOrgId } from '@/lib/admin';

function getQuarterRange(): { start: string; end: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3) + 1;
  const startMonth = (q - 1) * 3 + 1;
  const endMonth = q * 3;
  const start = `${year}-${String(startMonth).padStart(2, '0')}-01`;
  const lastDay = new Date(year, endMonth, 0).getDate();
  const end = `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end, label: `Q${q} ${year}` };
}

export default async function LoadsPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-soft-cloud/70">No organization selected.</p>
      </div>
    );
  }

  const { start: qStart, end: qEnd, label: quarterLabel } = getQuarterRange();

  const [
    { data: loads },
    { data: drivers },
    { data: vehicles },
    { data: motiveIntegration },
  ] = await Promise.all([
    supabase
      .from('loads')
      .select('id, revenue_cents, loaded_miles, deadhead_miles, fuel_cost_cents, state_code')
      .eq('org_id', orgId)
      .gte('load_date', qStart)
      .lte('load_date', qEnd),
    supabase.from('drivers').select('id, name').eq('org_id', orgId).order('name'),
    supabase.from('vehicles').select('id, vin, plate').eq('org_id', orgId).order('vin'),
    supabase
      .from('carrier_integrations')
      .select('id')
      .eq('org_id', orgId)
      .eq('provider', 'motive')
      .maybeSingle(),
  ]);

  const loadIds = (loads ?? []).map((l) => l.id);
  let segmentList: { load_id: string; state_code: string; miles_driven: number }[] = [];
  if (loadIds.length > 0) {
    const { data: segData } = await supabase
      .from('load_segments')
      .select('load_id, state_code, miles_driven')
      .in('load_id', loadIds);
    segmentList = (segData ?? []) as { load_id: string; state_code: string; miles_driven: number }[];
  }

  const list = loads ?? [];
  const totalMiles = list.reduce(
    (sum, row) => sum + Number(row.loaded_miles || 0) + Number(row.deadhead_miles || 0),
    0
  );

  const stateMap: Record<string, number> = {};
  const loadsWithSegments = new Set(segmentList.map((s) => s.load_id));
  list.forEach((row) => {
    const loadMiles = Number(row.loaded_miles || 0) + Number(row.deadhead_miles || 0);
    if (loadsWithSegments.has(row.id)) {
      const segsForLoad = segmentList.filter((s) => s.load_id === row.id);
      segsForLoad.forEach((s) => {
        const code = (s.state_code || '').trim().toUpperCase();
        if (code) stateMap[code] = (stateMap[code] || 0) + Number(s.miles_driven || 0);
      });
    } else {
      const state = (row as { state_code?: string }).state_code?.trim?.();
      if (state) stateMap[state] = (stateMap[state] || 0) + loadMiles;
    }
  });
  const milesByState = Object.entries(stateMap)
    .map(([state_code, miles]) => ({ state_code, miles }))
    .sort((a, b) => b.miles - a.miles);

  const hasMotive = !!motiveIntegration;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-soft-cloud mb-2">Loads</h1>
      <p className="text-soft-cloud/70 mb-8">
        Add loads with IFTA mileage breakdown, profitability calculator, and quarterly IFTA summary.
      </p>

      <div className="space-y-8">
        <AddLoadForm
          orgId={orgId}
          hasMotive={hasMotive}
          drivers={drivers ?? []}
          vehicles={vehicles ?? []}
        />

        <ProfitabilityCalculator />

        <IftaSection
          totalMiles={totalMiles}
          milesByState={milesByState}
          quarterLabel={quarterLabel}
        />
      </div>
    </div>
  );
}
