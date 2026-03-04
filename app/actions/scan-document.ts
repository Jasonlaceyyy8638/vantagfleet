'use server';

import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a DOT Compliance officer. Look at this carrier document image.
Identify the document type. Choose exactly one: COI (Certificate of Insurance), REGISTRATION (vehicle or authority), IFTA (fuel tax), MCS150, BOC3, MED_CARD, CDL, MVR. If none of these fit, use OTHER.
Extract the expiration or renewal date if visible.
Return ONLY valid JSON: { "documentType": "COI" | "REGISTRATION" | "IFTA" | "MCS150" | "BOC3" | "MED_CARD" | "CDL" | "MVR" | "OTHER", "expiryDate": "YYYY-MM-DD" or null }`;

const MODEL = process.env.OPENAI_SCAN_MODEL ?? 'gpt-4o-mini';

export type DriverDocumentType =
  | 'COI'
  | 'REGISTRATION'
  | 'IFTA'
  | 'MCS150'
  | 'BOC3'
  | 'MED_CARD'
  | 'CDL'
  | 'MVR'
  | 'OTHER';

export type ScanDocumentResult =
  | { ok: true; documentType: DriverDocumentType; expiryDate: string | null }
  | { ok: false; error: string };

const VALID_TYPES: DriverDocumentType[] = [
  'COI',
  'REGISTRATION',
  'IFTA',
  'MCS150',
  'BOC3',
  'MED_CARD',
  'CDL',
  'MVR',
  'OTHER',
];

export async function scanDocument(
  formData: FormData
): Promise<ScanDocumentResult> {
  const file = formData.get('file') as File | null;
  if (!file?.size) {
    return { ok: false, error: 'Missing file.' };
  }
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Please upload an image (JPEG, PNG, or WebP).' };
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
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.type};base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 128,
    });

    const raw = response.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return { ok: false, error: 'No response from AI.' };
    }

    const json = extractJson(raw);
    if (!json) {
      return { ok: false, error: 'Could not parse AI response.' };
    }

    const documentType = normalizeDocumentType(json.documentType);
    const expiryDate =
      typeof json.expiryDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(json.expiryDate)
        ? json.expiryDate
        : null;

    return { ok: true, documentType, expiryDate };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed.';
    return { ok: false, error: message };
  }
}

function extractJson(
  text: string
): { documentType?: string; expiryDate?: string | null } | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeDocumentType(value: unknown): DriverDocumentType {
  const s = String(value).toUpperCase().replace(/[-\s]/g, '');
  if (s === 'COI' || s.includes('CERTIFICATE') && s.includes('INSURANCE')) return 'COI';
  if (s === 'REGISTRATION') return 'REGISTRATION';
  if (s === 'IFTA') return 'IFTA';
  if (s === 'MCS150' || s.includes('MCS')) return 'MCS150';
  if (s === 'BOC3' || s.includes('BOC')) return 'BOC3';
  if (s === 'MED_CARD' || s === 'MEDCARD') return 'MED_CARD';
  if (s === 'CDL') return 'CDL';
  if (s === 'MVR') return 'MVR';
  return VALID_TYPES.includes(s as DriverDocumentType)
    ? (s as DriverDocumentType)
    : 'OTHER';
}

const COI_SYSTEM_PROMPT = `You are a DOT Compliance officer reviewing a Certificate of Insurance (COI) image.
Extract the following. Return ONLY valid JSON with these exact keys:
- policyExpirationDate: "YYYY-MM-DD" or null if not found
- liabilityLimit: number (total liability limit in US dollars, e.g. 1000000 for $1,000,000). If shown as "1,000,000" or "$1M" use 1000000. Omit or null if not found.
- cargoLimit: number (cargo/ cargo insurance limit in US dollars) or null if not found or N/A

Example: { "policyExpirationDate": "2026-06-15", "liabilityLimit": 1000000, "cargoLimit": 50000 }`;

export type ScanCoiResult =
  | { ok: true; policyExpirationDate: string | null; liabilityLimit: number | null; cargoLimit: number | null }
  | { ok: false; error: string };

/** Scan a Certificate of Insurance image and extract policy expiration date, liability limit, and cargo limit. */
export async function scanCoiDocument(formData: FormData): Promise<ScanCoiResult> {
  const file = formData.get('file') as File | null;
  if (!file?.size) {
    return { ok: false, error: 'Missing file.' };
  }
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Please upload an image (JPEG, PNG, or WebP).' };
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
      model: MODEL,
      messages: [
        { role: 'system', content: COI_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
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

    const json = extractJsonCoi(raw);
    if (!json) {
      return { ok: false, error: 'Could not parse AI response.' };
    }

    const policyExpirationDate =
      typeof json.policyExpirationDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(json.policyExpirationDate)
        ? json.policyExpirationDate
        : null;
    const liabilityLimit = typeof json.liabilityLimit === 'number' && json.liabilityLimit >= 0 ? json.liabilityLimit : null;
    const cargoLimit = typeof json.cargoLimit === 'number' && json.cargoLimit >= 0 ? json.cargoLimit : null;

    return {
      ok: true,
      policyExpirationDate,
      liabilityLimit,
      cargoLimit,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'COI scan failed.';
    return { ok: false, error: message };
  }
}

function extractJsonCoi(
  text: string
): { policyExpirationDate?: string | null; liabilityLimit?: number | null; cargoLimit?: number | null } | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}
