'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Transaction } from '@/types';
import {
  PrinterConfig,
  defaultPrinterConfig,
  printViaBluetooth,
  getRawBtIntentUrl,
  generateWhatsAppReceiptText,
} from '@/lib/printer';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { useToastStore } from '@/stores/useToastStore';
import {
  Printer,
  Share2,
  Smartphone,
  CheckCircle,
  RotateCcw,
  Settings2,
  Download,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onNewTransaction?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onNewTransaction,
}) => {
  const { success, error, info } = useToastStore();
  const [paperWidth, setPaperWidth] = useState<'58' | '80'>('58');
  const [isPrintingBt, setIsPrintingBt] = useState(false);

  if (!transaction) return null;

  const printerConfig: PrinterConfig = {
    ...defaultPrinterConfig,
    paperWidth,
  };

  const handlePrintBluetooth = async () => {
    setIsPrintingBt(true);
    info('Mencari perangkat Bluetooth Thermal Printer...');
    const res = await printViaBluetooth(transaction, printerConfig);
    setIsPrintingBt(false);
    if (res.success) {
      success(res.message);
    } else {
      error(res.message);
    }
  };

  const handleRawBtPrint = () => {
    const rawBtUrl = getRawBtIntentUrl(transaction, printerConfig);
    window.location.href = rawBtUrl;
  };

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppReceiptText(transaction, printerConfig);
    const phone = transaction.vehicle_owner ? '' : '';
    const waUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(waUrl, '_blank');
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle className="w-5 h-5" />
          <span>Transaksi Sukses • Cetak Struk</span>
        </div>
      }
      description={`No. Invoice: ${transaction.invoice_no}`}
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left / Top: Thermal Receipt Visual Preview (58mm / 80mm) */}
        <div className="md:col-span-6 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-xs font-bold text-slate-500">Preview Struk POS</span>
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setPaperWidth('58')}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors',
                  paperWidth === '58'
                    ? 'bg-indigo-600 text-white shadow-soft-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80')}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors',
                  paperWidth === '80'
                    ? 'bg-indigo-600 text-white shadow-soft-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                80mm
              </button>
            </div>
          </div>

          {/* Paper Box */}
          <div
            id="printable-receipt"
            className={cn(
              'w-full bg-white border border-slate-300 rounded-xl p-4 shadow-soft font-mono text-[12px] text-slate-800 leading-tight space-y-2 select-text',
              paperWidth === '58' ? 'max-w-[280px]' : 'max-w-[340px]'
            )}
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              <p className="font-extrabold text-sm">{printerConfig.workshopName}</p>
              <p className="text-[11px] text-slate-600">{printerConfig.address}</p>
              <p className="text-[10px] text-slate-500">Telp: {printerConfig.phone}</p>
            </div>

            {/* Metadata */}
            <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-slate-400">
              <div className="flex justify-between">
                <span>Nota:</span>
                <span className="font-bold">{transaction.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDateIndo(transaction.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.cashier_name || 'Kasir'}</span>
              </div>
              {transaction.vehicle_plate && (
                <div className="flex justify-between font-bold">
                  <span>No. Pol:</span>
                  <span>{transaction.vehicle_plate}</span>
                </div>
              )}
              {transaction.vehicle_owner && (
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{transaction.vehicle_owner}</span>
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="space-y-1.5 py-1 pb-2 border-b border-dashed border-slate-400">
              {transaction.details.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold text-slate-800 truncate">{item.product_name}</div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>
                      {item.qty} x {formatRupiah(item.price_at_sale)}
                    </span>
                    <span className="font-bold">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px] pt-1 pb-2 border-b border-dashed border-slate-400">
              {transaction.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon</span>
                  <span>-{formatRupiah(transaction.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold pt-0.5">
                <span>TOTAL</span>
                <span>{formatRupiah(transaction.total_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Bayar ({transaction.payment_method.toUpperCase()})</span>
                <span>{formatRupiah(transaction.cash_given)}</span>
              </div>
              {transaction.payment_method === 'tunai' && (
                <div className="flex justify-between text-slate-600">
                  <span>Kembali</span>
                  <span>{formatRupiah(transaction.change_amount)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-500 pt-1">
              <p>Terima kasih atas kunjungan Anda!</p>
              <p>Garansi servis 7 hari kerja.</p>
            </div>
          </div>
        </div>

        {/* Right / Bottom: Print & Share Actions */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Opsi Cetak & Kirim Struk
            </h4>

            {/* 1. Bluetooth Thermal Print */}
            <button
              onClick={handlePrintBluetooth}
              disabled={isPrintingBt}
              className="w-full p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-soft transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5" />
                <span>{isPrintingBt ? 'Menghubungkan...' : 'Cetak Thermal (Bluetooth)'}</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono">
                ESC/POS
              </span>
            </button>

            {/* 2. RawBT Direct Intent */}
            <button
              onClick={handleRawBtPrint}
              className="w-full p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-soft transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>RawBT Direct Print (Android)</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono">
                Intent
              </span>
            </button>

            {/* 3. WhatsApp Share */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-soft transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-5 h-5" />
                <span>Kirim Struk via WhatsApp</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono">WA</span>
            </button>

            {/* 4. Browser Print Layout */}
            <button
              onClick={handleBrowserPrint}
              className="w-full p-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-slate-500" />
                <span>Cetak Standar Browser / PDF</span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                Ctrl+P
              </span>
            </button>
          </div>

          {/* New Transaction Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                onClose();
                if (onNewTransaction) onNewTransaction();
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors min-h-[46px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Selesai & Transaksi Baru</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
