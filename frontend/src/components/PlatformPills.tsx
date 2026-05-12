'use client';
import { motion } from 'framer-motion';

const platforms = [
  'YouTube', 'Instagram', 'TikTok', 'Twitter', 'Facebook', 
  'LinkedIn', 'Reddit', 'Pinterest', 'Vimeo', 'Dailymotion'
];

export default function PlatformPills() {
  return (
    <div className="flex flex-wrap justify-center gap-3 my-8">
      {platforms.map((platform, i) => (
        <motion.div
          key={platform}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="px-5 py-2 rounded-full bg-white shadow-sm border border-gray-200 text-sm font-semibold text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all cursor-default"
        >
          {platform}
        </motion.div>
      ))}
    </div>
  );
}
