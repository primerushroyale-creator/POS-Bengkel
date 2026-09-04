'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/stores/useCartStore';
import { formatRupiah, formatRibuan, parseRupiah } from '@/lib/utils';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Car,
  Tag,
  ArrowRight,
  X,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartDrawerProps {
  onOpenVehicleModal: () => void;
  onOpenCheckout: () => void;
  isDesktopInline?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onOpenVehicleModal,
  onOpenCheckout,
  isDesktopInline = false,
}) => {
  const {
    items,
    selectedVehicle,
    setSelectedVehicle,
    discount,
    setDiscount,
    notes,
    setNotes,
    updateQty,
    removeItem,
    clearCart,
    isCartDrawerOpen,
    setCartDrawerOpen,
    getSubtotal,
    getTotal,
    getItemCount,
  } = useCartStore();

  const [showDiscountInput, setShowDiscountInput] = useState(false);

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const total = getTotal();

  const cartContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Keranjang Transaksi</h3>
            <span className="text-[11px] text-slate-500">{itemCount} item dipilih</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs font-semibold"
              title="Kosongkan Keranjang"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {!isDesktopInline && (
            <button
              onClick={() => setCartDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Selected Vehicle Badge / Selector */}
      <div className="px-4 py-2.5 bg-indigo-50/50 border-b border-indigo-100/50 flex items-center justify-between">
        {selectedVehicle ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="text-xs font-extrabold text-slate-800 font-mono block leading-none">
                  {selectedVehicle.plate_number}
                </span>
                <span className="text-[10px] text-slate-500">
                  {selectedVehicle.owner_name} ({selectedVehicle.vehicle_type})
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="text-[11px] text-rose-500 hover:underline font-semibold"
            >
              Hapus
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenVehicleModal}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/50 rounded-lg border border-dashed border-indigo-200 transition-colors"
          >
            <Car className="w-3.5 h-3.5" />
            <span>+ Hubungkan Kendaraan / Pelanggan</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-start justify-between gap-2 p-2.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-soft-sm"
            >
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold text-slate-800 line-clamp-1">
                  {item.product.name}
                </h5>
                <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                  {formatRupiah(item.product.price)}
                </p>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => updateQty(item.product.id, item.qty - 1)}
                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors active:scale-90"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-800">
                  {item.qty}
                </span>
                <button
                  onClick={() => updateQty(item.product.id, item.qty + 1)}
                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors active:scale-90"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
            <ShoppingCart className="w-10 h-10 mb-2 stroke-1 opacity-40" />
            <p className="text-xs font-medium">Keranjang masih kosong</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Pilih barang/jasa dari katalog</p>
          </div>
        )}
      </div>

      {/* Cart Summary & Checkout */}
      {items.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          {/* Discount Accordion / Input */}
          <div>
            <button
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-indigo-600 py-1"
            >
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>Diskon / Potongan Harga</span>
              </span>
              <span className="text-xs font-bold text-indigo-600">
                {discount > 0 ? `-${formatRupiah(discount)}` : '+ Tambah'}
              </span>
            </button>

            {showDiscountInput && (
              <div className="mt-2 space-y-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nominal Diskon (Rp)"
                  value={discount > 0 ? formatRibuan(discount) : ''}
                  onChange={(e) => setDiscount(parseRupiah(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <div className="flex gap-1.5">
                  {[5000, 10000, 20000, 50000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDiscount(preset)}
                      className="flex-1 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      {preset / 1000}rb
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subtotal & Total Display */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700">{formatRupiah(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-600">
                <span>Diskon</span>
                <span className="font-semibold">-{formatRupiah(discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm sm:text-base font-extrabold text-slate-900 pt-1">
              <span>Total Tagihan</span>
              <span className="text-indigo-600">{formatRupiah(total)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={() => {
              if (!isDesktopInline) setCartDrawerOpen(false);
              onOpenCheckout();
            }}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-soft shadow-indigo-200 transition-all min-h-[48px]"
          >
            <span>Bayar / Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  if (isDesktopInline) {
    return (
      <div className="hidden lg:flex flex-col w-80 xl:w-96 bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden h-[calc(100vh-6rem)] sticky top-20">
        {cartContent}
      </div>
    );
  }

  // Mobile Bottom Sheet
  if (!isCartDrawerOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => setCartDrawerOpen(false)}
      />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl border-t border-slate-100 max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2" />
        {cartContent}
      </div>
    </div>
  );
};
