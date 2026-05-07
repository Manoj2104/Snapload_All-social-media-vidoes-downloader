'use client';
import Link from 'next/link';
import { Download, Send, Code, Play, ArrowRight, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/#features' },
        { label: 'Platforms', href: '/#platforms' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'API Access', href: '#' },
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'FAQ', href: '/faq' },
        { label: 'How it works', href: '/#how-it-works' },
        { label: 'Report Issue', href: '#' },
        { label: 'Contact Us', href: '#' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '#' },
        { label: 'DMCA Notice', href: '#' },
      ]
    }
  ];

  return (
    <footer className="bg-white pt-20 pb-12 px-6 border-t border-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-3 font-black text-2xl mb-8 group">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100 group-hover:scale-110 transition-transform duration-500">
                <Download size={22} strokeWidth={3} />
              </div>
              <span className="text-slate-900 tracking-tighter">Snap</span><span className="text-blue-600 tracking-tighter">Load</span>
            </Link>
            <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10 max-w-sm">
              The world's most advanced social media video downloader. <span className="text-slate-900">Free, fast, and secure.</span>
            </p>
            <div className="flex items-center gap-4">
              {[Send, Globe, Code].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:shadow-xl hover:shadow-blue-100 transition-all duration-500">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-12">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="font-black text-slate-900 mb-8 uppercase tracking-[0.2em] text-[10px]">{col.title}</h4>
                <ul className="space-y-5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-slate-400 hover:text-blue-600 font-bold text-sm transition-all duration-300 flex items-center gap-2 group">
                        <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-slate-50 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">
              © 2025 SnapLoad Dashboard
            </p>
            <div className="flex items-center gap-2 text-slate-300 text-[10px] font-black bg-slate-50 px-4 py-1.5 rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              Powered by yt-dlp Cloud
            </div>
          </div>
          <div className="flex items-center gap-8">
            <p className="text-slate-300 text-xs font-bold uppercase tracking-widest hover:text-slate-900 transition-colors cursor-help">Global Infrastructure</p>
            <p className="text-slate-300 text-xs font-bold uppercase tracking-widest hover:text-slate-900 transition-colors cursor-help">Zero Logs Policy</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
