'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from './Navbar';
import { DesktopSidebar, MobileBottomNav } from './Sidebar';
import { PinPadModal } from '@/components/ui/PinPadModal';
import { ToastContainer } from '@/components/ui/Toast';
import { BengkelStorage } from '@/lib/storage';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';
import { useDataStore } from '@/stores/useDataStore';
import { ShieldAlert } from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const { error } = useToastStore();

  useEffect(() => {
    // Initialize Local Storage database if needed
    BengkelStorage.init();
    // Initialize Realtime Sync across devices and browser tabs
    const cleanup = useDataStore.getState().initRealtimeSubscription();
    return () => {
      cleanup();
    };
  }, []);

  const userRole = currentUser?.role || 'kasir';

  // Role Access Validation
  let isAllowed = true;
  let redirectTarget = '/pos';
  let deniedMessage = '';

  if (userRole === 'mekanik') {
    // Mekanik HANYA boleh mengakses /admin/work-orders
    if (!pathname.startsWith('/admin/work-orders')) {
      isAllowed = false;
      redirectTarget = '/admin/work-orders';
      deniedMessage = 'Akses Dibatasi: Role Mekanik hanya memiliki izin akses ke modul SPK Servis.';
    }
  } else if (userRole === 'kasir') {
    // Kasir dilarang mengakses Dashboard Owner (/admin), Master Produk (/admin/products), dan Audit Log (/admin/audit-logs)
    const isForbiddenForKasir =
      pathname === '/admin' ||
      pathname.startsWith('/admin/products') ||
      pathname.startsWith('/admin/audit-logs');

    if (isForbiddenForKasir) {
      isAllowed = false;
      redirectTarget = '/pos';
      deniedMessage = 'Akses Dibatasi: Halaman ini hanya dapat diakses oleh Admin / Owner.';
    }
  }

  useEffect(() => {
    if (!isAllowed) {
      error(deniedMessage);
      router.replace(redirectTarget);
    }
  }, [isAllowed, pathname, userRole, redirectTarget, deniedMessage, router, error]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <DesktopSidebar />
        <main className="flex-1 min-w-0 p-3 sm:p-6 pb-24 lg:pb-8 overflow-x-hidden">
          {isAllowed ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 shadow-soft-sm">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Akses Ditolak</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-4 leading-relaxed">
                {deniedMessage}
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span>Mengalihkan ke halaman yang diizinkan...</span>
              </div>
            </div>
          )}
        </main>
      </div>

      <MobileBottomNav />
      <PinPadModal />
      <ToastContainer />
    </div>
  );
};
