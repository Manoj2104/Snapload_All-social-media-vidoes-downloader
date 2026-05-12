'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroDownloader from '@/components/sections/Hero';
import Marquee from '@/components/sections/Marquee';
import HowItWorks from '@/components/sections/HowItWorks';
import Features from '@/components/sections/FeaturesGrid';
import Platforms from '@/components/sections/Platforms';
import Stats from '@/components/sections/Stats';
import FAQ from '@/components/sections/FAQ';
import SmartAd from '@/components/ads/SmartAd';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroDownloader />
        <SmartAd placement="BETWEEN_SECTIONS" />
        <Marquee />
        <HowItWorks />
        <Features />
        <Platforms />
        <SmartAd placement="FOOTER_TOP" />
        <Stats />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
