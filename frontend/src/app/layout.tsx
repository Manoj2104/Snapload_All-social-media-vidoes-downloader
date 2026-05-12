import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ScrollRevealInit from '@/components/ui/ScrollRevealInit';

const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700','800','900'], display: 'swap' });

export const metadata: Metadata = {
  title: 'SnapLoad — Download YouTube, TikTok & Instagram Videos Free',
  description: 'Free online video downloader for YouTube, Instagram, TikTok, Twitter & 1000+ sites. No login. No watermark. 4K quality. Instant download.',
  keywords: ['youtube downloader','tiktok downloader','instagram video downloader','free video downloader'],
  openGraph: {
    title: 'SnapLoad — Download Any Social Media Video Free',
    description: 'Paste URL. Choose quality. Download instantly. No account required.',
    siteName: 'SnapLoad',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ScrollRevealInit />
        {children}
      </body>
    </html>
  );
}
