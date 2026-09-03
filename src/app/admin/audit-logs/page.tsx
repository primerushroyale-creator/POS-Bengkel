'use client';

import React, { useState } from 'react';
import { BengkelStorage } from '@/lib/storage';
import { formatDateIndo } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  History,
  ShieldCheck,
  Search,
  Lock,
  Package,
  Ban,
  DollarSign,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const logs = BengkelStorage.getAuditLogs();

  const filteredLogs = logs.filter((log) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        (log.user_name && log.user_name.toLowerCase().includes(q)) ||
        JSON.stringify(log.details).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('VOID')) return 'danger';
    if (action.includes('CHECKOUT')) return 'success';
    if (action.includes('STOCK')) return 'warning';
    if (action.includes('LOGIN')) return 'primary';
    return 'neutral';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Audit Trail & Log Keamanan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Rekaman seluruh aktivitas transaksi, pembatalan nota (void), penyesuaian stok, dan autentikasi user.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari aktivitas, user, atau nomor transaksi..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-soft-sm"
        />
      </div>

      {/* Log List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                      <span className="text-xs font-bold text-slate-800">
                        Oleh: {log.user_name || 'System'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDateIndo(log.created_at)}
                      </span>
                    </div>

                    <div className="mt-1.5 p-2 bg-slate-50 rounded-lg text-xs font-mono text-slate-600 overflow-x-auto max-w-2xl">
                      {JSON.stringify(log.details)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Tidak ada riwayat log audit ditemukan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
