'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Crown, CreditCard, ShieldCheck, ZapOff, X, ArrowRight, Wallet, CheckCircle2, Loader2, QrCode } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthModals from '@/components/auth/AuthModals';
import { API_BASE } from '@/lib/api';

const PACKAGES = [
  { id: 'starter', name: 'Starter', price: 30, credits: 1000, downloads: 20, icon: <Zap className="text-blue-500" /> },
  { id: 'popular', name: 'Popular', price: 50, credits: 1500, downloads: 30, icon: <Zap className="text-purple-500" />, popular: true },
  { id: 'ultimate', name: 'Ultimate', price: 80, credits: 3000, downloads: 60, icon: <Crown className="text-amber-500" /> },
];

export default function PricingPage() {
  const { user, token, refreshUser } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; pkg: any | null }>({ open: false, pkg: null });
  const [paymentStep, setPaymentStep] = useState<'options' | 'qr' | 'verifying' | 'success'>('options');
  const [buying, setBuying] = useState(false);

  const startPurchase = (pkg: any) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setPaymentModal({ open: true, pkg });
    setPaymentStep('options');
  };

  const handleUPIClick = () => {
    setPaymentStep('qr');
  };

  const verifyPayment = async () => {
    setPaymentStep('verifying');
    setBuying(true);
    
    // Simulate real verification delay
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/purchase-credits?amount=${paymentModal.pkg.price}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          setPaymentStep('success');
          refreshUser();
        } else {
          alert('Verification failed. Please contact support.');
          setPaymentStep('options');
        }
      } catch (err) {
        alert('Network error during verification.');
        setPaymentStep('options');
      } finally {
        setBuying(false);
      }
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-20">
            <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-black px-5 py-2 rounded-full mb-6 tracking-[0.2em] uppercase">Premium Credits</span>
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]">Boost Your <span className="text-blue-600">Balance.</span></h1>
            <p className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">Unlock high-quality 4K downloads and priority extraction. <br/><span className="text-slate-900">Daily reset to 1000 CR every 12 PM.</span></p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
            {PACKAGES.map((pkg, i) => (
              <motion.div 
                key={pkg.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-[3rem] p-10 border transition-all hover:scale-[1.02] duration-500 ${pkg.popular ? 'border-blue-100 shadow-2xl shadow-blue-100/50 scale-105 z-10' : 'border-slate-100 shadow-xl shadow-slate-100/50'}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-xl shadow-blue-200">
                    Most Popular
                  </div>
                )}
                
                <div className="w-20 h-20 bg-slate-50 rounded-[1.8rem] flex items-center justify-center mb-8 mx-auto shadow-sm group-hover:scale-110 transition-transform">
                  {pkg.icon}
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">{pkg.name}</h3>
                <div className="text-5xl font-black text-blue-700 mb-10 tracking-tighter">
                  ₹{pkg.price}
                </div>
                
                <ul className="text-left space-y-5 mb-12">
                  {[
                    `${pkg.credits} Premium Credits`,
                    `~${pkg.downloads} Ultra HD Downloads`,
                    'Instant UPI Activation',
                    'Valid Lifetime'
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-4 text-[13px] md:text-sm font-bold text-slate-500">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={4} />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => startPurchase(pkg)}
                  className={`w-full py-5 rounded-[1.8rem] font-black transition-all shadow-2xl tracking-widest uppercase text-xs ${pkg.popular ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-slate-900 text-white hover:bg-black shadow-slate-200'}`}
                >
                  Purchase Now
                </button>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/50 border border-slate-100 flex items-start gap-6 text-left hover:shadow-2xl transition-all duration-500">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm"><ZapOff size={28} /></div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Free Daily Reset</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Your balance is automatically topped up to 1000 Credits every day at 12 PM. Never run out of tools!</p>
                </div>
             </motion.div>
             <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/50 border border-slate-100 flex items-start gap-6 text-left hover:shadow-2xl transition-all duration-500">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm"><ShieldCheck size={28} /></div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Secure Payments</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Full support for UPI (GPay, PhonePe, Paytm) ensures safe and instant credit delivery with zero latency.</p>
                </div>
             </motion.div>
          </div>
        </div>
      </main>

      <Footer />
      <AuthModals isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModal.open && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !buying && setPaymentModal({ open: false, pkg: null })}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white"
            >
              <div className="p-8 md:p-10 text-center">
                <button onClick={() => setPaymentModal({ open: false, pkg: null })} className="absolute top-6 right-8 text-slate-300 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>

                <AnimatePresence mode="wait">
                  {paymentStep === 'options' && (
                    <motion.div key="options" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6 shadow-sm">
                        <Wallet size={28} />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2">Checkout</h3>
                      <p className="text-slate-400 font-medium mb-8">Select your preferred payment method to add <span className="text-blue-600 font-bold">{paymentModal.pkg?.credits} Credits</span></p>
                      
                      <div className="space-y-3">
                        <button onClick={handleUPIClick} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-blue-600 hover:text-white transition-all duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-white/20 group-hover:text-white shadow-sm transition-colors">
                               <QrCode size={20} />
                            </div>
                            <div className="text-left">
                               <p className="font-black uppercase tracking-widest text-[10px]">Pay with UPI</p>
                               <p className="text-xs font-bold opacity-60">GPay, PhonePe, Paytm</p>
                            </div>
                          </div>
                          <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                        
                        <button className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group opacity-50 cursor-not-allowed">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                               <CreditCard size={20} />
                            </div>
                            <div className="text-left">
                               <p className="font-black uppercase tracking-widest text-[10px]">Card / Net Banking</p>
                               <p className="text-xs font-bold opacity-60">Coming Soon</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {paymentStep === 'qr' && (
                    <motion.div key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center">
                      <div className="w-full aspect-square max-w-[240px] bg-white border-4 border-blue-600 p-4 rounded-3xl mb-8 shadow-xl shadow-blue-100 relative overflow-hidden group">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=snapload@okaxis%26pn=SnapLoad%26am=${paymentModal.pkg?.price}%26cu=INR`} alt="Payment QR" className="w-full h-full opacity-80" />
                        <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
                           <Zap size={40} className="text-blue-600" fill="currentColor" />
                        </div>
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Scan with any UPI app</p>
                      <h4 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter text-blue-600">₹{paymentModal.pkg?.price}</h4>
                      
                      <button onClick={verifyPayment} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all">
                        I Have Paid
                      </button>
                    </motion.div>
                  )}

                  {paymentStep === 'verifying' && (
                    <motion.div key="verifying" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10">
                      <div className="relative mb-8">
                        <Loader2 size={64} className="text-blue-600 animate-spin" strokeWidth={3} />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Zap size={24} className="text-blue-200" fill="currentColor" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2">Verifying Payment</h3>
                      <p className="text-slate-400 font-medium animate-pulse">Communicating with banking network...</p>
                    </motion.div>
                  )}

                  {paymentStep === 'success' && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10">
                      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-50 animate-bounce">
                        <CheckCircle2 size={40} strokeWidth={3} />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Payment Received!</h3>
                      <p className="text-slate-400 font-medium mb-10">Your credits have been added instantly.</p>
                      <button onClick={() => setPaymentModal({ open: false, pkg: null })} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">
                        Done
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
