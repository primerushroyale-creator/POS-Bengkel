'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';
import { formatRupiah, parseRupiah } from '@/lib/utils';
import { BengkelStorage } from '@/lib/storage';
import { PaymentMethod, Transaction } from '@/types';
import {
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Receipt,
  Car,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: Transaction) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { items, selectedVehicle, discount, notes, getTotal, clearCart } = useCartStore();
  const { currentUser } = useAuthStore();
  const { success, error } = useToastStore();

  const total = getTotal();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashGiven, setCashGiven] = useState<number>(total);
  const [cashInputRaw, setCashInputRaw] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCashGiven(total);
      setCashInputRaw(total.toString());
      setPaymentMethod('tunai');
    }
  }, [isOpen, total]);

  const changeAmount = paymentMethod === 'tunai' ? Math.max(0, cashGiven - total) : 0;
  const isCashInsufficient = paymentMethod === 'tunai' && cashGiven < total;

  const handleCashChange = (val: string) => {
    const numeric = parseRupiah(val);
    setCashGiven(numeric);
    setCashInputRaw(numeric > 0 ? numeric.toString() : '');
  };

  const setExactCash = () => {
    setCashGiven(total);
    setCashInputRaw(total.toString());
  };

  const addCashAmount = (amount: number) => {
    const next = (cashGiven || 0) + amount;
    setCashGiven(next);
    setCashInputRaw(next.toString());
  };

  const handleProcessCheckout = () => {
    if (items.length === 0) {
      error('Keranjang belanja kosong!');
      return;
    }

    if (isCashInsufficient) {
      error('Nominal uang tunai kurang dari total tagihan!');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = BengkelStorage.checkout({
        cashier_id: currentUser?.id,
        cashier_name: currentUser?.name || 'Kasir',
        vehicle_id: selectedVehicle?.id,
        vehicle_plate: selectedVehicle?.plate_number,
        vehicle_owner: selectedVehicle?.owner_name,
        vehicle_type: selectedVehicle?.vehicle_type,
        items,
        discount_amount: discount,
        payment_method: paymentMethod,
        cash_given: cashGiven,
        notes,
      });

      if (!result.success || !result.transaction) {
        error(result.error || 'Gagal memproses transaksi.');
        setIsSubmitting(false);
        return;
      }

      success(`Transaksi ${result.transaction.invoice_no} Berhasil!`);
      clearCart();
      onClose();
      onSuccess(result.transaction);
    } catch (err: any) {
      error(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-indigo-600">
          <Receipt className="w-5 h-5" />
          <span>Pembayaran & Checkout</span>
        </div>
      }
      description="Konfirmasi metode pembayaran dan selesaikan transaksi"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Total Bill Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Pembayaran</span>
            <span className="text-2xl font-black text-indigo-600 tracking-tight">
              {formatRupiah(total)}
            </span>
          </div>

          {selectedVehicle && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Kendaraan</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {selectedVehicle.plate_number}
              </span>
              <span className="text-[11px] text-slate-500 block truncate max-w-[120px]">
                {selectedVehicle.owner_name}
              </span>
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Pilih Metode Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'tunai', label: 'Tunai / Cash', icon: Banknote },
              { id: 'qris', label: 'QRIS', icon: QrCode },
              { id: 'transfer', label: 'Transfer', icon: CreditCard },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={cn(
                    'flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-h-[54px] select-none',
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-soft'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <Icon className={cn('w-5 h-5 mb-1', isSelected ? 'text-white' : 'text-indigo-600')} />
                  <span className="text-xs">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cash Calculation Section (Only for Tunai) */}
        {paymentMethod === 'tunai' ? (
          <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Uang Diterima (Rp)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={cashInputRaw}
                  onChange={(e) => handleCashChange(e.target.value)}
                  placeholder="0"
                  className="w-full pl-4 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[48px]"
                />
              </div>
            </div>

            {/* Quick Cash Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={setExactCash}
                className="py-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors shadow-soft-sm"
              >
                Uang Pas
              </button>
              <button
                type="button"
                onClick={() => addCashAmount(50000)}
                className="py-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors shadow-soft-sm"
              >
                +50rb
              </button>
              <button
                type="button"
                onClick={() => addCashAmount(100000)}
                className="py-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors shadow-soft-sm"
              >
                +100rb
              </button>
              <button
                type="button"
                onClick={() => setCashGiven(200000)}
                className="py-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors shadow-soft-sm"
              >
                200rb
              </button>
            </div>

            {/* Change / Kembalian Calculation */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-600">Kembalian:</span>
              <span
                className={cn(
                  'text-base font-extrabold font-mono',
                  isCashInsufficient ? 'text-rose-600' : 'text-emerald-600'
                )}
              >
                {isCashInsufficient ? 'Uang Kurang' : formatRupiah(changeAmount)}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <p className="text-xs text-slate-600">
              {paymentMethod === 'qris'
                ? 'Scan QRIS bengkel di meja kasir. Pastikan status transaksi Berhasil di m-banking pelanggan.'
                : 'Silakan verifikasi bukti transfer pelanggan sebelum menyelesaikan transaksi.'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          disabled={isSubmitting || isCashInsufficient}
          onClick={handleProcessCheckout}
          className={cn(
            'w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all min-h-[48px] shadow-soft',
            isCashInsufficient || isSubmitting
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white shadow-indigo-200'
          )}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{isSubmitting ? 'Memproses...' : 'Selesaikan Transaksi & Cetak'}</span>
        </button>
      </div>
    </Modal>
  );
};
