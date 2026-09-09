'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';
import { Lock, Delete, ShieldCheck, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPin, isAuthenticated, currentUser } = useAuthStore();
  const { success, error } = useToastStore();
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (isAuthenticated && currentUser) {
      router.replace(currentUser.role === 'mekanik' ? '/admin/work-orders' : '/pos');
    }
  }, [isAuthenticated, currentUser, router]);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage('');

      if (nextPin.length === 4) {
        attemptLogin(nextPin);
      }
    }
  };

  const attemptLogin = (pinToTest: string) => {
    const res = loginWithPin(pinToTest);
    if (res.success) {
      success(res.message);
      setPin('');
      setErrorMessage('');
      const user = useAuthStore.getState().currentUser;
      if (user) {
        router.replace(user.role === 'mekanik' ? '/admin/work-orders' : '/pos');
      }
    } else {
      setErrorMessage(res.message);
      setPin('');
      error(res.message);
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 opacity-80" />
      
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col items-center">
        
        <div className="w-16 h-16 bg-indigo-500/20 text-indigo-300 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-indigo-400/30">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">BengkelPOS PRO</h1>
        <p className="text-slate-300 text-sm text-center mb-8">Silakan masukkan PIN otorisasi Anda untuk masuk ke dalam sistem.</p>

        {/* PIN Display Dots */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={cn(
                'w-4 h-4 rounded-full border-2 transition-all duration-300',
                pin.length > idx
                  ? 'bg-indigo-400 border-indigo-400 scale-125 shadow-[0_0_10px_rgba(129,140,248,0.5)]'
                  : 'bg-white/10 border-white/20'
              )}
            />
          ))}
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-400 font-medium text-center mb-4 animate-shake">
            {errorMessage}
          </p>
        )}

        {/* Numpad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-white/20 text-white font-semibold text-2xl border border-white/10 transition-all flex items-center justify-center select-none"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setPin(''); setErrorMessage(''); }}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-white/20 text-slate-300 font-medium text-sm uppercase tracking-wider border border-white/10 transition-all flex items-center justify-center select-none"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-white/20 text-white font-semibold text-2xl border border-white/10 transition-all flex items-center justify-center select-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => { setPin((prev) => prev.slice(0, -1)); setErrorMessage(''); }}
            className="h-16 rounded-2xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 active:bg-rose-500/30 text-slate-300 border border-white/10 transition-all flex items-center justify-center select-none"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

      </div>

      <div className="fixed bottom-6 flex items-center justify-center text-xs text-slate-500 gap-1.5 opacity-60">
        <Fingerprint className="w-4 h-4" />
        <span>Secure Auth System v1.1.1 (Beta)</span>
      </div>
    </div>
  );
}

