'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, CreditCard, History, Zap, ArrowUpRight, 
  ArrowDownRight, RefreshCw, ShieldCheck, ExternalLink, 
  Search, Filter, ChevronRight, CheckCircle2, Clock
} from 'lucide-react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

export default function WalletPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'usage'>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  };

  if (loading || !user) return null;

  const filteredHistory = history.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'purchase') return tx.type === 'purchase';
    if (filter === 'usage') return tx.type === 'download';
    return true;
  });

  const totalPurchased = history.filter(tx => tx.type === 'purchase').reduce((acc, tx) => acc + tx.amount, 0);
  const totalUsed = history.filter(tx => tx.type === 'download').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-32 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-black px-5 py-2 rounded-full mb-6 tracking-[0.2em] uppercase">Finance Hub</span>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4">Real-time <span className="text-blue-600">Wallet.</span></h1>
              <p className="text-slate-400 text-lg md:text-xl font-medium">Manage your credits and transaction flows.</p>
            </motion.div>
            
            <Link href="/pricing" className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all text-center">
               Recharge Balance
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Stats & Actions */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                   <Wallet size={160} strokeWidth={1} />
                 </div>
                 <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4">Available Credits</p>
                   <h3 className="text-6xl font-black tracking-tighter mb-12">{user.credits}</h3>
                   
                   <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Lifetime In</p>
                        <p className="text-xl font-black text-emerald-400">+{totalPurchased}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Lifetime Out</p>
                        <p className="text-xl font-black text-blue-400">-{totalUsed}</p>
                      </div>
                   </div>
                 </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50">
                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                   <ShieldCheck size={18} className="text-blue-600" /> Security Status
                 </h4>
                 <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between">
                       <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">SSL Encrypted</span>
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl flex items-center justify-between">
                       <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Real-time Sync</span>
                       <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    </div>
                 </div>
              </div>
            </div>

            {/* Right Column: Transaction Management */}
            <div className="lg:col-span-8">
               <div className="bg-white border border-slate-100 rounded-[3rem] shadow-xl shadow-slate-100/50 overflow-hidden flex flex-col min-h-[600px]">
                  <div className="p-8 md:p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                         <History size={24} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Management</h3>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Transaction logs</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                       {(['all', 'purchase', 'usage'] as const).map(f => (
                         <button 
                           key={f} 
                           onClick={() => setFilter(f)}
                           className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-900'}`}
                         >
                           {f}
                         </button>
                       ))}
                       <button 
                         onClick={fetchHistory} 
                         disabled={isRefreshing}
                         className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all border-l border-slate-50 ml-2"
                       >
                         <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                       </button>
                    </div>
                  </div>

                  <div className="flex-1 p-4 md:p-6">
                    <AnimatePresence mode="wait">
                      {filteredHistory.length > 0 ? (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                           {filteredHistory.map((tx, i) => (
                             <motion.div 
                               key={tx.id} 
                               initial={{ opacity: 0, x: -10 }} 
                               animate={{ opacity: 1, x: 0 }} 
                               transition={{ delay: i * 0.05 }}
                               className="p-6 hover:bg-slate-50 rounded-3xl transition-all flex items-center justify-between group border border-transparent hover:border-slate-100"
                             >
                               <div className="flex items-center gap-6">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${tx.type === 'purchase' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {tx.type === 'purchase' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-black text-slate-900 uppercase tracking-tight text-base">{tx.type === 'purchase' ? 'Balance Deposit' : 'Extraction Usage'}</p>
                                      <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-colors">Success</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                       <span className="flex items-center gap-1"><Clock size={10} /> {new Date(tx.timestamp).toLocaleDateString()}</span>
                                       <span className="flex items-center gap-1"><ShieldCheck size={10} /> Verified</span>
                                    </div>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className={`text-2xl font-black tracking-tighter ${tx.type === 'purchase' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {tx.type === 'purchase' ? '+' : '-'}{tx.amount} <span className="text-xs opacity-60">CR</span>
                                  </p>
                                  <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 ml-auto mt-1">
                                     Receipt <ExternalLink size={10} />
                                  </button>
                               </div>
                             </motion.div>
                           ))}
                        </motion.div>
                      ) : (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-center">
                           <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8">
                             <CreditCard size={48} strokeWidth={1.5} />
                           </div>
                           <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Empty Wallet</h4>
                           <p className="text-slate-400 font-medium max-w-xs uppercase text-[10px] tracking-widest">No real-time transactions recorded yet.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="p-8 bg-slate-50/50 border-t border-slate-50">
                     <div className="flex items-center justify-between text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                        <span>System ID: SL-7729-WLT</span>
                        <span>Auto-Refreshing every 30s</span>
                        <div className="flex items-center gap-2">
                           <CheckCircle2 size={12} className="text-emerald-500" /> Cloud Synced
                        </div>
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
