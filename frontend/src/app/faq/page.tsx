import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FAQ from '@/components/sections/FAQ';

export const metadata: Metadata = { title: 'FAQ — SnapLoad Video Downloader' };

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 100 }}>
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
