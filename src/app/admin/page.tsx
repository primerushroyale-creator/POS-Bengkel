'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BengkelStorage } from '@/lib/storage';
import { DashboardStats, Product, Transaction } from '@/types';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useDataStore } from '@/stores/useDataStore';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Package,
  Wrench,
  Receipt,
  Car,
  ClipboardList,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { stats: storeStats, refreshData, isLoading } = useDataStore();
  const stats = storeStats || BengkelStorage.getDashboardStats();

  const handleRefresh = async () => {
    await refreshData();
  };

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard & Analytics Bengkel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ringkasan omset penjualan, performa transaksi, dan status inventori bengkel.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-soft-sm self-start transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-indigo-600")} />
          <span>{isLoading ? 'Menyinkronkan...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Omset Hari Ini */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Omset Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(stats.todayRevenue)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Hari ini ({stats.todayTransactions} Transaksi)</span>
          </span>
        </div>

        {/* Card 2: Jumlah Transaksi Hari Ini */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Transaksi Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {stats.todayTransactions} <span className="text-xs font-normal text-slate-400">Nota</span>
          </p>
          <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">
            Rata-rata: {stats.todayTransactions > 0 ? formatRupiah(stats.todayRevenue / stats.todayTransactions) : 'Rp 0'}
          </span>
        </div>

        {/* Card 3: Total Omset Akumulatif */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Omset Akumulatif</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(stats.accumulativeRevenue)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Seluruh transaksi valid
          </span>
        </div>

        {/* Card 4: Counter Stok Menipis */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Stok Menipis / Habis</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-rose-600 tracking-tight">
            {stats.lowStockCount} <span className="text-xs font-normal text-slate-400">Item</span>
          </p>
          <Link
            href="/admin/products"
            className="text-[11px] text-indigo-600 hover:underline font-semibold mt-1 inline-flex items-center gap-1"
          >
            <span>Lihat & Restock</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Grid 2 Columns: Low Stock Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Low Stock Alert Warning Box */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">Peringatan Stok Rendah</h3>
              </div>
              <Badge variant="warning" size="sm">
                {stats.lowStockProducts.length} Perlu Restock
              </Badge>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {stats.lowStockProducts.length > 0 ? (
                stats.lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/40"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Kode: {p.code} • Min: {p.min_stock} {p.unit}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          'text-xs font-extrabold px-2 py-0.5 rounded-md font-mono',
                          p.stock === 0 ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {p.stock === 0 ? 'HABIS (0)' : `Sisa ${p.stock}`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                  <p className="text-xs">Semua stok barang dalam kondisi aman!</p>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/admin/products"
            className="mt-4 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold text-center border border-slate-200 transition-colors block"
          >
            Kelola Master Inventori
          </Link>
        </div>

        {/* Right: Recent Transactions Table / Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Transaksi Terbaru</h3>
            </div>
            <Link
              href="/admin/transactions"
              className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              <span>Semua Nota</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
            {stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs',
                        tx.status === 'completed'
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-rose-50 text-rose-600'
                      )}
                    >
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {tx.invoice_no}
                        </span>
                        <Badge
                          variant={tx.status === 'completed' ? 'success' : 'danger'}
                          size="sm"
                        >
                          {tx.status === 'completed' ? 'Selesai' : 'VOID'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatDateIndo(tx.created_at)} • {tx.vehicle_plate || 'Umum'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                      {formatRupiah(tx.total_amount)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {tx.payment_method}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Belum ada riwayat transaksi.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/pos"
          className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft transition-all group"
        >
          <ShoppingCart className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-sm font-bold">Buka Kasir POS</h4>
          <p className="text-[11px] text-indigo-200 mt-0.5">Mulai transaksi baru</p>
        </Link>

        <Link
          href="/admin/products"
          className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 shadow-soft-sm transition-all group"
        >
          <Package className="w-6 h-6 mb-2 text-indigo-600 group-hover:scale-110 transition-transform" />
          <h4 className="text-sm font-bold">Master Barang & Jasa</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Tambah & update stok</p>
        </Link>

        <Link
          href="/admin/vehicles"
          className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 shadow-soft-sm transition-all group"
        >
          <Car className="w-6 h-6 mb-2 text-emerald-600 group-hover:scale-110 transition-transform" />
          <h4 className="text-sm font-bold">Data Kendaraan CRM</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Riwayat servis pelanggan</p>
        </Link>

        <Link
          href="/admin/work-orders"
          className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 shadow-soft-sm transition-all group"
        >
          <ClipboardList className="w-6 h-6 mb-2 text-amber-600 group-hover:scale-110 transition-transform" />
          <h4 className="text-sm font-bold">SPK & Servis</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Pantau antrian mekanik</p>
        </Link>
      </div>
    </div>
  );
}
