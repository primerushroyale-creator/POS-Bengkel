'use client';

import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { DesktopSidebar, MobileBottomNav } from './Sidebar';
import { PinPadModal } from '@/components/ui/PinPadModal';
import { ToastContainer } from '@/components/ui/Toast';
import { BengkelStorage } from '@/lib/storage';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Initialize Local Storage database if needed
    BengkelStorage.init();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <DesktopSidebar />
        <main className="flex-1 min-w-0 p-3 sm:p-6 pb-24 lg:pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      <MobileBottomNav />
      <PinPadModal />
      <ToastContainer />
    </div>
  );
};
