import Link from 'next/link';
import { Download, Monitor, Apple, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Download VantagFleet Desktop — Windows & Mac',
  description: 'Download VantagFleet desktop app for Windows and macOS. Fleet management and compliance, native.',
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-soft-cloud/70 hover:text-cyber-amber mb-8 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex p-3 rounded-2xl bg-cyber-amber/20 mb-6">
            <Download className="size-12 text-cyber-amber" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-soft-cloud mb-3">
            VantagFleet Desktop
          </h1>
          <p className="text-soft-cloud/70 text-lg max-w-2xl mx-auto">
            Run VantagFleet natively on your machine. Full fleet map, Motive sync, and compliance—offline-ready and fast.
          </p>
        </div>

        {/* Download for Windows / Mac */}
        <section className="rounded-2xl border border-cyber-amber/30 bg-card/80 p-8 sm:p-10 shadow-xl">
          <h2 className="text-xl font-semibold text-soft-cloud mb-2 text-center">
            Download for your platform
          </h2>
          <p className="text-soft-cloud/60 text-sm text-center mb-8">
            Windows downloads directly. Mac opens the release page so you can pick Intel or Apple Silicon.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <a
              href="https://github.com/jasonlaceyyy8638/vantagfleet/releases/download/v0.1.0/VantagFleet_0.1.0_x64-setup.exe"
              download
              className="group flex flex-col items-center gap-4 p-6 rounded-xl border border-white/10 bg-midnight-ink hover:border-cyber-amber/50 hover:bg-cyber-amber/5 transition-all duration-200"
            >
              <div className="p-4 rounded-xl bg-soft-cloud/10 group-hover:bg-cyber-amber/20 transition-colors">
                <Monitor className="size-10 text-soft-cloud group-hover:text-cyber-amber" />
              </div>
              <span className="font-semibold text-soft-cloud">Windows</span>
              <span className="text-sm text-soft-cloud/60">.exe — starts downloading</span>
              <span className="inline-flex items-center gap-2 text-cyber-amber text-sm font-medium">
                Download
                <Download className="size-4" />
              </span>
            </a>
            <a
              href="https://github.com/jasonlaceyyy8638/vantagfleet/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-4 p-6 rounded-xl border border-white/10 bg-midnight-ink hover:border-cyber-amber/50 hover:bg-cyber-amber/5 transition-all duration-200"
            >
              <div className="p-4 rounded-xl bg-soft-cloud/10 group-hover:bg-cyber-amber/20 transition-colors">
                <Apple className="size-10 text-soft-cloud group-hover:text-cyber-amber" />
              </div>
              <span className="font-semibold text-soft-cloud">Mac</span>
              <span className="text-sm text-soft-cloud/60">.dmg — pick Intel or Apple Silicon</span>
              <span className="inline-flex items-center gap-2 text-cyber-amber text-sm font-medium">
                Open releases
                <Download className="size-4" />
              </span>
            </a>
          </div>
          <p className="text-center text-soft-cloud/50 text-xs mt-6">
            You only upload the Windows .exe yourself. To add Mac installers, run <strong>Actions → Release Desktop</strong> once; it builds and attaches them to the release.
          </p>
        </section>

        <div className="mt-10 text-center text-soft-cloud/60 text-sm">
          <p>Prefer the web app? <Link href="/" className="text-cyber-amber hover:underline">Use VantagFleet in your browser</Link>.</p>
        </div>
      </div>
    </div>
  );
}
