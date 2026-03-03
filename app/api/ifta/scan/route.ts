import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are an IFTA auditor. Extract: Total Gallons (number), State (2-letter code), Fuel Type (Diesel/Gas), and Date (YYYY-MM-DD). Return ONLY a JSON object. If you cannot find a value, return null for that field.
Example: { "gallons": 50.5, "state": "OH", "fuelType": "Diesel", "date": "2026-01-15" }`;

const MODEL = process.env.OPENAI_SCAN_MODEL ?? 'gpt-5-nano';

function extractJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { receiptUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const receiptUrl = typeof body.receiptUrl === 'string' ? body.receiptUrl.trim() : '';
  if (!receiptUrl) {
    return NextResponse.json(
      { error: 'Missing receiptUrl' },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI scan is not configured' },
      { status: 503 }
    );
  }

  const admin = createAdminClient();

  const { data: row, error: findError } = await admin
    .from('ifta_receipts')
    .select('id, file_url')
    .eq('file_url', receiptUrl)
    .maybeSingle();

  if (findError || !row) {
    return NextResponse.json(
      { error: 'Receipt not found for this URL' },
      { status: 404 }
    );
  }

  let imageBase64: string;
  try {
    const res = await fetch(receiptUrl, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Could not load image from URL' },
        { status: 400 }
      );
    }
    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    imageBase64 = `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error('[ifta/scan] Image fetch failed:', err);
    return NextResponse.json(
      { error: 'Could not load image. Check that the URL is accessible.' },
      { status: 400 }
    );
  }

  const openai = new OpenAI({ apiKey });
  let raw: string;
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
      max_tokens: 256,
    });
    raw = response.choices?.[0]?.message?.content?.trim() ?? '';
  } catch (err) {
    console.error('[ifta/scan] OpenAI error:', err);
    return NextResponse.json(
      { error: 'AI could not process the image. Please enter the data manually.' },
      { status: 502 }
    );
  }

  if (!raw) {
    return NextResponse.json(
      { error: "We couldn't read this receipt. Please enter the data manually." },
      { status: 422 }
    );
  }

  const json = extractJson(raw);
  if (!json) {
    return NextResponse.json(
      { error: "We couldn't parse the receipt. Please enter the data manually." },
      { status: 422 }
    );
  }

  const gallons =
    typeof json.gallons === 'number'
      ? json.gallons
      : json.gallons != null
        ? Number(json.gallons)
        : null;
  const state =
    typeof json.state === 'string'
      ? json.state.trim()
      : json.state != null
        ? String(json.state).trim()
        : null;
  const receiptDate =
    typeof json.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(json.date)
      ? json.date
      : null;

  const stateNormalized = state && state.length >= 2 ? state.slice(0, 2).toUpperCase() : state ?? null;

  const { error: updateError } = await admin
    .from('ifta_receipts')
    .update({
      gallons: gallons ?? null,
      state: stateNormalized ?? null,
      receipt_date: receiptDate ?? null,
      status: 'processed',
    })
    .eq('id', row.id);

  if (updateError) {
    console.error('[ifta/scan] DB update failed:', updateError);
    return NextResponse.json(
      { error: 'Failed to save extracted data' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    id: row.id,
    gallons: gallons ?? undefined,
    state: stateNormalized ?? undefined,
    date: receiptDate ?? undefined,
    fuelType: typeof json.fuelType === 'string' ? json.fuelType : undefined,
  });
}
