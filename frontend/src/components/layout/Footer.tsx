'use client';
import Link from 'next/link';
import { Download, Send, Code, Play, ArrowRight } from 'lucide-react';

export default function Footer() {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Platforms', href: '#platforms' },
        { label: 'Batch download', href: '#' },
        { label: 'API Access', href: '#' },
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'FAQ', href: '#faq' },
        { label: 'How it works', href: '#how-it-works' },
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
    <footer className="bg-slate-50 pt-12 md:pt-20 pb-10 px-5 border-t border-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between gap-10 md:gap-16 mb-12 md:mb-20">
          <div className="lg:max-w-xs text-center lg:text-left">
            <Link href="/" className="flex items-center justify-center lg:justify-start gap-2 font-black text-xl md:text-2xl mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-700 rounded-lg md:rounded-xl flex items-center justify-center">
                <Download size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-slate-900">Snap</span><span className="text-blue-700">Load</span>
            </Link>
            <p className="text-slate-500 text-[13px] md:text-sm leading-relaxed mb-6 md:mb-8">
              Fast social media video downloader. Free, clean, and built for everyone.
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-3 md:gap-4">
              {[Send, Code, Play].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 md:w-10 md:h-10 bg-white border border-slate-100 rounded-lg md:rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-700 transition-all shadow-sm">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 md:gap-12 lg:gap-24">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-slate-900 mb-4 md:mb-6 uppercase tracking-widest text-[9px] md:text-[10px]">{col.title}</h4>
                <ul className="space-y-3 md:space-y-4">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-slate-500 hover:text-blue-700 text-xs md:text-sm transition-colors flex items-center gap-1 group">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-200/50 text-center md:text-left">
          <p className="text-slate-400 text-[10px] md:text-xs">
            © 2025 SnapLoad · Built with passion.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <p className="text-slate-400 text-[10px] md:text-xs">Respect copyright laws.</p>
            <div className="flex items-center gap-1 text-slate-400 text-[10px] md:text-xs font-bold bg-slate-100 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              Powered by yt-dlp
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
