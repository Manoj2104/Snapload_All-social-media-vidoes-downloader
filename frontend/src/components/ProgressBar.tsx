'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ProgressBar({ progress, status }: { progress: number, status: string }) {
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <div className="bg-white rounded-[24px] p-10 border border-[#efefef] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full relative overflow-hidden">
      <div className={cn(
        "absolute top-0 left-0 w-full h-1.5 bg-gray-100",
        isFailed && "bg-red-100"
      )}>
        <motion.div 
          className={cn(
            "h-full bg-[#3B82F6]",
            isFailed && "bg-red-500"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'linear', duration: 0.5 }}
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-[#0a0a0a] font-[900] text-[24px] mb-2 tracking-tight">
            {isCompleted ? "Download Complete!" : isFailed ? "Download Failed" : "Processing your file..."}
          </h3>
          <p className="text-[13px] font-[700] text-[#888] uppercase tracking-widest">
            {isCompleted ? "Your file is ready for download" : isFailed ? "Please try a different URL" : "High-speed conversion in progress"}
          </p>
        </div>
        
        <div className="flex flex-col items-center md:items-end">
          <span className={cn(
            "text-[56px] font-[900] tracking-[-2px] leading-none",
            isFailed ? "text-red-500" : "text-[#3B82F6]"
          )}>
            {Math.round(progress)}<span className="text-[24px] ml-1">%</span>
          </span>
          {!isCompleted && !isFailed && (
             <div className="flex gap-1.5 mt-4">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"
                  />
                ))}
             </div>
          )}
        </div>
      </div>

      <div className="mt-10 h-3 w-full bg-[#f5f5f5] rounded-full overflow-hidden border border-[#efefef]">
        <motion.div 
          className={cn(
            "h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] shadow-[0_0_15px_rgba(59,130,246,0.3)]",
            isFailed && "from-red-500 to-red-400"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'linear', duration: 0.5 }}
        />
      </div>

      <div className="mt-8 flex justify-between items-center">
         <span className="text-[11px] font-[800] text-[#bbb] uppercase tracking-widest">
            {isCompleted ? "Server cleanup in 1 hour" : "Optimizing bitrate"}
         </span>
         {isCompleted && (
           <div className="flex items-center gap-2 text-[11px] font-[800] text-[#1D9E75] uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
              Verified Safe
           </div>
         )}
      </div>
    </div>
  );
}
