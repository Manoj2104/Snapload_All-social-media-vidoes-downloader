'use client';
import { useState, useEffect, useRef } from 'react';

interface StatProps {
  end: number;
  suffix: string;
  label: string;
}

function Counter({ end, suffix, label }: StatProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, end]);

  return (
    <div ref={ref} className="text-center p-4 md:p-10 reveal">
      <div className="text-2xl sm:text-3xl md:text-7xl font-black text-blue-700 mb-1 md:mb-2 tracking-tighter drop-shadow-sm">
        {count}{suffix}
      </div>
      <div className="text-blue-900/60 font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-[7px] md:text-[10px] leading-tight">{label}</div>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="py-12 md:py-24 bg-blue-50/50 border-y border-blue-100/50 overflow-hidden relative">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-full h-full dot-grid opacity-30 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <div className="grid grid-cols-3 gap-2 md:gap-0 md:divide-x divide-blue-200/50">
          <Counter end={50} suffix="M+" label="Videos downloaded" />
          <Counter end={1000} suffix="+" label="Platforms supported" />
          <Counter end={4} suffix="K" label="Max resolution" />
        </div>
      </div>
    </section>
  );
}
