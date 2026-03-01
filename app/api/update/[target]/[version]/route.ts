import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** Parse semver (e.g. "0.1.0" or "v0.1.0") to [major, minor, patch]. */
function parseSemver(v: string): [number, number, number] {
  const s = v.replace(/^v/i, '').trim();
  const parts = s.split('.').map((n) => parseInt(n, 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/** True if a > b. */
function semverGt(a: string, b: string): boolean {
  const [a0, a1, a2] = parseSemver(a);
  const [b0, b1, b2] = parseSemver(b);
  if (a0 !== b0) return a0 > b0;
  if (a1 !== b1) return a1 > b1;
  return a2 > b2;
}

const VALID_TARGETS = ['windows', 'darwin', 'linux'];

/**
 * GET /api/update/[target]/[version]
 * Tauri updater endpoint. Returns 204 if no update; 200 + JSON (version, url, signature, notes?, pub_date?) if a newer version exists for this target.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ target: string; version: string }> }
) {
  const { target, version } = await context.params;
  if (!target || !version) {
    return NextResponse.json({ error: 'Missing target or version' }, { status: 400 });
  }
  const targetNorm = target.toLowerCase();
  if (!VALID_TARGETS.includes(targetNorm)) {
    return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const { data: rows, error } = await supabase
    .from('tauri_versions')
    .select('version, download_url, signature, notes, pub_date')
    .eq('target', targetNorm);

  if (error) {
    console.error('tauri_versions query failed:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const newerList = (rows ?? []).filter((r) => semverGt(r.version, version));
  if (newerList.length === 0) {
    return new NextResponse(null, { status: 204 });
  }
  // Pick the highest semver among newer versions
  const newer = newerList.reduce((a, b) => (semverGt(b.version, a.version) ? b : a));

  const pubDate = newer.pub_date
    ? new Date(newer.pub_date).toISOString()
    : undefined;

  return NextResponse.json({
    version: newer.version,
    url: newer.download_url,
    signature: newer.signature,
    notes: newer.notes ?? undefined,
    pub_date: pubDate,
  });
}
