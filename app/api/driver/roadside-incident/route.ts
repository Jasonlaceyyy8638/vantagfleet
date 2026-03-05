import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardOrgId } from '@/lib/admin';
import { getFromEmail } from '@/lib/email-addresses';
import sgMail from '@sendgrid/mail';

const BUCKET = 'dq-documents';
const INCIDENT_PREFIX = 'incidents';
const INCIDENT_TYPES = ['DOT Inspection', 'Mechanical Breakdown', 'Accident', 'Citation'] as const;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://vantagfleet.com';

async function getDispatcherEmails(admin: ReturnType<typeof createAdminClient>, orgId: string): Promise<string[]> {
  const { data: profiles } = await admin
    .from('profiles')
    .select('user_id')
    .eq('org_id', orgId)
    .in('role', ['Owner', 'Dispatcher']);
  const userIds = (profiles ?? []).map((p) => (p as { user_id: string }).user_id).filter(Boolean);
  const emails: string[] = [];
  for (const uid of userIds) {
    try {
      const { data } = await admin.auth.admin.getUserById(uid);
      const email = data?.user?.email;
      if (email) emails.push(email);
    } catch {
      // skip
    }
  }
  return Array.from(new Set(emails));
}

/** GET: last 30 days of incident reports for the current user (driver). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const { data, error } = await supabase
    .from('roadside_incident_reports')
    .select('id, incident_type, notes, latitude, longitude, photo_path, created_at')
    .eq('reported_by_user_id', user.id)
    .eq('org_id', orgId)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data ?? [] });
}

/** POST: create a new roadside incident report; optionally upload photo; notify dispatchers. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  let body: {
    incident_type?: string;
    notes?: string;
    latitude?: number | null;
    longitude?: number | null;
    photoBase64?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const incidentType = (body.incident_type ?? '').trim();
  if (!INCIDENT_TYPES.includes(incidentType as (typeof INCIDENT_TYPES)[number])) {
    return NextResponse.json({ error: 'Invalid incident_type. Use: DOT Inspection, Mechanical Breakdown, Accident, or Citation.' }, { status: 400 });
  }

  const notes = (body.notes ?? '').trim();
  const lat = body.latitude != null && typeof body.latitude === 'number' ? body.latitude : null;
  const lng = body.longitude != null && typeof body.longitude === 'number' ? body.longitude : null;

  let photoPath: string | null = null;
  const b64 = body.photoBase64?.trim();
  if (b64) {
    let buffer: Buffer;
    try {
      const base64Data = b64.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } catch {
      return NextResponse.json({ error: 'Invalid base64 image' }, { status: 400 });
    }
    if (buffer.length > 5 * 1024 * 1024) return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('driver_id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .maybeSingle();
  const driverId = (profile as { driver_id?: string } | null)?.driver_id ?? null;

  const { data: inserted, error: insertError } = await supabase
    .from('roadside_incident_reports')
    .insert({
      org_id: orgId,
      reported_by_user_id: user.id,
      driver_id: driverId,
      incident_type: incidentType,
      notes: notes || null,
      latitude: lat,
      longitude: lng,
      photo_path: null,
    })
    .select('id')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  const reportId = (inserted as { id: string }).id;

  if (b64) {
    const buffer = Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const ext = b64.includes('image/jpeg') || b64.includes('image/jpg') ? 'jpg' : 'png';
    const filePath = `${INCIDENT_PREFIX}/${orgId}/${reportId}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: ext === 'jpg' ? 'image/jpeg' : 'image/png', upsert: true });
    if (!uploadError) {
      await supabase.from('roadside_incident_reports').update({ photo_path: filePath }).eq('id', reportId);
    }
  }

  const { data: org } = await admin.from('organizations').select('name').eq('id', orgId).single();
  const orgName = (org as { name?: string } | null)?.name ?? 'Carrier';
  const dispatcherEmails = await getDispatcherEmails(admin, orgId);
  const dashboardLink = `${APP_URL}/dashboard/roadside-mode`;
  const reportLink = `${dashboardLink}?incident=${reportId}`;

  if (dispatcherEmails.length > 0 && process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    try {
      await sgMail.send({
        to: dispatcherEmails,
        from: getFromEmail('APP_NOTIFICATION_SUPPORT'),
        subject: `New Incident Reported — ${orgName} (${incidentType})`,
        text: `A driver has reported a roadside incident.\n\nType: ${incidentType}\nNotes: ${notes || '(none)'}\nLocation: ${lat != null && lng != null ? `${lat}, ${lng}` : 'Not provided'}\n\nView details: ${reportLink}`,
        html: `
          <p><strong>New Incident Reported</strong></p>
          <p>Type: ${incidentType}</p>
          <p>Notes: ${notes || '(none)'}</p>
          <p>Location: ${lat != null && lng != null ? `${lat}, ${lng}` : 'Not provided'}</p>
          <p><a href="${reportLink}">View in Dashboard</a></p>
        `,
      });
    } catch (e) {
      console.error('[roadside-incident] Notify dispatchers failed:', e);
    }
  }

  return NextResponse.json({ ok: true, id: reportId });
}
