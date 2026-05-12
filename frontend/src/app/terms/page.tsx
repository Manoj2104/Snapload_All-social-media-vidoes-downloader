import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = { title: 'Terms of Service — SnapLoad' };

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 100 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 40px 120px' }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-2px', marginBottom: 48 }}>Terms of service</h1>
          <div style={{ fontSize: 15, color: '#666', lineHeight: 1.9 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', marginTop: 40, marginBottom: 12 }}>Acceptable use</h2>
            <p>SnapLoad is provided for personal, non-commercial use only. You may not use SnapLoad to download content that you do not have the right to access, or to circumvent DRM protections.</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', marginTop: 40, marginBottom: 12 }}>Copyright</h2>
            <p>All downloaded content remains the intellectual property of its original creators and platforms. Redistribution of downloaded content without permission from the rightsholder is prohibited.</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', marginTop: 40, marginBottom: 12 }}>Disclaimer</h2>
            <p>SnapLoad is provided "as is" without warranty of any kind. We are not responsible for how you use downloaded content. Service availability is not guaranteed.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
