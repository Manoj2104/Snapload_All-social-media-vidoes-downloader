'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Menu, X, User as UserIcon, LogOut, CreditCard } from 'lucide-react';
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
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white/98 backdrop-blur-xl pt-24 pb-10 flex flex-col items-center overflow-y-auto"
          >
            <div className="w-full max-w-sm px-6 flex-1 flex flex-col">
              <div className="space-y-2 mb-10">
                {['Pricing', 'FAQ', 'About'].map(l => (
                  <Link 
                    key={l} 
                    href={l === 'About' ? '/about' : l === 'FAQ' ? '/faq' : '/pricing'}
                    onClick={() => setOpen(false)}
                    className="block py-4 text-2xl font-black text-blue-950 border-b border-slate-50 transition-all active:pl-4"
                  >
                    {l}
                  </Link>
                ))}
                {user && (
                  <Link 
                    href="/settings" 
                    onClick={() => setOpen(false)} 
                    className="block py-4 text-2xl font-black text-blue-950 border-b border-slate-50 transition-all active:pl-4"
                  >
                    Profile Settings
                  </Link>
                )}
              </div>

              {user ? (
                <div className="mt-auto space-y-6">
                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Your Balance</p>
                      <p className="text-2xl font-black text-blue-700">{user.credits} Credits</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                      <CreditCard size={24} />
                    </div>
                  </div>
                  <button 
                    onClick={() => { logout(); setOpen(false); }}
                    className="w-full py-4 rounded-2xl font-black text-red-500 bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut size={20} /> Logout Account
                  </button>
                </div>
              ) : (
                <div className="mt-auto space-y-4 pt-10">
                  <p className="text-center text-sm font-bold text-slate-400 mb-6 uppercase tracking-[0.2em]">Join the Community</p>
                  <button 
                    onClick={() => openAuth('login')} 
                    className="w-full py-5 text-xl font-black text-blue-700 bg-blue-50 rounded-[1.8rem] transition-all active:scale-95 border border-blue-100 shadow-sm"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => openAuth('signup')} 
                    className="w-full py-5 text-xl font-black text-white bg-blue-700 rounded-[1.8rem] transition-all active:scale-95 shadow-xl shadow-blue-200"
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AuthModals isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  );
}
