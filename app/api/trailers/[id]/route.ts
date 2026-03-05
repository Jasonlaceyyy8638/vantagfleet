import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';

/** PATCH: update trailer (e.g. assign driver) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Trailer id required' }, { status: 400 });

  let body: { trailer_number?: string; vin?: string | null; plate_number?: string | null; assigned_driver_id?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates: { trailer_number?: string; vin?: string | null; plate_number?: string | null; assigned_driver_id?: string | null } = {};
  if (body.trailer_number !== undefined) updates.trailer_number = body.trailer_number.trim();
  if (body.vin !== undefined) updates.vin = body.vin?.trim() || null;
  if (body.plate_number !== undefined) updates.plate_number = body.plate_number?.trim() || null;
  if (body.assigned_driver_id !== undefined) updates.assigned_driver_id = body.assigned_driver_id || null;

  const { data, error } = await supabase
    .from('trailers')
    .update(updates)
    .eq('id', id)
    .eq('org_id', orgId)
    .select('id, trailer_number, vin, plate_number, assigned_driver_id, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trailer: data });
}
