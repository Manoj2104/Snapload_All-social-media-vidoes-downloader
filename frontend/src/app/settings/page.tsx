'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { User, Mail, CreditCard, History, Shield, Calendar, LogOut, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-5">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="text-4xl font-black text-blue-950 mb-2">Account Settings</h1>
            <p className="text-slate-500 font-medium">Manage your profile, credits, and security preferences.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
              <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 text-center">
                 <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4 border-4 border-white shadow-md">
                    <User size={32} />
                 </div>
                 <h3 className="font-black text-blue-950 truncate px-2">{user.email.split('@')[0]}</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Verified Member</p>
                 <button onClick={logout} className="mt-6 w-full py-3 bg-red-50 text-red-500 rounded-xl text-sm font-black hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                    <LogOut size={16} /> Logout
                 </button>
              </div>

              <Link href="/pricing" className="block bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] shadow-xl shadow-blue-200 text-white group">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Current Balance</p>
                 <h4 className="text-3xl font-black mb-4">{user.credits} <span className="text-sm opacity-80 uppercase tracking-widest">Credits</span></h4>
                 <div className="flex items-center gap-2 text-xs font-black bg-white/20 px-3 py-2 rounded-lg group-hover:bg-white/30 transition-all">
                    Get More Credits <ArrowRight size={14} />
                 </div>
              </Link>
            </div>

            <div className="md:col-span-2 space-y-6">
               <div className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b border-slate-50">
                     <h4 className="text-lg font-black text-blue-950 flex items-center gap-2">
                        <Shield className="text-blue-600" size={20} /> Personal Information
                     </h4>
                  </div>
                  <div className="p-8 space-y-6">
                     <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                           <p className="font-bold text-blue-950">{user.email}</p>
                        </div>
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">Primary</span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Created</p>
                           <p className="font-bold text-blue-950">{new Date(user.last_reset).toLocaleDateString()}</p>
                        </div>
                        <Calendar className="text-slate-300" size={18} />
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                     <h4 className="text-lg font-black text-blue-950 flex items-center gap-2">
                        <CreditCard className="text-blue-600" size={20} /> Download Allowance
                     </h4>
                  </div>
                  <div className="p-8">
                     <div className="bg-blue-50 rounded-2xl p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-sm font-bold text-blue-900">Daily Free Reset</span>
                           <span className="text-xs font-black text-blue-600 bg-white px-3 py-1 rounded-full shadow-sm">ENABLED</span>
                        </div>
                        <p className="text-xs text-blue-700 leading-relaxed font-medium">Your account resets to 1000 Credits every day at 12:00 PM. Unused free credits do not carry over, but purchased credits are valid forever.</p>
                     </div>
                     <div className="flex items-center gap-4 text-slate-400">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center"><History size={20} /></div>
                        <p className="text-xs font-bold uppercase tracking-tight">Purchase history and detailed usage coming soon</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
