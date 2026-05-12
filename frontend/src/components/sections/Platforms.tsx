'use client';
import { Check } from 'lucide-react';

const PLATFORMS = [
  'YouTube', 'Instagram', 'TikTok', 'Twitter/X', 'Facebook', 'Reddit',
  'LinkedIn', 'Pinterest', 'Vimeo', 'Dailymotion', 'Twitch', 'Bilibili',
  'Rumble', 'Odysee'
];

export default function Platforms() {
  return (
    <section id="platforms" className="py-12 md:py-24 px-5 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 reveal-left">
            <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">Compatibility</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Works everywhere you watch.</h2>
            <p className="text-slate-500 text-sm md:text-lg mb-6 leading-relaxed">
              SnapLoad supports a vast array of social media and video hosting platforms.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {['No software needed', 'Works on Mobile', '4K Support', 'Fast processing'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-slate-700 font-semibold">
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <Check size={10} className="text-green-600 md:size-[12px]" />
                  </div>
                  <span className="text-[11px] md:text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-1/2 reveal-right">
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center lg:justify-start">
              {PLATFORMS.map((p, i) => (
                <div 
                  key={p} 
                  className="bg-white border border-slate-100 px-3 md:px-5 py-1.5 md:py-3 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-default group"
                  style={{ transitionDelay: `${i * 0.05}s` }}
                >
                  <span className="text-[10px] md:text-sm font-bold text-slate-600 group-hover:text-blue-700 transition-colors">{p}</span>
                </div>
              ))}
              <div className="bg-blue-700 px-4 md:px-5 py-1.5 md:py-3 rounded-xl md:rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center">
                <span className="text-[10px] md:text-sm font-bold text-white">+1000 more</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
