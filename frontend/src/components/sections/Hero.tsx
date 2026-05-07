'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Search, Download, MousePointer2, Shield, Zap, CheckCircle, Loader2, X, Play, Video, Music, AlertCircle, ClipboardPaste } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const WORDS = ['YouTube','Instagram','TikTok','Twitter','Facebook','Vimeo'];
const QUALITIES = ['4K','1080p','720p','480p','MP3'] as const;
type Quality = typeof QUALITIES[number];

import { API_BASE } from '@/lib/api';

interface VideoMetadata {
  title: string;
  thumbnail: string;
  duration: number;
  platform: string;
  formats: any[];
}

import SmartAd from '@/components/ads/SmartAd';

export default function HeroDownloader() {
  const [wordIdx, setWordIdx] = useState(0);
  const [url, setUrl] = useState('');
  const [isGhostHover, setIsGhostHover] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [quality, setQuality] = useState<Quality>('1080p');
  const [phase, setPhase] = useState<'idle'|'analyzing'|'ready'|'downloading'|'done'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const { user, token, refreshUser } = useAuth();
  
  const ghostControls = useAnimation();
  const [ghostState, setGhostState] = useState<'idle' | 'hovering' | 'clicking'>('idle');

  // Typewriter
  useEffect(() => {
    const timer = setInterval(() => setWordIdx(i => (i + 1) % WORDS.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const [quickExtract, setQuickExtract] = useState(false);

  const analyze = async () => {
    if (!url.trim()) return;
    setPhase('analyzing');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Analysis failed. Please try again.');
      }
      const data = await res.json();
      setMetadata(data);
      setErrorMsg('');
      
      if (quickExtract) {
        setPhase('ready');
        // We'll trigger startDownload in a useEffect when metadata is set and phase is ready
      } else {
        setPhase('ready');
        setShowModal(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setPhase('error');
    }
  };

  useEffect(() => {
    if (quickExtract && phase === 'ready' && metadata) {
      startDownload();
    }
  }, [phase, metadata, quickExtract]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch (err) {
      console.error('Clipboard paste failed:', err);
      const input = document.querySelector('input[placeholder="Paste video link..."]') as HTMLInputElement;
      if (input) input.focus();
    }
  };

  const handleClear = () => {
    setUrl('');
    setErrorMsg('');
    setPhase('idle');
    setMetadata(null);
  };

  const startDownload = async () => {
    if (!metadata || !url) return;
    setPhase('downloading');
    setProgress(0);
    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          url,
          format: quality === 'MP3' ? 'audio' : 'video',
          quality: quality
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Download failed to start.');
      }
      
      const data = await res.json();
      setJobId(data.jobId);
      if (token) refreshUser(); // Refresh credits
    } catch (err: any) {
      setErrorMsg(err.message);
      setPhase('error');
    }
  };

  // Status Polling
  useEffect(() => {
    if (!jobId || phase !== 'downloading') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/status/${jobId}`);
        const data = await res.json();
        const p = parseFloat(data.progress || '0');
        setProgress(p);
        if (data.status === 'completed') {
          setPhase('done');
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setPhase('error');
          setErrorMsg(data.error || 'Download task failed.');
          clearInterval(interval);
        }
      } catch (e) {
        console.error('Status poll error', e);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [jobId, phase]);

  // ── Ghost Cursor Logic ──
  useEffect(() => {
    let mounted = true;
    const runGhostPath = async () => {
      while (mounted) {
        setGhostState('idle');
        try {
          await ghostControls.start({ x: Math.random() * 200 - 100, y: Math.random() * 100 - 100, rotate: Math.random() * 4 - 2, scale: 0.9, transition: { duration: 4, ease: "easeInOut" } });
          if (!mounted) break;
          await ghostControls.start({ x: -50, y: 140, rotate: 0, scale: 1, transition: { duration: 2, ease: [0.23, 1, 0.32, 1] } });
          if (!mounted) break;
          setGhostState('hovering'); 
          await new Promise(r => setTimeout(r, 1000));
          if (!mounted) break;
          await ghostControls.start({ x: 210, y: 140, rotate: 5, scale: 1.1, transition: { duration: 1.2, ease: "circOut" } });
          if (!mounted) break;
          setGhostState('clicking'); 
          setIsGhostHover(true); 
          await new Promise(r => setTimeout(r, 400));
          setIsGhostHover(false);
          setGhostState('idle');
          if (!mounted) break;
          await ghostControls.start({ x: 250, y: -150, rotate: -8, scale: 0.8, transition: { duration: 3, ease: "backOut" } });
          if (!mounted) break;
          await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
          // Ignore animation interruptions
        }
      }
    };
    runGhostPath();
    return () => { mounted = false; ghostControls.stop(); };
  }, [ghostControls]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white pt-20">
      {/* ── BACKGROUND PARTICLES ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 2000 - 1000, 
              y: Math.random() * 2000 - 1000,
              opacity: Math.random() * 0.3
            }}
            animate={{ 
              y: [null, Math.random() * 400 - 200],
              x: [null, Math.random() * 400 - 200],
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 10 + Math.random() * 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute w-2 h-2 md:w-4 md:h-4 bg-blue-100 rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* ── AURORA MOUSE FOLLOWERS ── */}
      <motion.div 
        animate={{ x: mousePos.x - 400, y: mousePos.y - 400 }}
        transition={{ type: "spring", damping: 35, stiffness: 200, mass: 0.4 }}
        className="fixed top-0 left-0 w-[800px] h-[800px] bg-gradient-to-tr from-blue-600/25 via-indigo-600/15 to-transparent rounded-full blur-[140px] z-0 pointer-events-none hidden md:block"
      />
      <motion.div 
        animate={{ x: mousePos.x - 200, y: mousePos.y - 200 }}
        transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.2 }}
        className="fixed top-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] z-0 pointer-events-none hidden md:block"
      />

      {/* ── FIXED CENTER GLOW ── */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] z-0 pointer-events-none"
      />

      {/* ── MOVING GRADIENT MESH ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 80, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-400/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, -80, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-purple-400/15 rounded-full blur-[120px]"
        />
      </div>

      {/* ── FLOATING SOCIAL ICONS ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08]">
        <motion.div 
          animate={{ 
            y: [0, -40, 0], 
            rotate: [0, 15, 0],
            x: (mousePos.x - 1000) / 40,
          }} 
          transition={{ duration: 8, repeat: Infinity }} 
          className="absolute top-[15%] left-[15%] text-blue-900"
        >
          <Video size={120} />
        </motion.div>
        <motion.div 
          animate={{ 
            y: [0, 40, 0], 
            rotate: [0, -15, 0],
            x: (mousePos.x - 1000) / 50,
          }} 
          transition={{ duration: 10, repeat: Infinity }} 
          className="absolute top-[60%] right-[15%] text-purple-900"
        >
          <Music size={100} />
        </motion.div>
      </div>

      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
      
      {/* ── LEFT FLOATING CARD ── */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1, y: [0, -20, 0] }}
        transition={{ x: { duration: 1 }, opacity: { duration: 1 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute left-10 top-1/3 hidden xl:flex items-center gap-4 bg-white/40 backdrop-blur-md border border-white/20 p-4 rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] z-20"
      >
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <Shield size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-blue-950 uppercase tracking-widest">Security</p>
          <p className="text-xs font-bold text-slate-500">100% Encrypted</p>
        </div>
      </motion.div>

      {/* ── RIGHT FLOATING CARD ── */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1, y: [0, 20, 0] }}
        transition={{ x: { duration: 1 }, opacity: { duration: 1 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, delay: 0.2 }}
        className="absolute right-10 top-1/2 hidden xl:flex items-center gap-4 bg-white/40 backdrop-blur-md border border-white/20 p-4 rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] z-20"
      >
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
          <Zap size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-blue-950 uppercase tracking-widest">Speed</p>
          <p className="text-xs font-bold text-slate-500">Instant Turbo</p>
        </div>
      </motion.div>
      {/* ── LIQUID MOUSE FOLLOWER ── */}
      <motion.div 
        className="fixed top-0 left-0 w-8 h-8 bg-blue-600/10 rounded-full blur-xl z-0 pointer-events-none hidden md:block"
        animate={{ x: mousePos.x - 16, y: mousePos.y - 16 }}
        transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
      />

      {/* ── GHOST CURSOR (HIDDEN ON MOBILE) ── */}
      <motion.div animate={ghostControls} className="absolute z-50 pointer-events-none hidden md:flex flex-col items-center" initial={{ x: -200, y: -200 }}>
        <div className="relative">
          <MousePointer2 className="text-blue-600 fill-blue-600 drop-shadow-xl" size={26} />
          <motion.div animate={{ x: [0, 1, -1, 0], y: [0, -1, 1, 0] }} transition={{ duration: 0.1, repeat: Infinity }} className="absolute inset-0" />
          <div className="absolute top-8 left-4 px-2 py-1 bg-white/90 backdrop-blur-sm border border-blue-100 rounded-lg shadow-xl text-[7px] font-bold text-blue-600/60 whitespace-nowrap pointer-events-none">
            Ghost {ghostState === 'clicking' ? 'Analyzing...' : 'Exploring'}
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-5 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] px-4 md:px-5 py-2 rounded-full mb-6 md:mb-10 shadow-sm">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          Production-Ready · Fast · Real-Time
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-7xl font-black text-blue-950 leading-[1.1] tracking-tighter mb-6 md:mb-8">
          Download any video.<br />
          <span className="text-blue-700">Any platform.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-slate-400 max-w-2xl mx-auto mb-14 font-medium">
          Professional media extraction from <span className="text-blue-700 font-bold">{WORDS[wordIdx]}</span> and 1000+ others.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative max-w-3xl mx-auto">
          <div className="relative bg-white/80 backdrop-blur-xl border border-blue-100/50 rounded-[2rem] md:rounded-[2.5rem] p-2 md:p-3 shadow-[0_32px_64px_-16px_rgba(37,99,235,0.12)]">
            <div className="flex flex-col md:flex-row gap-2 md:gap-3 items-center">
              <div className="w-full flex items-center gap-2 md:gap-3 bg-white rounded-2xl md:rounded-[1.8rem] px-3 md:px-6 py-3 md:py-4 border border-slate-100 focus-within:border-blue-400 focus-within:shadow-[0_0_20px_rgba(37,99,235,0.06)] transition-all duration-500 relative overflow-hidden">
                <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                  <Search size={18} className="text-slate-300" />
                  <AnimatePresence>
                    {url && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.5, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5, x: -10 }}
                        onClick={handlePaste}
                        className="md:hidden p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Paste new link"
                      >
                        <ClipboardPaste size={14} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <input 
                  value={url} 
                  onChange={e => setUrl(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && analyze()} 
                  placeholder="Paste video link..." 
                  className="bg-transparent flex-1 text-blue-950 placeholder:text-slate-300 outline-none font-bold text-sm md:text-base pr-28 md:pr-48" 
                />
                
                <div className="absolute right-2 md:right-3 flex items-center gap-1 md:gap-1.5">
                  <AnimatePresence>
                    {!url ? (
                      <motion.button
                        key="paste-right"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={handlePaste}
                        className="flex items-center gap-1 px-2 md:px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all text-[9px] md:text-[10px] font-black uppercase tracking-tight shadow-sm active:scale-95"
                        title="Paste link"
                      >
                        <ClipboardPaste size={14} />
                        <span className="hidden sm:inline">Paste</span>
                      </motion.button>
                    ) : (
                      <>
                        <button
                          onClick={handlePaste}
                          className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-tight shadow-sm active:scale-95"
                          title="Paste link"
                        >
                          <ClipboardPaste size={14} />
                          <span className="hidden sm:inline">Paste</span>
                        </button>
                        
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={handleClear}
                          className="p-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400 transition-colors active:scale-90"
                          title="Clear"
                        >
                          <X size={14} />
                        </motion.button>

                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-center gap-1 px-1.5 md:px-2.5 py-1 bg-blue-600 rounded-lg md:rounded-xl shadow-lg shadow-blue-200"
                        >
                          <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full animate-pulse" />
                          <span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-tight">
                            {url.toLowerCase().includes('youtube') || url.toLowerCase().includes('youtu.be') ? (
                              <><span className="hidden md:inline">YouTube</span><span className="md:hidden">YT</span></>
                            ) : url.toLowerCase().includes('instagram') ? (
                              <><span className="hidden md:inline">Instagram</span><span className="md:hidden">IG</span></>
                            ) : url.toLowerCase().includes('tiktok') ? (
                              <><span className="hidden md:inline">TikTok</span><span className="md:hidden">TT</span></>
                            ) : url.toLowerCase().includes('twitter') || url.toLowerCase().includes('x.com') ? (
                              <><span className="hidden md:inline">X/Twitter</span><span className="md:hidden">X</span></>
                            ) : url.toLowerCase().includes('facebook') ? (
                              <><span className="hidden md:inline">Facebook</span><span className="md:hidden">FB</span></>
                            ) : (
                              <><span className="hidden md:inline">Media</span><span className="md:hidden">...</span></>
                            )}
                          </span>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <motion.button 
                onClick={analyze} 
                disabled={!url.trim() || phase === 'analyzing'} 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full md:w-auto bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-black px-8 md:px-10 py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(29,78,216,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(29,78,216,0.4)] transition-all"
              >
                {phase === 'analyzing' ? <Loader2 size={22} className="animate-spin" /> : <Download size={22} />}
                Analyze
              </motion.button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-6">
               <button 
                 onClick={() => setQuickExtract(!quickExtract)}
                 className="flex items-center gap-3 group cursor-pointer"
               >
                 <div className={`w-12 h-6 rounded-full transition-all duration-500 relative ${quickExtract ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-100'}`}>
                    <motion.div 
                      animate={{ x: quickExtract ? 24 : 2 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${quickExtract ? 'text-blue-600' : 'text-slate-400'}`}>
                    Quick Extract (Turbo)
                 </span>
               </button>
               
               <div className="w-px h-4 bg-slate-100" />
               
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  <Shield size={12} /> Encrypted
               </div>
            </div>

            {phase === 'error' && (
              <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold justify-center">
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}
          </div>
          <SmartAd placement="HERO_BOTTOM" className="mt-12" />
        </motion.div>
      </div>

      {/* ── DOWNLOAD MODAL ── */}
      <AnimatePresence>
        {showModal && metadata && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-blue-950/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[2rem] md:rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(37,99,235,0.25)] border border-blue-100 overflow-hidden max-h-[95vh] flex flex-col">
              <div className="p-5 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-lg md:rounded-xl flex items-center justify-center text-blue-600">
                      <Video size={16} className="md:size-[20px]" />
                    </div>
                    <div>
                      <h3 className="text-xs md:text-sm font-black text-blue-950 uppercase tracking-tight">Media Found</h3>
                      <p className="text-[8px] md:text-[10px] font-black text-blue-700 uppercase tracking-widest">{metadata.platform || 'Detected Platform'}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="w-7 h-7 md:w-8 md:h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-6">
                   <div className="aspect-video bg-blue-100 rounded-xl md:rounded-2xl mb-3 md:mb-4 flex items-center justify-center relative overflow-hidden group">
                      <img src={metadata.thumbnail} alt="Preview" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors" />
                      <Play size={32} className="text-white md:size-[48px] drop-shadow-2xl relative z-10" fill="currentColor" />
                   </div>
                   <p className="text-[11px] md:text-sm font-bold text-blue-950 text-center mb-0.5 truncate px-2">{metadata.title}</p>
                   <p className="text-[8px] md:text-[10px] text-slate-400 text-center font-medium uppercase tracking-tighter">Ready · {(metadata.duration / 60).toFixed(1)} min</p>
                </div>

                {(phase === 'ready' || phase === 'error') && (
                  <div className="space-y-3 md:space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {QUALITIES.map(q => {
                        const isPremium = q === '1080p' || q === '4K';
                        const isDisabled = isPremium && !user;
                        return (
                          <button 
                            key={q} 
                            onClick={() => !isDisabled && setQuality(q)} 
                            className={`relative py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${quality === q ? 'bg-blue-700 text-white shadow-lg shadow-blue-200' : 'bg-white border border-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-700'} ${isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                          >
                            {q}
                            {isDisabled && <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[6px] px-1 rounded-full px-1.5 py-0.5">VIP</span>}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button 
                      onClick={startDownload} 
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 md:py-5 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 shadow-2xl shadow-blue-600/20 transition-all text-xs md:text-sm uppercase tracking-[0.1em]"
                    >
                      <Download size={18} />
                      Download {quality}
                    </button>
                    
                    {user ? (
                      <div className="flex items-center justify-between px-2 text-[8px] md:text-[10px] font-black uppercase tracking-tight">
                        <span className="text-slate-400">Download Cost: 50 Credits</span>
                        <span className="text-blue-700">Balance: {user.credits} CR</span>
                      </div>
                    ) : (
                      <p className="text-[8px] md:text-[10px] text-amber-600 font-bold text-center">Sign in for 1080p, 4K & Unlimited 720p</p>
                    )}
                    
                    {phase === 'error' && <p className="text-[9px] md:text-[10px] text-red-500 font-bold text-center">{errorMsg}</p>}
                  </div>
                )}

                {(phase === 'downloading' || phase === 'done') && (
                  <div className="py-1 md:py-2">
                    <div className="flex justify-between text-[8px] md:text-[10px] font-black text-blue-900 uppercase tracking-widest mb-3 md:mb-4">
                      <span>{phase === 'done' ? '✨ Complete' : '🚀 Processing...'}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2.5 md:h-3 bg-blue-50 rounded-full overflow-hidden shadow-inner p-0.5">
                      <div className="h-full bg-blue-700 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    {phase === 'done' && (
                      <div className="mt-4 md:mt-6 flex gap-2 md:gap-3">
                         <button onClick={() => { setPhase('idle'); setUrl(''); setShowModal(false); setMetadata(null); }} className="flex-1 bg-slate-900 text-white font-black py-3.5 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                           New
                         </button>
                         <a href={`${API_BASE}/download/${jobId}`} download className="flex-1 bg-blue-700 text-white font-black py-3.5 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] uppercase tracking-widest hover:bg-blue-800 transition-all text-center flex items-center justify-center gap-2">
                           <Download size={12} className="md:size-[14px]" /> Save
                         </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-blue-700 py-2 md:py-3 px-8 text-center shrink-0">
                 <p className="text-[8px] md:text-[9px] font-black text-blue-100 uppercase tracking-[0.2em] md:tracking-[0.3em]">No Registration Required · Secure</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
