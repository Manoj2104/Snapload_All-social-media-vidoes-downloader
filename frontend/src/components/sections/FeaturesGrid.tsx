import { Zap, Shield, Music, Files, Globe, List } from 'lucide-react';

const FEATURES = [
  { icon: Zap,    title: '4K Ultra HD',      desc: 'Download at maximum quality. Supports up to 8K resolution.' },
  { icon: Shield, title: 'No Watermark',     desc: 'Clean file, straight from the source. No overlay, no branding.' },
  { icon: Music,  title: 'Audio Extract',    desc: 'Pull MP3, M4A, or OGG audio at up to 320 kbps.' },
  { icon: Files,  title: 'Batch Download',   desc: 'Paste multiple links. Download all as a ZIP in one click.' },
  { icon: Globe,  title: '1000+ Platforms',  desc: 'YouTube, TikTok, Instagram, Twitter, Reddit, and many more.' },
  { icon: List,   title: 'Playlist Support', desc: 'Grab entire YouTube playlists or channel uploads at once.' },
];

export default function Features() {
  return (
    <section id="features" className="py-12 md:py-24 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16 reveal">
          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">Features</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Everything you need,<br className="hidden md:block" /> nothing you don't.</h2>
          <p className="text-slate-500 text-sm md:text-lg max-w-lg mx-auto leading-relaxed">Built for speed, quality, and simplicity.</p>
        </div>
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto md:overflow-x-visible pb-8 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-5 px-5 md:mx-0 md:px-0">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <div 
              key={title} 
              className="reveal flex-shrink-0 w-[85%] md:w-auto snap-center bg-white border border-slate-200 rounded-2xl p-7 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 transition-all group cursor-default" 
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <div className="w-11 h-11 bg-blue-50 group-hover:bg-blue-700 rounded-xl flex items-center justify-center mb-5 transition-colors">
                <Icon size={20} className="text-blue-700 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
