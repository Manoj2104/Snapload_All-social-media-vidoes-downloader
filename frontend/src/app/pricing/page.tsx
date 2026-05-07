'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, CreditCard, ShieldCheck, ZapOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthModals from '@/components/auth/AuthModals';

const PACKAGES = [
  { name: 'Starter', price: 30, credits: 1000, downloads: 20, icon: <Zap className="text-blue-500" /> },
  { name: 'Popular', price: 50, credits: 1500, downloads: 30, icon: <Zap className="text-purple-500" />, popular: true },
  { name: 'Ultimate', price: 80, credits: 3000, downloads: 60, icon: <Crown className="text-amber-500" /> },
];

import { API_BASE } from '@/lib/api';

export default function PricingPage() {
  const { user, token, refreshUser } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [buying, setBuying] = useState<number | null>(null);

  const handlePurchase = async (price: number) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setBuying(price);
    try {
      const res = await fetch(`${API_BASE}/auth/purchase-credits?amount=${price}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Payment Successful! Credits added to your account.');
        refreshUser();
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-5">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-blue-950 mb-6 tracking-tighter">Boost Your <span className="text-blue-700">Credits</span></h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Get more credits for 1080p and 4K downloads. Daily free reset to 1000 CR every 12 PM.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PACKAGES.map((pkg, i) => (
              <motion.div 
                key={pkg.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-[2.5rem] p-8 shadow-xl border-2 transition-all hover:scale-[1.02] ${pkg.popular ? 'border-blue-500 shadow-blue-100' : 'border-transparent'}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  {pkg.icon}
                </div>
                
                <h3 className="text-2xl font-black text-blue-950 mb-2">{pkg.name}</h3>
                <div className="text-4xl font-black text-blue-700 mb-6 tracking-tighter">
                  ₹{pkg.price}
                </div>
                
                <ul className="text-left space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <Check className="text-emerald-500 shrink-0" size={18} /> {pkg.credits} Credits
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <Check className="text-emerald-500 shrink-0" size={18} /> ~{pkg.downloads} Premium Downloads
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <Check className="text-emerald-500 shrink-0" size={18} /> Instant UPI Activation
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <Check className="text-emerald-500 shrink-0" size={18} /> Valid Lifetime
                  </li>
                </ul>

                <button 
                  onClick={() => handlePurchase(pkg.price)}
                  disabled={buying === pkg.price}
                  className={`w-full py-5 rounded-2xl font-black transition-all shadow-xl ${pkg.popular ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-blue-200' : 'bg-slate-900 text-white hover:bg-black shadow-slate-200'}`}
                >
                  {buying === pkg.price ? 'Processing...' : 'Purchase Now'}
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
             <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 flex items-start gap-5 text-left">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0"><ZapOff size={24} /></div>
                <div>
                  <h4 className="text-lg font-black text-blue-950 mb-1 uppercase tracking-tight">Free Daily Reset</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Every day at 12 PM, your balance is automatically topped up to 1000 Credits. Never run out of basic downloads!</p>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 flex items-start gap-5 text-left">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0"><ShieldCheck size={24} /></div>
                <div>
                  <h4 className="text-lg font-black text-blue-950 mb-1 uppercase tracking-tight">Secure UPI Payments</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">We support all major UPI apps (GPay, PhonePe, Paytm) for instant and safe credit top-ups with no hidden fees.</p>
                </div>
             </div>
          </div>
        </div>
      </main>

      <Footer />
      <AuthModals isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
    </div>
  );
}
