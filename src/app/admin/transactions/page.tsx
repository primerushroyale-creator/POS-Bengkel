'use client';

import React, { useState, useMemo } from 'react';
import { Transaction } from '@/types';
import { BengkelStorage } from '@/lib/storage';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';
import { useDataStore } from '@/stores/useDataStore';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import {
  Receipt,
  Search,
  Calendar,
  AlertTriangle,
  Ban,
  Printer,
  Eye,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TransactionsReportPage() {
  const { currentUser } = useAuthStore();
  const { success, error } = useToastStore();
  const { transactions, voidTransaction } = useDataStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'void'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modals
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [selectedTxForVoid, setSelectedTxForVoid] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Status filter
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

      // Date filter
      if (dateFilter && !tx.created_at.startsWith(dateFilter)) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          tx.invoice_no.toLowerCase().includes(q) ||
          (tx.vehicle_plate && tx.vehicle_plate.toLowerCase().includes(q)) ||
          (tx.vehicle_owner && tx.vehicle_owner.toLowerCase().includes(q)) ||
          (tx.cashier_name && tx.cashier_name.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [transactions, statusFilter, dateFilter, search]);

  // Aggregate stats of filtered
  const totalRevenue = filteredTransactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const handleOpenVoidModal = (tx: Transaction) => {
    setSelectedTxForVoid(tx);
    setVoidReason('');
  };

  const handleConfirmVoid = async () => {
    if (!selectedTxForVoid) return;
    if (!voidReason.trim()) {
      error('Alasan pembatalan (void) wajib diisi!');
      return;
    }

    setIsVoiding(true);
    const result = await voidTransaction(
      selectedTxForVoid.id,
      voidReason,
      currentUser?.id,
      currentUser?.name
    );

    setIsVoiding(false);
    if (result.success) {
      success(`Nota ${selectedTxForVoid.invoice_no} berhasil dibatalkan & stok dikembalikan!`);
      setSelectedTxForVoid(null);
    } else {
      error(result.error || 'Gagal membatalkan transaksi.');
    }
  };

  const handlePrintReceipt = (tx: Transaction) => {
    setSelectedTxForDetail(tx);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Laporan & Riwayat Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar seluruh nota penjualan, status pembayaran, dan pembatalan transaksi (Void).
          </p>
        </div>

        <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center gap-3">
          <span className="text-xs text-indigo-700 font-bold">Total Terfilter:</span>
          <span className="text-base font-black text-indigo-900">{formatRupiah(totalRevenue)}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No. Nota, Plat No, Pelanggan, Kasir..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-soft-sm"
          />
        </div>

        <div className="sm:col-span-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-soft-sm"
          />
        </div>

        <div className="sm:col-span-3 flex rounded-xl border border-slate-200/80 p-1 bg-white shadow-soft-sm">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'completed', label: 'Sukses' },
            { id: 'void', label: 'VOID' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={cn(
                'flex-1 py-1 rounded-lg text-xs font-bold transition-colors',
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-soft-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table (Desktop) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">No. Nota & Waktu</th>
              <th className="px-4 py-3">Pelanggan / Kendaraan</th>
              <th className="px-4 py-3">Metode & Kasir</th>
              <th className="px-4 py-3">Total Transaksi</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono font-bold text-slate-800 block">
                      {tx.invoice_no}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatDateIndo(tx.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {tx.vehicle_plate ? (
                      <div>
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {tx.vehicle_plate}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {tx.vehicle_owner} ({tx.vehicle_type || 'Motor'})
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400">Umum / Tanpa Plat</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="uppercase font-bold text-slate-700 block">
                      {tx.payment_method}
                    </span>
                    <span className="text-[11px] text-slate-400">{tx.cashier_name || 'Kasir'}</span>
                  </td>
                  <td className="px-4 py-3.5 font-extrabold text-slate-900 text-sm">
                    {formatRupiah(tx.total_amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      variant={tx.status === 'completed' ? 'success' : 'danger'}
                      size="sm"
                    >
                      {tx.status === 'completed' ? 'Selesai' : 'VOID'}
                    </Badge>
                    {tx.status === 'void' && tx.void_reason && (
                      <p className="text-[10px] text-rose-600 mt-0.5 line-clamp-1">
                        Ket: {tx.void_reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handlePrintReceipt(tx)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Cetak Ulang Struk"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {tx.status === 'completed' && (
                        <button
                          onClick={() => handleOpenVoidModal(tx)}
                          className="flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                          title="Batalkan Nota (Void)"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Void</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Tidak ada riwayat transaksi yang cocok.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Transactions Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-slate-800 block">
                    {tx.invoice_no}
                  </span>
                  <span className="text-[11px] text-slate-400">{formatDateIndo(tx.created_at)}</span>
                </div>
                <Badge variant={tx.status === 'completed' ? 'success' : 'danger'} size="sm">
                  {tx.status === 'completed' ? 'Selesai' : 'VOID'}
                </Badge>
              </div>

              {tx.vehicle_plate && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                  <span className="font-mono font-bold">{tx.vehicle_plate}</span> •{' '}
                  {tx.vehicle_owner}
                </div>
              )}

              {/* Items summary */}
              <div className="text-xs text-slate-600 space-y-1">
                {tx.details.map((d, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[200px]">
                      {d.qty}x {d.product_name}
                    </span>
                    <span className="font-medium text-slate-700">{formatRupiah(d.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total ({tx.payment_method})</span>
                  <span className="text-sm font-black text-slate-900">
                    {formatRupiah(tx.total_amount)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintReceipt(tx)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Struk</span>
                  </button>

                  {tx.status === 'completed' && (
                    <button
                      onClick={() => handleOpenVoidModal(tx)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 font-bold rounded-xl text-xs"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Void</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Tidak ada data transaksi.</p>
          </div>
        )}
      </div>

      {/* Modal Void Transaction Confirmation */}
      <Modal
        isOpen={!!selectedTxForVoid}
        onClose={() => setSelectedTxForVoid(null)}
        title={
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Konfirmasi Pembatalan Transaksi (Void)</span>
          </div>
        }
        description="Stok barang pada transaksi ini akan dikembalikan secara otomatis ke inventori."
        maxWidth="sm"
      >
        {selectedTxForVoid && (
          <div className="space-y-3.5">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">No. Invoice:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedTxForVoid.invoice_no}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Total Nominal:</span>
                <span className="font-bold text-rose-700">
                  {formatRupiah(selectedTxForVoid.total_amount)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Pembatalan / Void *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Salah input jumlah barang / Pelanggan ganti produk / Uang ditarik kembali"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTxForVoid(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isVoiding}
                onClick={handleConfirmVoid}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-soft"
              >
                {isVoiding ? 'Memproses...' : 'Ya, Batalkan Nota'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal for Reprinting */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={selectedTxForDetail}
      />
    </div>
  );
}
