'use client';
import { useState } from 'react';
import { Search, CheckCircle, Video, Download } from 'lucide-react';

type Quality = '4K' | '1080p' | '720p' | '480p' | 'MP3';

const QUALITIES: Quality[] = ['4K', '1080p', '720p', '480p', 'MP3'];

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#FF0000', instagram: '#E4405F', tiktok: '#000',
  twitter: '#1DA1F2', facebook: '#1877F2', reddit: '#FF4500',
  linkedin: '#0A66C2', vimeo: '#1AB7EA',
};

function detectPlatform(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
  if (lower.includes('instagram.com')) return 'Instagram';
  if (lower.includes('tiktok.com')) return 'TikTok';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'Twitter/X';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'Facebook';
  if (lower.includes('reddit.com')) return 'Reddit';
  if (lower.includes('linkedin.com')) return 'LinkedIn';
  if (lower.includes('vimeo.com')) return 'Vimeo';
  return null;
}

export default function LiveDemo() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality>('1080p');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'ready' | 'downloading' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  const handleInput = (val: string) => {
    setUrl(val);
    setPlatform(detectPlatform(val));
  };

  const handleAnalyze = () => {
    if (!url.trim()) return;
    setStatus('analyzing');
    setTimeout(() => setStatus('ready'), 1200);
  };

  const handleDownload = () => {
    setStatus('downloading');
    setProgress(0);
    let p = 0;
    const id = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) { p = 100; clearInterval(id); setStatus('done'); }
      setProgress(Math.min(p, 100));
    }, 200);
  };

  const qualityExt = quality === 'MP3' ? 'mp3' : 'mp4';

  return (
    <section
      id="demo"
      style={{ padding: '120px 40px', borderTop: '0.5px solid #efefef', borderBottom: '0.5px solid #efefef', background: '#f9f9f9' }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#534AB7', marginBottom: 16 }}>Live demo</p>
        <h2 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16, color: '#0a0a0a' }}>
          Try it right now.
        </h2>
        <p style={{ fontSize: 16, color: '#aaaaaa', marginBottom: 48, lineHeight: 1.8 }}>
          No account. No extension. Just paste and go.
        </p>

        {/* URL bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '0.5px solid #e8e8e8',
          borderRadius: 100, padding: '6px 6px 6px 20px',
          transition: 'border-color 0.2s',
        }}>
          <Search size={16} color="#aaaaaa" style={{ flexShrink: 0 }} />
          <input
            value={url}
            onChange={e => handleInput(e.target.value)}
            placeholder="Paste YouTube, Instagram, TikTok URL..."
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 15,
              background: 'transparent', color: '#0a0a0a',
              minWidth: 0,
            }}
          />
          {platform && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', background: '#EEEDFE',
              borderRadius: 100, fontSize: 11, fontWeight: 600,
              color: '#534AB7', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <CheckCircle size={12} /> {platform} detected
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={!url.trim() || status === 'analyzing'}
            style={{
              padding: '10px 24px', background: '#534AB7', color: '#fff',
              border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 500,
              cursor: 'pointer', flexShrink: 0, transition: 'transform 0.15s, opacity 0.15s',
              opacity: !url.trim() ? 0.5 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {status === 'analyzing' ? 'Analyzing…' : 'Analyze →'}
          </button>
        </div>

        {/* Quality chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          {QUALITIES.map(q => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              style={{
                padding: '6px 18px',
                background: quality === q ? '#534AB7' : '#fff',
                color: quality === q ? '#fff' : '#0a0a0a',
                border: `0.5px solid ${quality === q ? '#534AB7' : '#e8e8e8'}`,
                borderRadius: 100, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Video preview card */}
        {(status === 'ready' || status === 'downloading' || status === 'done') && (
          <div style={{
            marginTop: 32, background: '#fff', border: '0.5px solid #e8e8e8',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* Thumbnail */}
            <div style={{
              width: '100%', aspectRatio: '16/9',
              background: 'linear-gradient(135deg, #EEEDFE 0%, #f0f0f0 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 56, height: 56, background: '#534AB7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Video size={24} color="#fff" />
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, margin: 0, marginBottom: 4, letterSpacing: '-0.3px' }}>
                    Sample Video Title · HD Quality
                  </p>
                  <p style={{ fontSize: 13, color: '#aaaaaa', margin: 0 }}>
                    {platform ?? 'Unknown'} · 3:42 · ~120MB
                  </p>
                </div>
                <span style={{
                  padding: '4px 12px', background: '#EEEDFE',
                  borderRadius: 100, fontSize: 11, fontWeight: 600,
                  color: '#534AB7', whiteSpace: 'nowrap',
                }}>
                  {platform ?? 'Video'}
                </span>
              </div>

              {/* Progress bar (shows while downloading) */}
              {(status === 'downloading' || status === 'done') && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: '#534AB7', transition: 'width 0.2s', borderRadius: 2 }} />
                  </div>
                  <p style={{ fontSize: 12, color: '#aaaaaa', marginTop: 6 }}>
                    {status === 'done' ? '✓ File ready!' : `${Math.round(progress)}% — Downloading…`}
                  </p>
                </div>
              )}

              <button
                onClick={handleDownload}
                disabled={status === 'downloading'}
                style={{
                  width: '100%', padding: '14px', background: '#0a0a0a',
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { if (status !== 'downloading') e.currentTarget.style.transform = 'scale(1.01)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Download size={16} />
                {status === 'done' ? `Open file · ${quality} · ${qualityExt.toUpperCase()}` : `Download ${quality} · ${qualityExt.toUpperCase()}`}
              </button>
            </div>
          </div>
        )}

        {/* Ad slot */}
        <div className="ad-slot" style={{ marginTop: 48 }}>
          <p className="ad-label">Advertisement</p>
          <div className="ad-placeholder" style={{ width: '100%', maxWidth: 728, height: 90, margin: '0 auto' }}>
            728×90 — AdSense slot
          </div>
        </div>
      </div>
    </section>
  );
}
