import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ProfitabilityCalculator } from './ProfitabilityCalculator';
import { IftaSection } from './IftaSection';

const ORG_COOKIE = 'vantag-current-org-id';

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

async function getCurrentOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profiles } = await supabase.from('profiles').select('org_id').eq('user_id', user.id);
  const orgIds = Array.from(new Set((profiles ?? []).map((p) => p.org_id)));
  const cookieStore = await cookies();
  const stored = cookieStore.get(ORG_COOKIE)?.value;
  return stored && orgIds.includes(stored) ? stored : orgIds[0] ?? null;
}

export default async function LoadsPage() {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-soft-cloud/70">No organization selected.</p>
      </div>
    );
  }

  const { start: qStart, end: qEnd, label: quarterLabel } = getQuarterRange();

  const { data: loads } = await supabase
    .from('loads')
    .select('id, revenue_cents, loaded_miles, deadhead_miles, fuel_cost_cents, state_code')
    .eq('org_id', orgId)
    .gte('load_date', qStart)
    .lte('load_date', qEnd);

  const list = loads ?? [];
  const totalMiles = list.reduce(
    (sum, row) => sum + Number(row.loaded_miles || 0) + Number(row.deadhead_miles || 0),
    0
  );

  const stateMap: Record<string, number> = {};
  list.forEach((row) => {
    const state = (row as { state_code?: string }).state_code?.trim?.();
    if (!state) return;
    const miles = Number(row.loaded_miles || 0) + Number(row.deadhead_miles || 0);
    stateMap[state] = (stateMap[state] || 0) + miles;
  });
  const milesByState = Object.entries(stateMap)
    .map(([state_code, miles]) => ({ state_code, miles }))
    .sort((a, b) => b.miles - a.miles);

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-soft-cloud mb-2">Loads</h1>
      <p className="text-soft-cloud/70 mb-8">
        Profitability calculator and quarterly IFTA miles summary.
      </p>

      <div className="space-y-8">
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
