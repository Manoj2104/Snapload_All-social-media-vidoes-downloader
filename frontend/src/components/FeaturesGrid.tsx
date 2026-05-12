'use client';
import { motion } from 'framer-motion';
import { Monitor, Zap, ShieldCheck, Music, Files, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FeaturesGrid() {
  const features = [
    {
      icon: <Monitor size={20} />,
      title: "4K Ultra HD",
      desc: "Download at maximum platform quality, supporting up to 8K resolutions.",
      tag: "Up to 4K UHD"
    },
    {
      icon: <ShieldCheck size={20} />,
      title: "No Watermark",
      desc: "Get clean files exactly as they were uploaded to the original platform.",
      tag: "100% Clean"
    },
    {
      icon: <Music size={20} />,
      title: "Audio Extractor",
      desc: "Convert any video into high-bitrate MP3, M4A, or OGG in one click.",
      tag: "320kbps MP3"
    },
    {
      icon: <Files size={20} />,
      title: "Batch Download",
      desc: "Queue multiple URLs simultaneously and get them all in a single ZIP.",
      tag: "ZIP Export"
    },
    {
      icon: <List size={20} />,
      title: "Playlist Grab",
      desc: "Download entire YouTube or Spotify playlists with intelligent indexing.",
      tag: "Full Series"
    },
    {
      icon: <Zap size={20} />,
      title: "Subtitle Export",
      desc: "Automatically extract and download .srt or .vtt files alongside videos.",
      tag: "SRT/VTT"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-[42px] font-[900] text-[#0a0a0a] tracking-tight mb-4"
          >
            Power packed features.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#888] text-[18px] font-medium"
          >
            Everything you need for a perfect download experience.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 bg-[#efefef] gap-[1px] border border-[#efefef] rounded-[24px] overflow-hidden shadow-2xl shadow-black/[0.02]">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white p-10 hover:bg-[#fafeff] transition-all duration-300 group relative"
            >
              <div className="absolute inset-0 border border-transparent group-hover:border-[#bfdbfe] transition-colors pointer-events-none" />
              
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                {f.icon}
              </div>
              
              <h3 className="text-[15px] font-[700] text-[#0a0a0a] mt-6">
                {f.title}
              </h3>
              
              <p className="text-[13.5px] text-[#888] leading-[1.65] mt-3 font-medium">
                {f.desc}
              </p>
              
              <div className="mt-6">
                <span className="px-3 py-1 rounded-full bg-[#f5f5f5] text-[11px] font-[700] text-[#666] uppercase tracking-wider group-hover:bg-[#3B82F6] group-hover:text-white transition-colors">
                  {f.tag}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
