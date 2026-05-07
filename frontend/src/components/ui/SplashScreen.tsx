'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Zap } from 'lucide-react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show splash for 2 seconds then fade out
    const timer = setTimeout(() => setIsVisible(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.15 }}
            className="absolute w-[600px] h-[600px] bg-blue-600 rounded-full blur-[120px]"
          />

          <div className="relative flex flex-col items-center">
             {/* Logo Animation */}
             <motion.div
               initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
               animate={{ scale: 1, opacity: 1, rotate: 0 }}
               transition={{ 
                 type: "spring",
                 damping: 12,
                 stiffness: 100,
                 duration: 1 
               }}
               className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_20px_50px_-10px_rgba(37,99,235,0.4)] mb-8"
             >
               <Download size={48} strokeWidth={3} />
             </motion.div>

             {/* Brand Name */}
             <motion.div
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.4, duration: 0.6 }}
               className="flex flex-col items-center"
             >
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
                 Snap<span className="text-blue-600">Load</span>
               </h1>
               <div className="flex items-center gap-2">
                  <Zap size={14} className="text-blue-600 animate-pulse" fill="currentColor" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Perfect White Edition</p>
               </div>
             </motion.div>

             {/* Progress Bar (Fake but feels good) */}
             <div className="absolute -bottom-32 w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1/2 h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                />
             </div>
          </div>

          <div className="absolute bottom-12 text-center">
             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Fast · Secure · Unlimited</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
