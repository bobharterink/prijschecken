import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const display = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-display',
});

const body = Archivo({
  subsets: ['latin'],
  variable: '--font-body',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'prijschecken.nl',
  description: 'Dagelijkse prijshistoriek van elektronica',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <header className="masthead">
          <div className="masthead-inner">
            <Link href="/" className="logo">
              prijschecken<span style={{ color: 'var(--ink-soft)' }}>.nl</span>
            </Link>
            <span className="masthead-note">1 meting per dag</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
