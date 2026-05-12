'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ADS_CONFIG } from '@/config/ads';
import { Megaphone, ExternalLink, ShieldCheck } from 'lucide-react';

interface SmartAdProps {
  placement: keyof typeof ADS_CONFIG.PLACEMENTS;
  className?: string;
  variant?: 'banner' | 'card' | 'inline';
}

export default function SmartAd({ placement, className = "", variant = 'banner' }: SmartAdProps) {
  // Global check: If ads are disabled or this specific placement is off, render NOTHING.
  if (!ADS_CONFIG.ENABLED || !ADS_CONFIG.PLACEMENTS[placement]) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full max-w-6xl mx-auto px-5 my-12 ${className}`}
      >
        <div className="relative group">
          {/* Subtle Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[2rem] blur group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all duration-500" />
          
          <div className="relative bg-white/70 backdrop-blur-md border border-blue-100/50 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-blue-900/5 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <Megaphone size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Verified Sponsor</span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-black text-blue-950 mb-3 tracking-tight">
                  Premium High-Speed Servers
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xl">
                  Support the project by visiting our partner. No trackers, no popups. Just pure 4K speed infrastructure.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button className="whitespace-nowrap bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200">
                  Try Fast Servers <ExternalLink size={18} />
                </button>
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-bold uppercase">AdSafe Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
