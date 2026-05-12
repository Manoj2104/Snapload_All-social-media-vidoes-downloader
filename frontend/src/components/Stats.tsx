'use client';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const StatItem = ({ value, suffix, label }: { value: number, suffix: string, label: string }) => {
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!countRef.current) return;

    gsap.fromTo(countRef.current, 
      { innerText: '0' },
      {
        innerText: value,
        duration: 2.5,
        ease: 'power2.out',
        snap: { innerText: 1 },
        scrollTrigger: {
          trigger: countRef.current,
          start: 'top 90%',
          toggleActions: 'play none none none',
        }
      }
    );
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white group border-r last:border-none border-[#efefef]">
      <div className="flex items-baseline gap-1">
        <span 
          ref={countRef} 
          className="text-5xl md:text-[64px] font-[900] text-[#0a0a0a] tracking-[-2px] tabular-nums"
        >
          0
        </span>
        <span className="text-4xl md:text-[56px] font-[900] text-[#0a0a0a] tracking-[-2px]">{suffix}</span>
      </div>
      <p className="text-[14px] text-[#888] font-[600] mt-4 uppercase tracking-widest group-hover:text-[#3B82F6] transition-colors">
        {label}
      </p>
    </div>
  );
};

export default function Stats() {
  return (
    <section className="bg-white border-y border-[#efefef]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3">
        <StatItem value={50} suffix="M+" label="Videos Downloaded" />
        <StatItem value={1000} suffix="+" label="Platforms Supported" />
        <StatItem value={4} suffix="K" label="Maximum Resolution" />
      </div>
    </section>
  );
}
