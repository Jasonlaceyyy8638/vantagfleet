import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';

export type BreakdownIncident = {
  id: string;
  org_id: string;
  vehicle_id: string | null;
  vehicle_label: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string;
  status: 'Pending' | 'Repairing' | 'Resolved';
  created_at: string;
  updated_at: string;
};

/** GET: list breakdown incidents for current org */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const { data, error } = await supabase
    .from('breakdown_incidents')
    .select('id, org_id, vehicle_id, vehicle_label, latitude, longitude, description, status, created_at, updated_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ incidents: data ?? [] });
}

/** POST: create a new breakdown incident */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  let body: {
    vehicle_id?: string | null;
    vehicle_label?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    description?: string;
    status?: 'Pending' | 'Repairing' | 'Resolved';
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const description = (body.description ?? '').trim();
  if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 });

  const status = body.status ?? 'Pending';
  if (!['Pending', 'Repairing', 'Resolved'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('breakdown_incidents')
    .insert({
      org_id: orgId,
      created_by: user.id,
      vehicle_id: body.vehicle_id ?? null,
      vehicle_label: body.vehicle_label ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      description,
      status,
    })
    .select('id, org_id, vehicle_id, vehicle_label, latitude, longitude, description, status, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ incident: data });
}
