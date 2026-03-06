import path from 'path';
import { readFileSync, existsSync } from 'fs';

// Load SENDGRID_API_KEY from .env or .env.local (project root or types/) so it's available
function loadSendGridKey() {
  const cwd = process.cwd();
  const locations = ['.env.local', '.env', 'types/.env.local', 'types/.env'];
  for (const name of locations) {
    const envPath = path.join(cwd, name);
    if (!existsSync(envPath)) continue;
    try {
      let content = readFileSync(envPath, 'utf8');
      if (content.charCodeAt(0) === 0xfeff) content = content.slice(1); // strip BOM
      const hasKey = /\bSENDGRID_API_KEY\s*=/m.test(content);
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim().replace(/^\uFEFF/, '');
        if (key !== 'SENDGRID_API_KEY') continue;
        let value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (value.length > 10) {
          process.env.SENDGRID_API_KEY = value;
          if (process.env.NODE_ENV !== 'production') {
            console.log('[next.config] SENDGRID_API_KEY loaded from', name, '(length:', value.length, ')');
          }
          return;
        }
        if (process.env.NODE_ENV !== 'production' && value.length > 0) {
          console.warn('[next.config] SENDGRID_API_KEY found in', name, 'but value too short (length', value.length, '). Use a full SendGrid API key (starts with SG.).');
        }
      }
      if (process.env.NODE_ENV !== 'production' && hasKey && !process.env.SENDGRID_API_KEY) {
        console.warn('[next.config] SENDGRID_API_KEY line in', name, 'has empty or invalid value. Example: SENDGRID_API_KEY=SG.xxxx... (no # at start, no space before =)');
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[next.config] Could not read', name, ':', e?.message || e);
      }
    }
  }
  if (process.env.NODE_ENV !== 'production' && !process.env.SENDGRID_API_KEY) {
    console.warn('[next.config] SENDGRID_API_KEY not set. Add to .env.local: SENDGRID_API_KEY=SG.xxx then save and restart.');
  }
}
loadSendGridKey();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose SENDGRID_API_KEY to server (API routes, Server Actions) so it's available at runtime
  env: {
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  },
  // Tauri requires static export; enable only when building for desktop (npm run build:tauri).
  ...(process.env.TAURI_BUILD === '1' && { output: 'export' }),
};

export default nextConfig;
