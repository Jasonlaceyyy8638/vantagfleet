import Link from 'next/link';
import { Download, ExternalLink } from 'lucide-react';

export const dynamic = 'force-static';

const GITHUB_RELEASES_URL = 'https://github.com/jasonlaceyyy8638/vantagfleet/releases';

export const metadata = {
  title: 'Releases — VantagFleet Desktop',
  description: 'Download VantagFleet desktop installers for Windows and macOS.',
};

export default function ReleasesPage() {
  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-cyber-amber/20 mb-6">
          <Download className="size-10 text-cyber-amber" />
        </div>
        <h1 className="text-2xl font-bold text-soft-cloud mb-3">Desktop releases</h1>
        <p className="text-soft-cloud/70 mb-8">
          Installers for Windows (.msi, .exe) and macOS (.dmg) are published on GitHub Releases.
        </p>
        <a
          href={GITHUB_RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-cyber-amber text-black px-6 py-3 rounded-lg font-semibold hover:bg-cyber-amber/90 transition-colors"
        >
          Open GitHub Releases
          <ExternalLink className="size-4" />
        </a>
        <p className="text-soft-cloud/50 text-sm mt-6">
          After building with <code className="px-1.5 py-0.5 rounded bg-white/10">npm run tauri build</code>, upload the
          installers from <code className="px-1.5 py-0.5 rounded bg-white/10">src-tauri/target/release/bundle/</code> to
          a new release on GitHub.
        </p>
        <Link
          href="/download"
          className="inline-block mt-8 text-sm text-cyber-amber hover:underline"
        >
          ← Back to Download
        </Link>
      </div>
    </div>
  );
}
