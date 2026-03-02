import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { RegulatoryMigrationClient } from './RegulatoryMigrationClient';

import { getDashboardOrgId } from '@/lib/admin';

/** Mock BASICS-style score (0–100) from inspection count and defects. */
function computeMockBasicScore(
  totalInspections: number,
  inspectionsWithDefects: number
): number {
  let score = 80;
  score += Math.min(totalInspections, 10) * 1.5;
  score -= inspectionsWithDefects * 12;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default async function RegulatoryPage() {
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

  const [
    { data: org },
    { data: inspections },
  ] = await Promise.all([
    supabase.from('organizations').select('usdot_number').eq('id', orgId).single(),
    supabase.from('inspections').select('id, defects').eq('org_id', orgId),
  ]);

  const list = inspections ?? [];
  const withDefects = list.filter((i) => i.defects != null && String(i.defects).trim() !== '');
  const predictedBasicScore = list.length > 0
    ? computeMockBasicScore(list.length, withDefects.length)
    : 85;

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-soft-cloud mb-2">Regulatory migration</h1>
      <p className="text-soft-cloud/70 mb-8">
        MC to DOT migration, Motus sync, and safety score predictor.
      </p>
      <RegulatoryMigrationClient
        usdotNumber={org?.usdot_number ?? null}
        predictedBasicScore={predictedBasicScore}
      />
    </div>
  );
}
