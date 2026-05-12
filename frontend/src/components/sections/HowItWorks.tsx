'use client';
import { Link2, Layers, Download } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: Link2,
    title: 'Paste the URL',
    desc: 'Copy any video link from YouTube, Instagram, TikTok, or 1000+ other sites and paste it into SnapLoad.',
  },
  {
    num: '02',
    icon: Layers,
    title: 'Pick quality',
    desc: 'Choose from 4K, 1080p, 720p, 480p video — or extract pure MP3 audio at high bitrate.',
  },
  {
    num: '03',
    icon: Download,
    title: 'Download instantly',
    desc: 'Get a clean file with no watermark, no re-encoding. Exactly as the platform serves it.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-12 md:py-24 px-5 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 reveal">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">Process</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Three steps. Done.</h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">The simplest way to save your favorite media offline.</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 md:gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-blue-100 -translate-y-1/2 z-0" />
          
          {STEPS.map((step, i) => (
            <div key={step.num} className="reveal relative z-10 group" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="bg-white border-[1px] md:border-2 border-white group-hover:border-blue-100 rounded-2xl md:rounded-3xl p-3 md:p-8 shadow-xl shadow-slate-200/50 transition-all text-center h-full flex flex-col justify-center">
                <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-700 rounded-lg md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-6 shadow-lg shadow-blue-200 text-white relative">
                  <step.icon size={18} className="md:size-[28px]" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 md:w-8 md:h-8 bg-blue-900 rounded-full flex items-center justify-center text-[8px] md:text-xs font-bold ring-2 md:ring-4 ring-white">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-[10px] md:text-xl font-black text-slate-900 mb-1 md:mb-3 leading-tight">{step.title}</h3>
                <p className="text-[8px] md:text-sm text-slate-500 leading-tight md:leading-relaxed hidden sm:block md:block">{step.desc}</p>
                <p className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter sm:hidden">Tap to view</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
