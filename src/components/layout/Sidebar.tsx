'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  LayoutDashboard,
  Package,
  Receipt,
  Car,
  ClipboardList,
  ShieldCheck,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { Role } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'Kasir POS', href: '/pos', icon: Store, roles: ['admin', 'kasir'] },
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['admin'] },
  { label: 'Barang & Jasa', href: '/admin/products', icon: Package, roles: ['admin'] },
  { label: 'Riwayat Transaksi', href: '/admin/transactions', icon: Receipt, roles: ['admin', 'kasir'] },
  { label: 'Data Kendaraan', href: '/admin/vehicles', icon: Car, roles: ['admin', 'kasir'] },
  { label: 'SPK Servis', href: '/admin/work-orders', icon: ClipboardList, roles: ['admin', 'kasir', 'mekanik'] },
  { label: 'Audit Log', href: '/admin/audit-logs', icon: History, roles: ['admin'] },
];

export const DesktopSidebar: React.FC = () => {
  const pathname = usePathname();
  const { currentUser } = useAuthStore();
  const userRole = currentUser?.role || 'kasir';

  const allowedNavItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 shrink-0 shadow-soft-sm">
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
          Menu Utama ({userRole.toUpperCase()})
        </p>
        {allowedNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/pos' && item.href !== '/admin' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-indigo-600 text-white shadow-soft font-semibold shadow-indigo-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform group-hover:scale-110',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Info Card at bottom of sidebar */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100/60 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">Bengkel POS Engine</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Role: <strong className="capitalize">{userRole}</strong> • Mode Aman Aktif
          </p>
        </div>
      </div>
    </aside>
  );
};

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { currentUser } = useAuthStore();
  const userRole = currentUser?.role || 'kasir';

  const allMobileTabs = [
    { label: 'Kasir', href: '/pos', icon: Store, roles: ['admin', 'kasir'] as Role[] },
    { label: 'Admin', href: '/admin', icon: LayoutDashboard, roles: ['admin'] as Role[] },
    { label: 'Barang', href: '/admin/products', icon: Package, roles: ['admin'] as Role[] },
    { label: 'Nota', href: '/admin/transactions', icon: Receipt, roles: ['admin', 'kasir'] as Role[] },
    { label: 'SPK', href: '/admin/work-orders', icon: ClipboardList, roles: ['admin', 'kasir', 'mekanik'] as Role[] },
  ];

  const mobileTabs = allMobileTabs.filter((tab) => tab.roles.includes(userRole));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-soft-lg pb-safe">
      <div
        className={cn(
          'h-16 max-w-lg mx-auto px-1',
          mobileTabs.length <= 2 ? 'flex items-center justify-around' : 'grid',
          mobileTabs.length === 3 && 'grid-cols-3',
          mobileTabs.length === 4 && 'grid-cols-4',
          mobileTabs.length >= 5 && 'grid-cols-5'
        )}
      >
        {mobileTabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-all select-none min-h-[46px] px-3',
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-xl transition-all',
                  isActive && 'bg-indigo-50 scale-105'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'stroke-[2.4]' : 'stroke-[1.8]')} />
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
