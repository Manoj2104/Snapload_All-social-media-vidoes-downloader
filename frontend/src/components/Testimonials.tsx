'use client';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "Finally a downloader that actually works for Instagram Reels. No watermark, 1080p quality. Bookmarked.",
    author: "Priya K.",
    role: "Content Creator"
  },
  {
    quote: "I download YouTube lectures for offline study. This is the fastest tool I've used.",
    author: "Rahul M.",
    role: "Engineering Student"
  },
  {
    quote: "Batch download saved me hours. Downloaded an entire playlist as a ZIP.",
    author: "Anjali S.",
    role: "Educator"
  },
  {
    quote: "The only site that handles 4K video properly without crashing. Highly recommended.",
    author: "David L.",
    role: "Video Editor"
  },
  {
    quote: "Clean, fast, and no account needed. Exactly what I was looking for.",
    author: "Sarah W.",
    role: "Social Media Manager"
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-[#fafafa] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-[900] text-[#0a0a0a] tracking-tight text-center"
        >
          Trusted by millions worldwide.
        </motion.h2>
      </div>

      <div className="flex gap-6 marquee-container group relative">
        <motion.div
          animate={{ x: [0, -1800] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="flex shrink-0 items-center gap-6 group-hover:[animation-play-state:paused]"
        >
          {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
            <div
              key={i}
              className="w-[400px] shrink-0 bg-white p-8 rounded-[24px] border border-[#e8e8e8] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-[#3B82F6]/20 transition-all group/card"
            >
              <div className="flex gap-1 mb-6 text-[#3B82F6]">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-xl">★</span>
                ))}
              </div>
              <p className="text-[15.5px] text-[#0a0a0a] leading-[1.75] font-medium mb-8">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center font-bold text-sm">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-[14px] font-[700] text-[#0a0a0a]">{t.author}</h4>
                  <p className="text-[12px] text-[#888] font-bold uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
