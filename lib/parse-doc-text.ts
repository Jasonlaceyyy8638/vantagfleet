/**
 * Parse OCR/extracted text from Med Card, CDL, or MVR for expiration date, issue date, and driver name.
 * Handles common formats: MM/DD/YYYY, MM-DD-YYYY, Month DD, YYYY, etc.
 */

function parseDateFromText(text: string): string | null {
  const normalized = text.replace(/\s+/g, ' ');
  // MM/DD/YYYY or M/D/YY
  const slash = normalized.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g);
  if (slash?.length) {
    for (const s of slash) {
      const [m, d, y] = s.split('/').map(Number);
      const fullYear = y < 100 ? 2000 + y : y;
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const iso = `${fullYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (!isNaN(new Date(iso).getTime())) return iso;
      }
    }
  }
  // MM-DD-YYYY
  const dash = normalized.match(/\b(\d{1,2})-(\d{1,2})-(\d{2,4})\b/g);
  if (dash?.length) {
    for (const s of dash) {
      const [m, d, y] = s.split('-').map(Number);
      const fullYear = y < 100 ? 2000 + y : y;
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const iso = `${fullYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (!isNaN(new Date(iso).getTime())) return iso;
      }
    }
  }
  return null;
}

/** Find expiration date: look for "expir", "expiration", "expires", "valid until" then parse nearest date. */
export function extractExpirationDate(text: string): string | null {
  const lower = text.toLowerCase();
  const expirIndex = lower.search(/expir|valid\s+until|expires|expiration\s*date/);
  if (expirIndex === -1) {
    return parseDateFromText(text);
  }
  const after = text.slice(expirIndex, expirIndex + 80);
  return parseDateFromText(after) ?? parseDateFromText(text);
}

/** Find issue date: look for "issue", "issued", "date of issue" then parse nearest date. */
export function extractIssueDate(text: string): string | null {
  const lower = text.toLowerCase();
  const issueIndex = lower.search(/issue\s*date|issued|date\s+of\s+issue/);
  if (issueIndex === -1) return parseDateFromText(text);
  const after = text.slice(issueIndex, issueIndex + 80);
  return parseDateFromText(after) ?? parseDateFromText(text);
}

/** Extract likely driver name: often first line or after "name", "driver name", or 2–4 consecutive title-case words. */
export function extractDriverName(text: string): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const lower = text.toLowerCase();
  const nameLabel = lower.search(/driver\s*name|name\s*:|applicant\s*name/);
  if (nameLabel !== -1) {
    const snippet = text.slice(nameLabel, nameLabel + 60);
    const match = snippet.match(/(?:name|:)\s*([A-Za-z][A-Za-z\s\-']{2,48})/);
    if (match?.[1]) return match[1].trim();
  }
  for (const line of lines) {
    if (line.length >= 4 && line.length <= 50 && /^[A-Za-z]/.test(line) && !/\d{4}/.test(line)) {
      return line;
    }
  }
  return null;
}

export type ParsedDoc = {
  expirationDate: string | null;
  issueDate: string | null;
  driverName: string | null;
};

export function parseDocText(text: string): ParsedDoc {
  return {
    expirationDate: extractExpirationDate(text),
    issueDate: extractIssueDate(text),
    driverName: extractDriverName(text),
  };
}
