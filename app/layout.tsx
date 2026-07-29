import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProviders } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'U.S.O.S | Unique Search of Smile',
  description:
    'Four seats. Eight levels. Join for ₹2,500 and unlock cash plus gifts from SMART to DOUBLE CROWN — powered by HireKarma.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
