import type { Metadata } from 'next';
import { DM_Sans, Inter } from 'next/font/google';
import { AppProviders } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'U.S.O.S | Unique Search of Smile',
  description: 'Unique Search of Smile — network rewards platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var lk='usos_locale';var l=localStorage.getItem(lk);if(l==='en'||l==='hi'||l==='or')d.lang=l;var k='usos-color-mode';var m=localStorage.getItem(k);if(m!=='dark'&&m!=='light'){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(m==='dark')d.classList.add('dark');d.style.colorScheme=m;}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
