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
import { useDataStore } from '@/stores/useDataStore';
import { formatDateIndo } from '@/lib/utils';
import { NavbarInstallButton } from '@/components/pwa/InstallPrompt';

export const Navbar: React.FC = () => {
  const { currentUser, setPinModalOpen } = useAuthStore();
  const { isRealtimeConnected, lastSyncedAt } = useDataStore();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-soft-sm">
      <div className="max-w-[1700px] w-full mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5 transition-transform group-hover:rotate-12" />
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

        {/* Center: Live Clock & Realtime Sync Indicator */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 text-slate-600 text-xs font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{time || '00:00:00'} WIB</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-medium"
            title={lastSyncedAt ? `Sinkronisasi terakhir: ${lastSyncedAt}` : 'Realtime Sync Aktif'}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold">Live Sync</span>
          </div>
        </div>

        {/* Right Section: User Info & PIN Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NavbarInstallButton />
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
