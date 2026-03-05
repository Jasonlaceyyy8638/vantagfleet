import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ eligible: false }, { status: 200 });
    }

    const cookieStore = await cookies();
    const orgId = await getDashboardOrgId(supabase, cookieStore);
    if (!orgId) {
      return NextResponse.json({ eligible: false }, { status: 200 });
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('tier')
      .eq('id', orgId)
      .single();

    const tier = (org as { tier?: string } | null)?.tier?.toLowerCase() ?? '';
    const eligible = tier === 'pro' || tier === 'diamond';
    return NextResponse.json({ eligible }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/support-chat-eligible]', err);
    return NextResponse.json({ eligible: false }, { status: 200 });
  }
}
