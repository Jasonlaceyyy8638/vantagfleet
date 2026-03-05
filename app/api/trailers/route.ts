import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';

/** GET: list trailers for current org */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const { data, error } = await supabase
    .from('trailers')
    .select('id, trailer_number, vin, plate_number, assigned_driver_id, created_at')
    .eq('org_id', orgId)
    .order('trailer_number');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trailers: data ?? [] });
}

/** POST: create trailer */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  let body: { trailer_number?: string; vin?: string | null; plate_number?: string | null; assigned_driver_id?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const trailer_number = body.trailer_number?.trim();
  if (!trailer_number) return NextResponse.json({ error: 'trailer_number required' }, { status: 400 });

  const { data, error } = await supabase
    .from('trailers')
    .insert({
      org_id: orgId,
      trailer_number,
      vin: body.vin?.trim() || null,
      plate_number: body.plate_number?.trim() || null,
      assigned_driver_id: body.assigned_driver_id || null,
    })
    .select('id, trailer_number, vin, plate_number, assigned_driver_id, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trailer: data });
}
