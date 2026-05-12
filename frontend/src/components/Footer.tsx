'use client';
import Link from 'next/link';
import { Download, Send, Code, Play, ExternalLink, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#efefef] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Top: Logo & Newsletter */}
        <div className="flex flex-col lg:flex-row justify-between gap-16 mb-24">
          <div className="max-w-[400px]">
            <Link href="/" className="flex items-center gap-2 group mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Download size={22} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-[800] tracking-[-0.5px]">
                <span className="text-[#0a0a0a]">Snap</span>
                <span className="text-[#3B82F6]">Load</span>
              </span>
            </Link>
            <p className="text-[15.5px] text-[#888] leading-[1.8] font-medium">
              The premium, fast, and secure way to download your favorite media from across the social web. Built for creators and collectors alike.
            </p>
          </div>

          <div className="w-full lg:w-auto">
            <h4 className="text-[14px] font-[700] text-[#0a0a0a] uppercase tracking-widest mb-6">Get download tips</h4>
            <div className="flex max-w-[400px] h-14 bg-[#f8f8f8] rounded-full p-1 border border-[#efefef] focus-within:border-[#3B82F6] transition-colors">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 bg-transparent border-none outline-none px-6 text-[14px] font-medium text-[#0a0a0a] placeholder:text-[#bbb]"
              />
              <button className="h-full px-6 bg-[#0a0a0a] text-white rounded-full text-[13px] font-[700] hover:bg-[#3B82F6] transition-all flex items-center gap-2">
                Subscribe <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-24">
          <div>
            <h5 className="text-[13px] font-[800] text-[#0a0a0a] uppercase tracking-widest mb-8">Product</h5>
            <ul className="space-y-4">
              {['Features', 'Platforms', 'Batch Download', 'API'].map(item => (
                <li key={item}><Link href="#" className="text-[14px] font-semibold text-[#888] hover:text-[#3B82F6] transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-[13px] font-[800] text-[#0a0a0a] uppercase tracking-widest mb-8">Support</h5>
            <ul className="space-y-4">
              {['FAQ', 'How it works', 'Report issue', 'Contact'].map(item => (
                <li key={item}><Link href="#" className="text-[14px] font-semibold text-[#888] hover:text-[#3B82F6] transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-[13px] font-[800] text-[#0a0a0a] uppercase tracking-widest mb-8">Legal</h5>
            <ul className="space-y-4">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'DMCA'].map(item => (
                <li key={item}><Link href="#" className="text-[14px] font-semibold text-[#888] hover:text-[#3B82F6] transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-[13px] font-[800] text-[#0a0a0a] uppercase tracking-widest mb-8">Follow</h5>
            <ul className="space-y-4">
              {[
                { name: 'Twitter', icon: <Send size={16} /> },
                { name: 'GitHub', icon: <Code size={16} /> },
                { name: 'YouTube', icon: <Play size={16} /> },
                { name: 'ProductHunt', icon: <ExternalLink size={16} /> }
              ].map(item => (
                <li key={item.name}>
                  <Link href="#" className="text-[14px] font-semibold text-[#888] hover:text-[#3B82F6] transition-colors flex items-center gap-2">
                    {item.icon} {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom: Copy & Info */}
        <div className="pt-12 border-t border-[#efefef] flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[12px] font-bold text-[#bbb] uppercase tracking-widest">
            © 2025 SnapLoad. Built with yt-dlp.
          </p>
          <div className="flex items-center gap-8 text-[12px] font-bold text-[#bbb] uppercase tracking-widest">
             <span>For personal use only</span>
             <span className="w-[1px] h-3 bg-[#eee]" />
             <span>Respect copyright laws</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
