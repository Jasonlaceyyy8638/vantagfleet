import type { Metadata } from 'next';
import './globals.css';
import { Footer } from '@/components/Footer';
import { TauriUpdateNotifier } from '@/components/TauriUpdateNotifier';

export const metadata: Metadata = {
  title: 'Vantag Fleet — Compliance',
  description: 'Multi-tenant trucking compliance SaaS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-midnight-ink text-soft-cloud flex flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
        <TauriUpdateNotifier />
      </body>
    </html>
  );
}
