import type { Metadata } from 'next';
import './globals.css';

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
      <body className="antialiased min-h-screen bg-midnight-ink text-soft-cloud">
        {children}
      </body>
    </html>
  );
}
