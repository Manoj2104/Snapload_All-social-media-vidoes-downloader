'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, ExternalLink, ShieldAlert } from 'lucide-react';

export default function AdsSection() {
  const [isVisible, setIsVisible] = useState(false);

  // Simulation: Only show ads if they "work" (e.g., from an API or env)
  useEffect(() => {
    // In production, you would check if an ad script loaded correctly
    const adsEnabled = true; // Set to false to hide the section
    setIsVisible(adsEnabled);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-20 px-5 bg-white relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto">
          <div className="relative group">
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-white border border-blue-50 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-blue-900/5">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6">
                  <Megaphone size={14} /> Sponsored
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-blue-950 mb-4 leading-tight">
                  Support SnapLoad by visiting our partners.
                </h2>
                <p className="text-slate-500 font-medium mb-8">
                  Ads help us keep our 4K servers running for free. We only show safe, verified premium content.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-blue-200">
                    Visit Sponsor <ExternalLink size={18} />
                  </button>
                  <button className="bg-white border border-slate-100 text-slate-400 font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-all hover:bg-slate-50">
                    Learn More
                  </button>
                </div>
              </div>

              {/* Ad Placeholder Box */}
              <div className="w-full md:w-80 h-64 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 group-hover:border-blue-200 transition-colors">
                <ShieldAlert size={48} className="mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Premium Ad Slot</p>
                <p className="text-[10px] font-medium mt-1">Safe & Verified</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
