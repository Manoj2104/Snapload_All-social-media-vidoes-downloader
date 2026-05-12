import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = { title: 'About SnapLoad — Free Video Downloader' };

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 100 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 40px 120px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#534AB7', marginBottom: 16 }}>About</p>
          <h1 style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.0, marginBottom: 32, color: '#0a0a0a' }}>
            Built for everyone who watches online.
          </h1>
          <div style={{ fontSize: 16, color: '#666', lineHeight: 1.9 }}>
            <p>SnapLoad is a free, open-use video downloader built on top of <strong>yt-dlp</strong> — the most capable media extraction library available. We built the front-end to make it fast, clean, and accessible to anyone without technical knowledge.</p>
            <p style={{ marginTop: 24 }}>We believe that if you can watch it, you should be able to keep it — for personal use, offline viewing, and archiving. SnapLoad does not store your videos, does not track your downloads, and will never ask for a credit card.</p>
            <p style={{ marginTop: 24 }}>All content downloaded through SnapLoad remains the intellectual property of its respective creators and platforms. Please only download content you have the right to access, and always respect creators' copyright.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
