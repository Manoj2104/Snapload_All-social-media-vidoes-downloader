'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'History', href: '/history' },
    { name: 'FAQ', href: '/faq' },
    { name: 'About', href: '/about' },
  ];

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-[100] transition-all duration-300 h-20 flex items-center',
          isScrolled 
            ? 'bg-white/95 backdrop-blur-xl border-b border-[#e8e8e8] shadow-none' 
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-[#3B82F6] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Download size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-[800] tracking-[-0.5px]">
              <span className={cn(isScrolled ? 'text-[#0a0a0a]' : 'text-white')}>Snap</span>
              <span className="text-[#3B82F6]">Load</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'text-[13px] font-medium transition-all duration-200 relative group py-2',
                  isScrolled ? 'text-[#666] hover:text-[#0a0a0a]' : 'text-white/80 hover:text-white'
                )}
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#3B82F6] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200" />
              </Link>
            ))}
            <Link
              href="/"
              className="bg-[#0a0a0a] text-white text-[14px] font-medium px-[22px] py-[9px] rounded-full hover:bg-[#3B82F6] hover:-translate-y-[1px] transition-all duration-200 shadow-md active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className={cn('md:hidden p-2', isScrolled ? 'text-[#0a0a0a]' : 'text-white')}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[110] bg-white flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="text-xl font-[800] tracking-[-0.5px]">
                <span className="text-[#0a0a0a]">Snap</span>
                <span className="text-[#3B82F6]">Load</span>
              </span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#0a0a0a] p-2">
                <X size={28} />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-4xl font-bold text-[#0a0a0a] hover:text-[#3B82F6] transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <Link
                  href="/"
                  className="inline-block bg-[#0a0a0a] text-white text-lg font-bold px-10 py-4 rounded-full"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
