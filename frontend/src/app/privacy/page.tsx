import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = { title: 'Privacy Policy — SnapLoad' };

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 100 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 40px 120px' }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-2px', marginBottom: 48 }}>Privacy policy</h1>
          <div style={{ fontSize: 15, color: '#666', lineHeight: 1.9 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', marginTop: 40, marginBottom: 12 }}>What we collect</h2>
            <p>SnapLoad does not collect personally identifiable information. We use anonymous analytics (page views, referrer) via privacy-friendly tooling.</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', marginTop: 40, marginBottom: 12 }}>Video data</h2>
            <p>We do not store the URLs you paste or the files you download. Downloads are served directly from the original platform's CDN through our backend proxy, and no copies are retained.</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', marginTop: 40, marginBottom: 12 }}>Cookies</h2>
            <p>We use essential cookies only (session management). No advertising cookies are set by SnapLoad directly, though our AdSense integration may set its own cookies per Google's policies.</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', marginTop: 40, marginBottom: 12 }}>Contact</h2>
            <p>Questions? Email privacy@snapload.in</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
