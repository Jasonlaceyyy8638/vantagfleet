/**
 * Builds a minimal static shell for the Tauri desktop app.
 * The app uses server actions, so we can't static-export Next.js.
 * This writes a single HTML that loads the live site in the webview.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'out');

const PRODUCTION_URL = 'https://vantagfleet.com';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VantagFleet</title>
  <script>
    window.location.replace('${PRODUCTION_URL}?tauri=1');
  </script>
</head>
<body>
  <p style="font-family:sans-serif;padding:2rem;color:#666;">Loading VantagFleet…</p>
</body>
</html>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.html'), html, 'utf8');
console.log('Tauri shell written to out/index.html (loads', PRODUCTION_URL, ')');
