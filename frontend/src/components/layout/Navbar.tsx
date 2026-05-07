'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Menu, X, User as UserIcon, LogOut, CreditCard, Play, Shield, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthModals from '@/components/auth/AuthModals';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  const { user, logout } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
    setOpen(false);
  };

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
          
          <div className="hidden md:flex items-center gap-8">
            {['Pricing', 'FAQ', 'About'].map(l => (
              <Link key={l} href={l === 'About' ? '/about' : l === 'FAQ' ? '/faq' : '/pricing'}
                className="text-slate-400 hover:text-blue-700 text-sm font-bold transition-all hover:-translate-y-0.5 tracking-tight">
                {l}
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                  <CreditCard size={14} className="text-blue-600" />
                  <span className="text-xs font-black text-blue-700 uppercase tracking-tight">{user.credits} CR</span>
                </div>
                <div className="relative group">
                  <button className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-all">
                    <UserIcon size={20} />
                  </button>
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-blue-50 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link href="/settings" className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-600 transition-colors">
                      <UserIcon size={16} /> Profile Settings
                    </Link>
                    <button onClick={logout} className="w-full flex items-center gap-2 p-3 hover:bg-red-50 rounded-xl text-sm font-bold text-red-500 transition-colors mt-1">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => openAuth('login')} className="text-blue-950 text-sm font-bold hover:text-blue-700 transition-colors">Login</button>
                <button onClick={() => openAuth('signup')} className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-black px-7 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-200">
                  Sign Up
                </button>
              </div>
            )}
          </div>
          
          <button className="md:hidden p-2 text-slate-900" onClick={() => setOpen(v => !v)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[90] bg-white/40 backdrop-blur-sm"
            />
            
            {/* Card Content */}
            <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center px-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-[320px] bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-white overflow-hidden pointer-events-auto flex flex-col"
              >
                <div className="p-6 flex flex-col items-center relative">
                  <button onClick={() => setOpen(false)} className="absolute top-5 right-5 p-1.5 bg-slate-50 rounded-full text-slate-300 active:scale-90 transition-transform">
                    <X size={16} />
                  </button>

                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg shadow-blue-100">
                    <Download size={22} strokeWidth={3} />
                  </div>
                  
                  <div className="w-full grid grid-cols-2 gap-2 mb-5">
                    {[
                      { label: 'Pricing', href: '/pricing', icon: <CreditCard size={18} />, color: 'bg-blue-50', iconColor: 'text-blue-600' },
                      { label: 'FAQ', href: '/faq', icon: <Play size={18} />, color: 'bg-indigo-50', iconColor: 'text-indigo-600' },
                      { label: 'About', href: '/about', icon: <UserIcon size={18} />, color: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                      { label: 'Settings', href: '/settings', icon: <Shield size={18} />, color: 'bg-amber-50', iconColor: 'text-amber-600' }
                    ].map(l => (
                      <Link 
                        key={l.label} 
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="flex flex-col items-center gap-2 p-4 bg-slate-50/50 hover:bg-white hover:shadow-sm rounded-[1.8rem] transition-all group border border-slate-100/50"
                      >
                        <div className={`w-10 h-10 ${l.color} ${l.iconColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          {l.icon}
                        </div>
                        <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest">{l.label}</span>
                      </Link>
                    ))}
                  </div>

                  {user ? (
                    <div className="w-full space-y-3 pt-5 border-t border-slate-50">
                      <div className="bg-blue-50/50 p-5 rounded-[1.8rem] flex flex-col gap-3 border border-blue-100/50">
                        <div className="flex justify-between items-center">
                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">Balance</p>
                          <Zap size={12} className="text-blue-600" fill="currentColor" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-black text-blue-700 tracking-tighter">{user.credits}</p>
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">CR</p>
                        </div>
                        <Link href="/pricing" onClick={() => setOpen(false)} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-center text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all">
                           Top Up Now
                        </Link>
                      </div>
                      
                      <button 
                        onClick={() => { logout(); setOpen(false); }}
                        className="w-full py-3 rounded-xl font-black text-red-500 text-[9px] uppercase tracking-[0.3em] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                      >
                        <LogOut size={12} /> Logout Account
                      </button>
                    </div>
                  ) : (
                    <div className="w-full space-y-2 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => openAuth('login')} 
                        className="w-full py-3.5 text-xs font-black text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all active:scale-95 border border-blue-100"
                      >
                        Login
                      </button>
                      <button 
                        onClick={() => openAuth('signup')} 
                        className="w-full py-3.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-200"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      <AuthModals isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  );
}
