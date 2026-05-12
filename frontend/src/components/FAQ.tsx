'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import AdSlot from './AdSlot';
import { cn } from '@/lib/utils';

const faqs = [
  { q: "Is SnapLoad completely free?", a: "Yes! SnapLoad is 100% free to use. We support the site through minimal, non-intrusive advertisements." },
  { q: "Do I need to install any software or extensions?", a: "No, SnapLoad is a web-based tool. You don't need to install any apps or browser extensions to use it." },
  { q: "Can I download 4K videos?", a: "Absolutely. If the original video is available in 4K resolution, SnapLoad will give you the option to download it in 4K." },
  { q: "Are the downloaded videos safe?", a: "Yes, we directly extract the video from the source platform's servers. We don't modify the files or add any malware or watermarks." },
  { q: "Where are the videos saved on my device?", a: "By default, videos are saved in your browser's designated 'Downloads' folder. You can usually access this by pressing Ctrl+J (Windows) or Cmd+Option+L (Mac)." },
  { q: "Does SnapLoad support playlist downloads?", a: "Yes, we are currently rolling out batch download features. You can paste a playlist link and choose specific videos to download." },
  { q: "Can I convert videos to MP3?", a: "Yes, our tool allows you to extract high-quality audio in MP3, M4A, and OGG formats with customizable bitrates." },
  { q: "Is there a limit on the number of downloads?", a: "No, you can download as many videos as you want. There are no daily or monthly limits." }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[720px] mx-auto px-6">
        <h2 className="text-3xl md:text-[42px] font-[900] text-[#0a0a0a] tracking-tight text-center mb-16">
          Got questions? We got answers.
        </h2>

        <div className="flex flex-col">
          {faqs.map((faq, i) => (
            <div key={i}>
              <div className="border-b border-[#efefef] last:border-none">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full py-7 flex items-center justify-between text-left group"
                >
                  <span className={cn(
                    "text-[16px] md:text-[18px] font-[700] transition-colors duration-300",
                    openIndex === i ? "text-[#3B82F6]" : "text-[#0a0a0a] group-hover:text-[#3B82F6]"
                  )}>
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === i ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className={cn(
                      "w-6 h-6 flex items-center justify-center transition-colors",
                      openIndex === i ? "text-[#3B82F6]" : "text-[#aaa]"
                    )}
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="text-[15px] md:text-[16px] text-[#888] leading-[1.85] pb-7 font-medium">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {i === 3 && (
                <div className="py-8">
                  <AdSlot type="rectangle" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
