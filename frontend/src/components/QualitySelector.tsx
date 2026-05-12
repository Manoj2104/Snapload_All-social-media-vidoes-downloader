'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Music, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QualitySelectorProps {
  formats: any[];
  onSelect: (format: string, quality: string) => void;
}

export default function QualitySelector({ formats: _formats, onSelect }: QualitySelectorProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

  const videoQualities = [
    { label: '4K Ultra HD', value: '4K', res: '3840x2160' },
    { label: '1080p Full HD', value: '1080p', res: '1920x1080' },
    { label: '720p HD', value: '720p', res: '1280x720' },
    { label: '480p Standard', value: '480p', res: '854x480' },
    { label: '360p Low', value: '360p', res: '640x360' }
  ];
  
  return (
    <div className="bg-white rounded-[24px] p-8 border border-[#efefef] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex bg-[#f8f8f8] p-1.5 rounded-2xl mb-8">
        <button
          onClick={() => setActiveTab('video')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-[800] uppercase tracking-widest transition-all",
            activeTab === 'video' ? "bg-white text-[#3B82F6] shadow-sm" : "text-[#888] hover:text-[#0a0a0a]"
          )}
        >
          <Video size={16} /> Video
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-[800] uppercase tracking-widest transition-all",
            activeTab === 'audio' ? "bg-white text-[#3B82F6] shadow-sm" : "text-[#888] hover:text-[#0a0a0a]"
          )}
        >
          <Music size={16} /> Audio
        </button>
      </div>

      <div className="space-y-3">
        {activeTab === 'video' ? (
          videoQualities.map((q, i) => (
            <motion.button
              key={q.value}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect('video', q.value)}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-[#fafafa] border border-[#efefef] hover:border-[#3B82F6]/30 hover:bg-white hover:shadow-md transition-all group"
            >
              <div className="flex flex-col items-start">
                <span className="text-[14px] font-[800] text-[#0a0a0a]">{q.label}</span>
                <span className="text-[11px] font-bold text-[#bbb] uppercase tracking-widest mt-1">{q.res} · MP4</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white border border-[#efefef] flex items-center justify-center text-[#3B82F6] group-hover:bg-[#3B82F6] group-hover:text-white transition-all">
                <Download size={18} strokeWidth={2.5} />
              </div>
            </motion.button>
          ))
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onSelect('audio', 'best')}
            className="w-full flex items-center justify-between p-6 rounded-2xl bg-[#fafafa] border border-[#efefef] hover:border-[#3B82F6]/30 hover:bg-white hover:shadow-md transition-all group"
          >
            <div className="flex flex-col items-start">
              <span className="text-[15px] font-[800] text-[#0a0a0a]">High Quality Audio (Lossless)</span>
              <span className="text-[11px] font-bold text-[#bbb] uppercase tracking-widest mt-1">320kbps · MP3 / M4A</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-white border border-[#efefef] flex items-center justify-center text-[#3B82F6] group-hover:bg-[#3B82F6] group-hover:text-white transition-all">
              <Download size={22} strokeWidth={2.5} />
            </div>
          </motion.button>
        )}
      </div>

      <p className="mt-8 text-[11px] font-bold text-[#ccc] uppercase tracking-widest text-center">
        No limits on file size or duration
      </p>
    </div>
  );
}
