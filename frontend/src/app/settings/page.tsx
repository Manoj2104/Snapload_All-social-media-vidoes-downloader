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
      
      <main className="flex-1 pt-32 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
            <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-black px-5 py-2 rounded-full mb-6 tracking-[0.2em] uppercase">Settings</span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4">Command <span className="text-blue-600">Center.</span></h1>
            <p className="text-slate-400 text-lg md:text-xl font-medium">Manage your elite SnapLoad experience.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar */}
            <div className="lg:col-span-3 space-y-2">
              {sidebarItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${activeTab === item.id ? 'text-white' : 'text-blue-600'} transition-colors`}>
                      {item.icon}
                    </div>
                    <span className="font-black text-[11px] uppercase tracking-widest">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className={`${activeTab === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all`} />
                </button>
              ))}

              <div className="pt-8">
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-[11px] uppercase tracking-widest"
                >
                  <LogOut size={18} /> Logout Account
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9 min-h-[500px]">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-xl shadow-slate-100/50">
                      <div className="flex items-center gap-8 mb-12 pb-12 border-b border-slate-50">
                        <div className="relative">
                          <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center text-blue-600 text-3xl font-black shadow-inner">
                            {user.email[0].toUpperCase()}
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 text-white rounded-xl border-4 border-white flex items-center justify-center shadow-lg">
                            <CheckCircle2 size={16} strokeWidth={3} />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-slate-900 mb-1">{user.email.split('@')[0]}</h3>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Verified Member since {new Date(user.last_reset).getFullYear()}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-10">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Email Address</label>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900 flex items-center justify-between group">
                            {user.email}
                            <Mail size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Account Status</label>
                          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 font-bold text-emerald-700 flex items-center justify-between">
                            Active Premium
                            <Shield size={16} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-xl shadow-slate-100/50 flex items-center justify-between group cursor-pointer hover:border-red-200 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
                          <Trash2 size={24} />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">Deactivate Account</h4>
                          <p className="text-sm text-slate-400 font-medium">Permanently delete your profile and download history.</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-slate-200 group-hover:text-red-500 transition-all" />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-xl shadow-slate-100/50">
                       <div className="flex items-center gap-4 mb-10 pb-10 border-b border-slate-50">
                         <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                           <Key size={24} strokeWidth={2.5} />
                         </div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Security Access</h3>
                       </div>

                       <div className="space-y-8">
                         <div className="grid md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                             <input type="password" placeholder="••••••••" className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold" />
                           </div>
                           <div className="space-y-4">
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                             <input type="password" placeholder="••••••••" className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold" />
                           </div>
                         </div>
                         <button className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                           Update Security Credentials
                         </button>
                       </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-xl shadow-slate-100/50 flex items-center justify-between">
                       <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
                           <Shield size={24} />
                         </div>
                         <div>
                           <h4 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">Two-Factor Auth</h4>
                           <p className="text-sm text-slate-400 font-medium">Add an extra layer of protection to your account.</p>
                         </div>
                       </div>
                       <div className="w-14 h-8 bg-slate-100 rounded-full p-1 cursor-pointer">
                         <div className="w-6 h-6 bg-white rounded-full shadow-sm shadow-black/10" />
                       </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="bg-white border border-slate-100 rounded-[3rem] shadow-xl shadow-slate-100/50 overflow-hidden">
                       <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                              <History size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
                         </div>
                         <button onClick={fetchHistory} disabled={fetchingHistory} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all">
                           <Clock size={18} className={fetchingHistory ? 'animate-spin' : ''} />
                         </button>
                       </div>

                       <div className="p-2">
                         {history.length > 0 ? (
                           <div className="space-y-1">
                             {history.map((tx, i) => (
                               <div key={tx.id} className="p-6 hover:bg-slate-50 rounded-2xl transition-all flex items-center justify-between group">
                                 <div className="flex items-center gap-6">
                                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${tx.type === 'purchase' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                     {tx.type === 'purchase' ? <CreditCard size={20} /> : <Zap size={20} />}
                                   </div>
                                   <div>
                                     <p className="font-black text-slate-900 uppercase tracking-tight">{tx.type === 'purchase' ? 'Credit Purchase' : 'Token Usage'}</p>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(tx.timestamp).toLocaleString()}</p>
                                   </div>
                                 </div>
                                 <div className={`text-xl font-black tracking-tighter ${tx.type === 'purchase' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                   {tx.type === 'purchase' ? '+' : '-'}{tx.amount} <span className="text-[10px] opacity-60">CR</span>
                                 </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="py-20 text-center">
                             <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-6">
                               <History size={40} />
                             </div>
                             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No activity history found</p>
                           </div>
                         )}
                       </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'billing' && (
                  <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                     <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-10 opacity-10">
                         <Zap size={200} strokeWidth={3} />
                       </div>
                       <div className="relative z-10">
                         <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-70 mb-4">Total Available Balance</p>
                         <h3 className="text-6xl md:text-8xl font-black tracking-tighter mb-10">{user.credits} <span className="text-xl opacity-60">Credits</span></h3>
                         
                         <div className="flex flex-wrap gap-4">
                           <Link href="/pricing" className="px-8 py-4 bg-white text-blue-700 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                             Get More Credits
                           </Link>
                           <div className="px-8 py-4 bg-white/20 backdrop-blur-md rounded-2xl font-black text-[11px] uppercase tracking-widest">
                             Daily Reset Enabled
                           </div>
                         </div>
                       </div>
                     </div>

                     <div className="grid md:grid-cols-2 gap-8">
                       <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl shadow-slate-100/50">
                          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm"><Clock size={28} /></div>
                          <h4 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Free Auto-Refill</h4>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">Your balance is topped up to 1000 CR every day. This applies only to free usage.</p>
                          <div className="p-4 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border border-dashed border-slate-200">
                             Next reset in ~18 hours
                          </div>
                       </div>
                       <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl shadow-slate-100/50">
                          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm"><Wallet size={28} /></div>
                          <h4 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Lifetime Credits</h4>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">Purchased credits never expire. They are consumed only after free credits are exhausted.</p>
                          <div className="p-4 bg-emerald-50 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center border border-dashed border-emerald-100">
                             Active Lifetime Policy
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
    </div>
  );
}
