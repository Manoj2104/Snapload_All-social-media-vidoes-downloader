'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Shield, Zap, Heart, Globe } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-20"
          >
            <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-black px-5 py-2 rounded-full mb-6 tracking-[0.2em] uppercase">Our Story</span>
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]">
              Built for the <br/><span className="text-blue-600">Archivists.</span>
            </h1>
            <div className="text-lg md:text-2xl text-slate-500 font-medium leading-relaxed space-y-8">
              <p>SnapLoad is born from a simple belief: <span className="text-slate-900 font-bold">Your media should belong to you.</span> In a world of streaming and temporary content, we provide the tools to preserve what matters most.</p>
              <p>Powered by the industry-standard <span className="text-blue-600 font-bold">yt-dlp</span> engine, SnapLoad offers a clean, high-performance interface for high-speed media extraction without the technical overhead.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
            {[
              { icon: <Shield size={24} />, title: 'Privacy First', text: 'We never store your personal data, IP address, or download history. Your activity is completely private.' },
              { icon: <Zap size={24} />, title: 'Pure Speed', text: 'Our cloud extraction engine processes links in milliseconds, delivering direct 4K paths instantly.' },
              { icon: <Heart size={24} />, title: 'Free Forever', text: 'No credit cards, no hidden subscriptions. SnapLoad is a community tool supported by non-intrusive ads.' },
              { icon: <Globe size={24} />, title: 'Global Access', text: 'Support for over 100+ platforms including Instagram, TikTok, YouTube, Twitter, and Facebook.' }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  {item.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">{item.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-blue-600 rounded-[3.5rem] p-10 md:p-20 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6 relative z-10">Join 1M+ users <br/>saving the web.</h2>
            <p className="text-blue-100 text-lg md:text-xl font-medium mb-10 max-w-xl mx-auto relative z-10">Start your first high-speed download today and experience the ultimate video tool.</p>
            <Link href="/" className="inline-block px-12 py-5 bg-white text-blue-700 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all relative z-10">
              Go to Downloader
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
