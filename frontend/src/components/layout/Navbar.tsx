'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-blue-100 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-2xl group">
            <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-200">
              <Download size={20} className="text-white" strokeWidth={3} />
            </div>
            <span className="text-blue-950">Snap</span>
            <span className="text-blue-600">Load</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-10">
            {['Features','Platforms','FAQ','About'].map(l => (
              <Link key={l} href={l === 'About' ? '/about' : l === 'FAQ' ? '/faq' : `#${l.toLowerCase()}`}
                className="text-slate-400 hover:text-blue-700 text-sm font-bold transition-all hover:-translate-y-0.5 tracking-tight">
                {l}
              </Link>
            ))}
            <Link href="#hero-input" className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-black px-7 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-200">
              Try Free
            </Link>
          </div>
          
          <button className="md:hidden p-2 text-slate-900" onClick={() => setOpen(v => !v)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="fixed inset-0 z-40 bg-white pt-24 flex flex-col items-center">
          {['Features','Platforms','FAQ','About'].map(l => (
            <Link key={l} href={l === 'About' ? '/about' : `#${l.toLowerCase()}`}
              onClick={() => setOpen(false)}
              className="px-8 py-6 text-3xl font-black border-b border-slate-100 text-slate-900 w-full text-center">
              {l}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
