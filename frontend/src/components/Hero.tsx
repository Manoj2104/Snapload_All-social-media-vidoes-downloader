'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/dist/TextPlugin';
import { Search, MousePointer2, CheckCircle2 } from 'lucide-react';
import { detectPlatform } from '../lib/detectPlatform';
import { cn } from '@/lib/utils';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(TextPlugin);
}

export default function Hero({ onAnalyze, isLoading }: { onAnalyze: (url: string) => void, isLoading: boolean }) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const typingRef = useRef<HTMLSpanElement>(null);
  
  const platforms = [
    { name: 'YouTube', color: '#FF0000' },
    { name: 'Instagram', color: '#E4405F' },
    { name: 'TikTok', color: '#000000' },
    { name: 'Twitter/X', color: '#1DA1F2' },
    { name: 'Facebook', color: '#1877F2' },
    { name: 'Reddit', color: '#FF4500' },
    { name: 'LinkedIn', color: '#0A66C2' },
    { name: 'Pinterest', color: '#BD081C' },
    { name: 'Vimeo', color: '#1AB7EA' }
  ];

  useEffect(() => {
    if (!typingRef.current) return;

    const words = platforms.map(p => p.name);
    let masterTl = gsap.timeline({ repeat: -1 });

    words.forEach(word => {
      let tl = gsap.timeline({ repeat: 1, yoyo: true, repeatDelay: 2 });
      tl.to(typingRef.current, { duration: word.length * 0.09, text: word, ease: "none" });
      masterTl.add(tl);
    });
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    const detected = detectPlatform(val);
    setPlatform(detected !== 'unknown' ? detected : null);
  };

  return (
    <section className="relative min-h-[110vh] flex flex-col items-center justify-center pt-20 overflow-hidden bg-white">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[#3B82F6]/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-5xl mx-auto px-6 text-center z-10">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#f0f7ff] border border-[#bfdbfe] mb-10 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse-custom" />
          <span className="text-[12px] font-semibold text-[#3B82F6] uppercase tracking-wider">
            50M+ videos downloaded · 8 platforms · 4K quality
          </span>
        </motion.div>

        {/* H1 Headline */}
        <h1 className="flex flex-col items-center mb-8">
          <motion.span
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(56px,9vw,108px)] font-[900] text-[#0a0a0a] tracking-[-4px] leading-[0.95]"
          >
            Universal
          </motion.span>
          <motion.span
            initial={{ clipPath: 'inset(0 100% 0 0)', letterSpacing: '-6px' }}
            animate={{ clipPath: 'inset(0 0% 0 0)', letterSpacing: '-4px' }}
            transition={{ delay: 0.65, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(56px,9vw,108px)] font-[900] text-[#3B82F6] tracking-[-4px] leading-[0.95]"
          >
            Downloader
          </motion.span>
        </h1>

        {/* Typing Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="flex items-center justify-center gap-1.5 mb-6 text-[18px] font-medium"
        >
          <span className="text-[#666]">Download from </span>
          <span ref={typingRef} className="text-[#3B82F6] font-bold inline-block min-w-[120px] text-left" />
          <span className="w-[2px] h-[22px] bg-[#3B82F6] animate-[blink_0.8s_step-end_infinite]" />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="text-[16px] text-[#888] leading-[1.8] max-w-[480px] mx-auto mb-12 font-medium"
        >
          Download high-quality videos and audio from 1000+ platforms. 
          Free forever. No account needed.
        </motion.p>

        {/* URL Input Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="w-full max-w-[680px] mx-auto mb-8"
        >
          <div className={cn(
            "h-16 flex items-center bg-white rounded-full border-[1.5px] border-[#e0e0e0] shadow-[0_4px_24px_rgba(0,0,0,0.06)] px-2 pr-2 pl-6 transition-all duration-300 focus-within:border-[#3B82F6] focus-within:ring-[4px] focus-within:ring-blue-500/10",
            isLoading && "opacity-70 pointer-events-none"
          )}>
            <Search size={18} className="text-[#aaa] shrink-0" />
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              placeholder="Paste link here..."
              className="flex-1 h-full bg-transparent border-none outline-none text-[15px] text-[#0a0a0a] placeholder:text-[#bbb] px-4"
            />
            
            {platform && (
              <div className="hidden sm:flex items-center gap-1.5 text-[#3B82F6] text-[13px] font-bold mr-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <CheckCircle2 size={14} />
                <span>{platform.charAt(0).toUpperCase() + platform.slice(1)} detected</span>
              </div>
            )}

            <button
              onClick={() => onAnalyze(url)}
              disabled={!url || isLoading}
              className="h-[48px] px-8 bg-[#3B82F6] text-white rounded-full text-[15px] font-[600] transition-all duration-200 hover:bg-[#2563EB] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Download'}
            </button>
          </div>
        </motion.div>

        {/* Quick Pills */}
        <div className="flex flex-col items-center gap-4 overflow-hidden py-2">
           <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="text-[12px] text-[#bbb] font-bold uppercase tracking-widest"
          >
            Also works with:
          </motion.span>
          <div className="flex items-center gap-3 no-scrollbar overflow-x-auto max-w-full px-4 pb-2">
            {platforms.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.7 + i * 0.04, duration: 0.4 }}
                className="shrink-0 flex items-center gap-2 px-[14px] py-[6px] rounded-full bg-[#f5f5f5] text-[12px] font-[600] text-[#555] border border-transparent hover:bg-[#f0f7ff] hover:text-[#3B82F6] hover:border-[#3B82F6]/10 hover:-translate-y-[2px] transition-all cursor-default group"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <div className="w-5 h-8 rounded-full border-2 border-[#eee] relative flex justify-center p-1">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 bg-[#ccc] rounded-full"
          />
        </div>
        <span className="text-[11px] font-bold text-[#bbb] uppercase tracking-[0.2em] pointer-events-none">
          Scroll to explore
        </span>
      </motion.div>

      <style jsx global>{`
        @keyframes blink {
          from, to { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}
