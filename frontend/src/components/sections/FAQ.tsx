'use client';
import { useState } from 'react';
import { Plus, Minus, HelpCircle, Shield, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  { 
    q: 'How does SnapLoad work?', 
    a: 'SnapLoad uses advanced cloud extraction technology to analyze video URLs and provide direct, high-speed download links in multiple formats and resolutions.',
    icon: <Zap size={18} />
  },
  { 
    q: 'Is it really free for everyone?', 
    a: 'Yes! SnapLoad is committed to being a free tool. We maintain our infrastructure through premium partnerships and minimal, non-intrusive advertisements.',
    icon: <Shield size={18} />
  },
  { 
    q: 'Can I download videos in 4K resolution?', 
    a: 'Absolutely. If the source video supports 4K, SnapLoad will provide an option to download it in original Ultra HD quality without any compression.',
    icon: <Globe size={18} />
  },
  { 
    q: 'Do I need to install any software?', 
    a: 'No installation is required. SnapLoad is a cloud-based web application that works directly in your browser on any device, including mobile and desktop.',
    icon: <HelpCircle size={18} />
  },
  { 
    q: 'Which platforms are currently supported?', 
    a: 'We currently support Instagram (Reels, Stories, IGTV), TikTok (without watermark), YouTube, Twitter, and Facebook. More platforms are being added monthly.',
    icon: <Zap size={18} />
  },
  { 
    q: 'Is my data secure while using SnapLoad?', 
    a: 'Security is our priority. We do not store your personal information, download history, or account details. All extraction processes are encrypted and private.',
    icon: <Shield size={18} />
  }
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-20 md:py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-black px-5 py-2 rounded-full mb-6 tracking-[0.2em] uppercase">Knowledge Base</span>
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6">Common Questions.</h1>
          <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto font-medium">Everything you need to know about the world's fastest video downloader.</p>
        </motion.div>

        <div className="grid gap-4 md:gap-6">
          {FAQS.map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className={`border transition-all duration-300 rounded-[2rem] overflow-hidden ${openIdx === i ? 'border-blue-100 bg-blue-50/30 shadow-xl shadow-blue-50/50' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                <button 
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full px-6 py-6 md:px-10 md:py-8 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all ${openIdx === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400'}`}>
                      {faq.icon}
                    </div>
                    <span className={`font-black text-sm md:text-xl tracking-tight transition-colors ${openIdx === i ? 'text-blue-900' : 'text-slate-700 group-hover:text-blue-600'}`}>
                      {faq.q}
                    </span>
                  </div>
                  <div className={`shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all ${openIdx === i ? 'bg-blue-100 text-blue-600 rotate-180' : 'bg-slate-50 text-slate-300'}`}>
                    {openIdx === i ? <Minus size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                  </div>
                </button>
                
                <AnimatePresence mode="wait">
                  {openIdx === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-8 md:px-28 md:pb-12 text-slate-500 text-sm md:text-lg font-medium leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 text-center p-10 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200"
        >
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Still have questions?</p>
          <button className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
            Contact Support
          </button>
        </motion.div>
      </div>
    </section>
  );
}
