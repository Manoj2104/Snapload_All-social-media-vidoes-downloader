'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface HistoryItem {
  id: string | number;
  title: string;
  thumbnail?: string;
  platform: string;
  date: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('snapload_history') || '[]') as HistoryItem[];
    setHistory(saved);
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 100 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 40px 120px' }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-2px', marginBottom: 48 }}>Download history</h1>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', border: '0.5px solid #efefef', borderRadius: 16 }}>
              <p style={{ color: '#aaaaaa', fontSize: 15, marginBottom: 24 }}>No recent downloads found.</p>
              <Link href="/" style={{
                display: 'inline-block', padding: '12px 28px',
                background: '#0a0a0a', color: '#fff', borderRadius: 100,
                fontWeight: 500, fontSize: 14, textDecoration: 'none',
              }}>
                Start downloading
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#e8e8e8', borderRadius: 16, overflow: 'hidden' }}>
              {history.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: 20, padding: 20, background: '#fff', alignItems: 'center' }}>
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt="" style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 15, margin: 0, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', background: '#EEEDFE', color: '#534AB7', borderRadius: 100, letterSpacing: '0.05em' }}>{item.platform}</span>
                      <span style={{ fontSize: 12, color: '#aaaaaa' }}>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
