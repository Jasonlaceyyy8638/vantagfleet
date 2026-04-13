import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Footer } from '@/components/Footer';
import { TauriUpdateNotifier } from '@/components/TauriUpdateNotifier';
import { PwaRegister } from '@/components/PwaRegister';
import { NextStepProviders } from '@/components/NextStepProviders';

export const metadata: Metadata = {
  title: 'Vantag Fleet — Compliance',
  description: 'Multi-tenant trucking compliance SaaS',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VantagFleet',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFB000',
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-midnight-ink text-soft-cloud flex flex-col">
        <NextStepProviders>
          <div className="flex-1">{children}</div>
        </NextStepProviders>
        <Footer />
        <TauriUpdateNotifier />
        <PwaRegister />
      </body>
    </html>
  );
}
