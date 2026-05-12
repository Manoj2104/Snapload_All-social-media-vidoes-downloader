'use client';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQS = [
  { 
    q: 'Is SnapLoad free to use?', 
    a: 'Yes, completely. SnapLoad is free forever. We sustain the service through non-intrusive advertising to keep the core tool free for everyone.' 
  },
  { 
    q: 'Do I need to create an account?', 
    a: 'No. SnapLoad is designed to be as easy to use as possible. You don\'t need to sign up, provide an email, or create an account to download videos.' 
  },
  { 
    q: 'What video quality can I download?', 
    a: 'We support everything from 360p to 4K Ultra HD. You can also extract high-quality MP3 audio at up to 320kbps.' 
  },
  { 
    q: 'Does it work on mobile?', 
    a: 'Yes! SnapLoad is fully responsive and works perfectly on iOS, Android, and tablets through any modern mobile browser.' 
  },
  { 
    q: 'Is it safe to use?', 
    a: 'Absolutely. We don\'t require any software installation or extensions. All downloads are processed securely and we never store your personal data.' 
  },
  { 
    q: 'Can I download Instagram Reels?', 
    a: 'Yes, our tool supports Instagram Reels, Stories, and IGTV videos. Just paste the link and hit Analyze.' 
  },
  { 
    q: 'How do I download TikTok without watermark?', 
    a: 'When you paste a TikTok link, SnapLoad automatically identifies the original video file and provides a direct download link without the platform watermark.' 
  },
  { 
    q: 'What formats are supported?', 
    a: 'Most commonly we provide MP4 for video and MP3/M4A for audio. We also support WebM for high-resolution formats when available.' 
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-12 md:py-24 px-5 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 md:mb-16 reveal">
          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">Support</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">Common questions.</h2>
          <p className="text-slate-500 text-sm md:text-lg">Everything you need to know about SnapLoad.</p>
        </div>

        <div className="space-y-3 md:space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
              <div className="border border-slate-100 rounded-xl md:rounded-2xl overflow-hidden bg-white shadow-sm hover:border-blue-200 transition-all">
                <button 
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full px-4 py-4 md:px-6 md:py-5 flex items-center justify-between text-left group"
                >
                  <span className={`font-bold text-sm md:text-base transition-colors ${openIdx === i ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600'}`}>
                    {faq.q}
                  </span>
                  <div className={`shrink-0 transition-all ${openIdx === i ? 'rotate-180 text-blue-700' : 'text-slate-400'}`}>
                    {openIdx === i ? <Minus size={16} className="md:size-[18px]" /> : <Plus size={16} className="md:size-[18px]" />}
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${openIdx === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-4 pb-4 md:px-6 md:pb-6 text-slate-500 text-[13px] md:text-sm leading-relaxed border-t border-slate-50 pt-3 md:pt-4">
                    {faq.a}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
