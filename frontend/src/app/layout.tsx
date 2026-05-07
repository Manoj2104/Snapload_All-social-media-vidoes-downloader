import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ScrollRevealInit from '@/components/ui/ScrollRevealInit';

const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700','800','900'], display: 'swap' });

export const metadata: Metadata = {
  title: 'SnapLoad — Download YouTube, TikTok & Instagram Videos Free',
  description: 'Free online video downloader for YouTube, Instagram, TikTok, Twitter & 1000+ sites. No login. No watermark. 4K quality. Instant download.',
  keywords: ['youtube downloader','tiktok downloader','instagram video downloader','free video downloader'],
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SnapLoad',
  },
  openGraph: {
    title: 'SnapLoad — Download Any Social Media Video Free',
    description: 'Paste URL. Choose quality. Download instantly. No account required.',
    siteName: 'SnapLoad',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

import { AuthProvider } from '@/context/AuthContext';
import SplashScreen from '@/components/ui/SplashScreen';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SplashScreen />
          <ScrollRevealInit />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
