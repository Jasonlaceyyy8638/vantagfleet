/**
 * Invoke the send-eld-success Edge Function to email the user after they connect an ELD.
 * Call this after successful Motive OAuth or Geotab connect (and optionally Samsara).
 */

const ELD_PROVIDERS = ['motive', 'geotab', 'samsara'] as const;
export type EldProviderForEmail = (typeof ELD_PROVIDERS)[number];

export async function sendEldSuccessEmail(
  userId: string,
  orgId: string,
  eldProvider: EldProviderForEmail
): Promise<{ ok: true } | { error: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' };
  }
  const functionUrl = `${url.replace(/\/$/, '')}/functions/v1/send-eld-success`;
  try {
    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        org_id: orgId,
        eld_provider: eldProvider,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: (data as { error?: string }).error ?? `Function returned ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: message };
  }
}
