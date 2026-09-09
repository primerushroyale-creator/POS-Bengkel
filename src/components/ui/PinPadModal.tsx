'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';
import { Lock, Delete, UserCheck, ShieldAlert, Wrench, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PinPadModal: React.FC = () => {
  const { isPinModalOpen, setPinModalOpen, loginWithPin, currentUser } = useAuthStore();
  const { success, error } = useToastStore();
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage('');

      // Auto submit at 4 digits if matches
      if (nextPin.length === 4) {
        attemptLogin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  const attemptLogin = (pinToTest: string) => {
    const res = loginWithPin(pinToTest);
    if (res.success) {
      success(res.message);
      setPin('');
      setErrorMessage('');
      setPinModalOpen(false);
    } else {
      setErrorMessage(res.message);
      setPin('');
      error(res.message);
    }
  };

  const handleQuickSwitch = (quickPin: string) => {
    attemptLogin(quickPin);
  };

  return (
    <Modal
      isOpen={isPinModalOpen}
      onClose={() => setPinModalOpen(false)}
      title={
        <div className="flex items-center gap-2 text-indigo-600">
          <Lock className="w-5 h-5" />
          <span>Ganti Pengguna / Masuk PIN</span>
        </div>
      }
      description="Masukkan 4-6 digit PIN untuk autentikasi Kasir / Admin / Mekanik"
      maxWidth="sm"
    >
      <div className="flex flex-col items-center">
        {/* PIN Display Dots */}
        <div className="my-3 flex items-center justify-center gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={cn(
                'w-4 h-4 rounded-full border-2 transition-all duration-150',
                pin.length > idx
                  ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-sm shadow-indigo-300'
                  : 'bg-slate-100 border-slate-300'
              )}
            />
          ))}
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-600 font-medium text-center mb-3 animate-shake">
            {errorMessage}
          </p>
        )}

        {/* Numpad Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] my-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:bg-indigo-100 text-slate-800 hover:text-indigo-600 font-bold text-xl border border-slate-200 shadow-soft-sm transition-all flex items-center justify-center select-none"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-medium text-xs uppercase tracking-wider border border-slate-200 shadow-soft-sm transition-all flex items-center justify-center select-none"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:bg-indigo-100 text-slate-800 hover:text-indigo-600 font-bold text-xl border border-slate-200 shadow-soft-sm transition-all flex items-center justify-center select-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100 text-slate-600 border border-slate-200 shadow-soft-sm transition-all flex items-center justify-center select-none"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Removed Quick Demo Switcher Section for Security */}
      </div>
    </Modal>
  );
};
