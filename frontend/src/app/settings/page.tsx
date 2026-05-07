'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, CreditCard, History, Shield, Calendar, 
  LogOut, ArrowRight, Zap, Bell, Globe, Key, 
  Trash2, ChevronRight, CheckCircle2, Clock, Wallet
} from 'lucide-react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

type Tab = 'profile' | 'security' | 'history' | 'billing';

export default function SettingsPage() {
  const { user, token, logout, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [history, setHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (activeTab === 'history' && token) {
      fetchHistory();
    }
  }, [activeTab, token]);

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/auth/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  if (loading || !user) return null;

  const sidebarItems = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'security', label: 'Security', icon: <Key size={18} /> },
    { id: 'history', label: 'History', icon: <History size={18} /> },
    { id: 'billing', label: 'Credits', icon: <Wallet size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 pt-24 md:pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 md:mb-16 text-center lg:text-left">
            <span className="inline-block bg-blue-50 text-blue-700 text-[9px] md:text-[10px] font-black px-4 md:px-5 py-2 rounded-full mb-4 md:mb-6 tracking-[0.2em] uppercase">Control Center</span>
            <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">Elite <span className="text-blue-600">Settings.</span></h1>
            <p className="text-slate-400 text-base md:text-xl font-medium max-w-xl mx-auto lg:mx-0">Manage your high-performance download environment.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
            {/* Navigation Bar - Responsive */}
            <div className="lg:col-span-3">
              <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar gap-2 md:gap-3 pb-4 lg:pb-0 sticky top-24 z-10 bg-white">
                {sidebarItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`flex items-center justify-between p-3.5 md:p-5 rounded-xl md:rounded-2xl transition-all group shrink-0 lg:shrink ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-50 text-slate-500 hover:bg-white border border-transparent hover:border-slate-100'}`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`${activeTab === item.id ? 'text-white' : 'text-blue-600'} transition-colors`}>
                        {item.icon}
                      </div>
                      <span className="font-black text-[9px] md:text-[11px] uppercase tracking-widest whitespace-nowrap">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className={`hidden lg:block ${activeTab === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all`} />
                  </button>
                ))}
                
                <button 
                  onClick={logout}
                  className="flex lg:hidden items-center gap-3 p-3.5 rounded-xl bg-red-50 text-red-500 font-black text-[9px] uppercase tracking-widest shrink-0"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>

              <div className="hidden lg:block pt-8 border-t border-slate-50 mt-8">
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-[11px] uppercase tracking-widest group"
                >
                  <LogOut size={18} className="group-hover:rotate-12 transition-transform" /> Logout Account
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9 min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 md:space-y-8">
                    <div className="bg-white border border-slate-100 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-xl shadow-slate-100/50">
                      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-10 md:mb-12 pb-10 md:pb-12 border-b border-slate-50 text-center md:text-left">
                        <div className="relative">
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-100 rounded-[1.8rem] md:rounded-[2rem] flex items-center justify-center text-blue-600 text-2xl md:text-3xl font-black shadow-inner">
                            {user.email[0].toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 bg-emerald-500 text-white rounded-lg md:rounded-xl border-4 border-white flex items-center justify-center shadow-lg">
                            <CheckCircle2 size={16} strokeWidth={3} />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-1">{user.email.split('@')[0]}</h3>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Verified Member since {new Date(user.last_reset).getFullYear()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                        <div>
                          <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 md:mb-4">Email Address</label>
                          <div className="p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 font-bold text-slate-900 flex items-center justify-between group overflow-hidden">
                            <span className="truncate">{user.email}</span>
                            <Mail size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 md:mb-4">Account Status</label>
                          <div className="p-4 md:p-5 bg-emerald-50 rounded-xl md:rounded-2xl border border-emerald-100 font-bold text-emerald-700 flex items-center justify-between">
                            Active Premium
                            <Shield size={16} className="shrink-0" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-xl shadow-slate-100/50 flex items-center justify-between group cursor-pointer hover:border-red-200 transition-all">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-red-50 rounded-xl md:rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm shrink-0">
                          <Trash2 size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg md:text-xl font-black text-slate-900 mb-0.5 md:mb-1 uppercase tracking-tight">Deactivate</h4>
                          <p className="text-xs text-slate-400 font-medium">Permanently delete your profile.</p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-slate-200 group-hover:text-red-500 transition-all shrink-0" />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 md:space-y-8">
                    <div className="bg-white border border-slate-100 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-xl shadow-slate-100/50">
                       <div className="flex items-center gap-4 mb-8 md:mb-10 pb-8 md:pb-10 border-b border-slate-50">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                           <Key size={24} strokeWidth={2.5} />
                         </div>
                         <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Security Access</h3>
                       </div>

                       <div className="space-y-6 md:space-y-8">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                           <div className="space-y-3 md:space-y-4">
                             <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                             <input type="password" placeholder="••••••••" className="w-full p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold" />
                           </div>
                           <div className="space-y-3 md:space-y-4">
                             <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm Password</label>
                             <input type="password" placeholder="••••••••" className="w-full p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold" />
                           </div>
                         </div>
                         <button className="w-full md:w-auto px-8 md:px-10 py-4 md:py-5 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                           Update Credentials
                         </button>
                       </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-xl shadow-slate-100/50 flex items-center justify-between">
                       <div className="flex items-center gap-4 md:gap-6">
                         <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                           <Shield size={24} />
                         </div>
                         <div>
                           <h4 className="text-lg md:text-xl font-black text-slate-900 mb-0.5 md:mb-1 uppercase tracking-tight">2FA Security</h4>
                           <p className="text-xs text-slate-400 font-medium">Extra layer of protection.</p>
                         </div>
                       </div>
                       <div className="w-12 h-7 md:w-14 md:h-8 bg-slate-100 rounded-full p-1 cursor-pointer shrink-0">
                         <div className="w-5 h-5 md:w-6 md:h-6 bg-white rounded-full shadow-sm shadow-black/10" />
                       </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="bg-white border border-slate-100 rounded-[2rem] md:rounded-[3rem] shadow-xl shadow-slate-100/50 overflow-hidden">
                       <div className="p-6 md:p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                         <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                              <History size={24} />
                            </div>
                            <h3 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
                         </div>
                         <button onClick={fetchHistory} disabled={fetchingHistory} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shrink-0">
                           <Clock size={18} className={fetchingHistory ? 'animate-spin' : ''} />
                         </button>
                       </div>

                       <div className="p-2">
                         {history.length > 0 ? (
                           <div className="space-y-1">
                             {history.map((tx, i) => (
                               <div key={tx.id} className="p-4 md:p-6 hover:bg-slate-50 rounded-2xl transition-all flex items-center justify-between group">
                                 <div className="flex items-center gap-4 md:gap-6 min-w-0">
                                   <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${tx.type === 'purchase' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                     {tx.type === 'purchase' ? <CreditCard size={18} /> : <Zap size={18} />}
                                   </div>
                                   <div className="min-w-0">
                                     <p className="font-black text-slate-900 uppercase tracking-tight text-[11px] md:text-sm truncate">{tx.type === 'purchase' ? 'Purchase' : 'Download'}</p>
                                     <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{new Date(tx.timestamp).toLocaleDateString()}</p>
                                   </div>
                                 </div>
                                 <div className={`text-lg md:text-xl font-black tracking-tighter shrink-0 ${tx.type === 'purchase' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                   {tx.type === 'purchase' ? '+' : '-'}{tx.amount} <span className="text-[9px] md:text-[10px] opacity-60">CR</span>
                                 </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="py-16 md:py-20 text-center">
                             <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-[1.8rem] md:rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-6">
                               <History size={32} />
                             </div>
                             <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">No activity history found</p>
                           </div>
                         )}
                       </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'billing' && (
                  <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 md:space-y-8">
                     <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 text-white shadow-2xl shadow-blue-100 relative overflow-hidden text-center md:text-left">
                       <div className="absolute top-0 right-0 p-10 opacity-10 hidden md:block">
                         <Zap size={200} strokeWidth={3} />
                       </div>
                       <div className="relative z-10">
                         <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] opacity-70 mb-4">Available Balance</p>
                         <h3 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 md:mb-10">{user.credits} <span className="text-lg md:text-xl opacity-60">CR</span></h3>
                         
                         <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center md:justify-start">
                           <Link href="/pricing" className="px-6 md:px-8 py-3.5 md:py-4 bg-white text-blue-700 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all text-center">
                             Add Credits
                           </Link>
                           <div className="px-6 md:px-8 py-3.5 md:py-4 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest text-center">
                             Daily Refill Active
                           </div>
                         </div>
                       </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                       <div className="bg-white border border-slate-100 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-100/50">
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm"><Clock size={28} /></div>
                          <h4 className="text-lg md:text-xl font-black text-slate-900 mb-2 md:mb-3 uppercase tracking-tight">Free Refill</h4>
                          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed mb-6">Your balance resets to 1000 CR daily at 12 PM.</p>
                          <div className="p-3.5 md:p-4 bg-slate-50 rounded-xl text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border border-dashed border-slate-200">
                             Next reset in ~18 hours
                          </div>
                       </div>
                       <div className="bg-white border border-slate-100 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-100/50">
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm"><Wallet size={28} /></div>
                          <h4 className="text-lg md:text-xl font-black text-slate-900 mb-2 md:mb-3 uppercase tracking-tight">Lifetime Policy</h4>
                          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed mb-6">Purchased credits are valid forever.</p>
                          <div className="p-3.5 md:p-4 bg-emerald-50 rounded-xl text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center border border-dashed border-emerald-100">
                             Active Policy
                          </div>
                       </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Mobile Hidden Styles */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
