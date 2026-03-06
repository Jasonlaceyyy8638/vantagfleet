import { NextResponse } from 'next/server';

/**
 * Quick diagnostic: does the server see SENDGRID_API_KEY?
 * Open http://localhost:3000/api/check-sendgrid (or whatever port your "npm run dev" shows) in the browser.
 * If keyLength is 0, the env var isn't loaded — fix .env.local and restart the dev server.
 * Delete this file after debugging.
 */
export async function GET() {
  const raw = process.env.SENDGRID_API_KEY;
  const key = typeof raw === 'string' ? raw.trim() : '';
  const configured = key.length > 10;
  return NextResponse.json({
    configured,
    keyLength: key.length,
    hint: configured
      ? 'Key is present. If emails still fail, check SendGrid dashboard for API key permissions (Mail Send).'
      : 'SENDGRID_API_KEY is missing or too short. Add it to .env.local in the project root, then stop and run "npm run dev" again.',
  });
}
