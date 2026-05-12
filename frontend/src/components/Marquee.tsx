'use client';
import { motion } from 'framer-motion';

const Row = ({ items, direction, duration }: { items: any[], direction: 'left' | 'right', duration: number }) => {
  return (
    <div className="flex overflow-hidden marquee-container group py-4">
      <motion.div
        animate={{ x: direction === 'left' ? [0, -1920] : [-1920, 0] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
        className="flex shrink-0 items-center gap-6 pr-6 group-hover:[animation-play-state:paused]"
      >
        {[...items, ...items, ...items].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-[#efefef] shadow-sm hover:border-[#3B82F6]/30 hover:bg-[#fafeff] transition-all"
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[14px] font-[600] text-[#0a0a0a] whitespace-nowrap">{item.name}</span>
            <span className="w-[1px] h-3 bg-[#eee]" />
            <span className="text-[12px] font-bold text-[#888] uppercase">{item.category}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default function Marquee() {
  const row1 = [
    { name: 'YouTube', color: '#FF0000', category: 'Video' },
    { name: 'Instagram', color: '#E4405F', category: 'Reels' },
    { name: 'TikTok', color: '#000000', category: 'Shorts' },
    { name: 'Twitter/X', color: '#1DA1F2', category: 'Clips' },
    { name: 'Facebook', color: '#1877F2', category: 'Watch' },
  ];

  const row2 = [
    { name: 'Reddit', color: '#FF4500', category: 'Viral' },
    { name: 'LinkedIn', color: '#0A66C2', category: 'Professional' },
    { name: 'Pinterest', color: '#BD081C', category: 'Ideas' },
    { name: 'Vimeo', color: '#1AB7EA', category: 'Quality' },
    { name: 'Dailymotion', color: '#0066DC', category: 'Streams' },
  ];

  return (
    <div className="bg-[#fafafa] border-y border-[#efefef] py-12">
      <Row items={row1} direction="left" duration={30} />
      <Row items={row2} direction="right" duration={25} />
    </div>
  );
}
