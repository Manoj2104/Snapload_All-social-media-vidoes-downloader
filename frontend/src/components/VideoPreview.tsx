'use client';
import { Clock, Eye, User, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoPreviewProps {
  data: {
    title: string;
    thumbnail: string;
    duration: number;
    channel: string;
    views: number;
    platform: string;
  };
}

export default function VideoPreview({ data }: VideoPreviewProps) {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[24px] overflow-hidden border border-[#efefef] flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div className="relative w-full aspect-video bg-[#f8f8f8]">
        {data.thumbnail && (
          <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute bottom-4 right-4 bg-[#0a0a0a]/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-bold text-white tracking-wider">
          {formatDuration(data.duration)}
        </div>
      </div>
      
      <div className="p-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <h3 className="text-[18px] font-[800] text-[#0a0a0a] line-clamp-2 leading-tight tracking-tight">
            {data.title}
          </h3>
          <span className="shrink-0 px-3 py-1 bg-[#f0f7ff] text-[#3B82F6] rounded-full text-[11px] font-[800] uppercase tracking-widest border border-[#bfdbfe]">
            {data.platform}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-y-4">
          <div className="flex items-center gap-2.5 text-[13px] font-bold text-[#888]">
            <User size={16} className="text-[#3B82F6]" />
            <span className="truncate">{data.channel}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] font-bold text-[#888]">
            <Eye size={16} className="text-[#3B82F6]" />
            <span>{formatViews(data.views)} views</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#f5f5f5] flex items-center justify-between">
           <div className="flex items-center gap-2 text-[12px] font-bold text-[#bbb] uppercase tracking-widest">
              <Share2 size={14} />
              <span>Shareable link</span>
           </div>
           <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}
