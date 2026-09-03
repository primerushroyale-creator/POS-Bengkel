'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { Badge } from '@/components/ui/Badge';
import {
  Wrench,
  Clock,
  User,
  KeyRound,
  ShieldAlert,
  Sparkles,
  Layers,
  Store,
  Receipt,
  Car,
  Package,
} from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const { currentUser, setPinModalOpen } = useAuthStore();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-soft-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <Link href="/pos" className="flex items-center gap-2.5 group select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                BengkelPOS
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Sistem Kasir & Manajemen Bengkel
            </span>
          </div>
        </Link>

        {/* Center Live Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 text-slate-600 text-xs font-mono font-medium">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>{time || '00:00:00'} WIB</span>
        </div>

        {/* Right Section: User Info & PIN Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <button
              onClick={() => setPinModalOpen(true)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 active:scale-95 transition-all text-left"
              title="Klik untuk ganti user atau masukkan PIN"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden xs:flex flex-col">
                <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  {currentUser.role}
                </span>
              </div>
              <KeyRound className="w-4 h-4 text-slate-400 ml-1 hidden sm:inline" />
            </button>
          ) : (
            <button
              onClick={() => setPinModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-soft hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Login PIN</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
