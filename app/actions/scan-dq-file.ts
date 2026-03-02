'use server';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const PROMPT = `Look at this DOT Medical Card/CDL. Extract the Driver Name and the Expiration Date. Return ONLY a JSON object: { "name": "string", "expirationDate": "YYYY-MM-DD", "type": "MED_CARD" | "CDL" }`;

export type ScanDqResult =
  | { ok: true; name?: string; expirationDate: string; type: 'MED_CARD' | 'CDL' }
  | { ok: false; error: string };

export async function scanDqFile(formData: FormData): Promise<ScanDqResult> {
  const file = formData.get('file') as File | null;
  const driverId = formData.get('driverId') as string | null;

  if (!file?.size || !driverId) {
    return { ok: false, error: 'Missing file or driver.' };
  }

  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Please upload an image (JPEG, PNG, or WebP).' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Unauthorized.' };
  }

  const { data: driver, error: driverErr } = await supabase
    .from('drivers')
    .select('id, org_id')
    .eq('id', driverId)
    .single();

  if (driverErr || !driver) {
    return { ok: false, error: 'Driver not found.' };
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', driver.org_id)
    .single();
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', driver.org_id)
    .single();
  if (!orgMember && !profile) {
    return { ok: false, error: 'You do not have access to this driver.' };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: 'OpenAI is not configured.' };
  }

  let base64: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    base64 = buffer.toString('base64');
  } catch {
    return { ok: false, error: 'Failed to read image.' };
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.type};base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 256,
    });

    const raw = response.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return { ok: false, error: 'No response from AI.' };
    }

    const json = extractJson(raw);
    if (!json) {
      return { ok: false, error: 'Could not parse AI response.' };
    }

    const name = typeof json.name === 'string' ? json.name : undefined;
    const expirationDate = typeof json.expirationDate === 'string' ? json.expirationDate : null;
    const type = json.type === 'MED_CARD' || json.type === 'CDL' ? json.type : 'MED_CARD';

    if (!expirationDate || !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
      return { ok: false, error: 'No valid expiration date found on the document.' };
    }

    const { error: updateErr } = await supabase
      .from('drivers')
      .update({
        med_card_expiry: expirationDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', driverId);

    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }

    return { ok: true, name, expirationDate, type };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed.';
    return { ok: false, error: message };
  }
}

function extractJson(text: string): { name?: string; expirationDate?: string; type?: string } | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as { name?: string; expirationDate?: string; type?: string };
  } catch {
    return null;
  }
}
