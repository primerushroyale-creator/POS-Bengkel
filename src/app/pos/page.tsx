'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useState, useMemo } from 'react';
import { Product, Vehicle, Transaction } from '@/types';
import { BengkelStorage } from '@/lib/storage';
import { useCartStore } from '@/stores/useCartStore';
import { useDataStore } from '@/stores/useDataStore';
import { formatRupiah } from '@/lib/utils';
import { ProductCard } from '@/components/pos/ProductCard';
import { CartDrawer } from '@/components/pos/CartDrawer';
import { VehicleSelectorModal } from '@/components/pos/VehicleSelectorModal';
import { CheckoutModal } from '@/components/pos/CheckoutModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import {
  Search,
  ShoppingCart,
  Car,
  Filter,
  Package,
  Wrench,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PosPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // Cart Store
  const {
    items,
    addItem,
    selectedVehicle,
    setSelectedVehicle,
    isCartDrawerOpen,
    setCartDrawerOpen,
    isCheckoutOpen,
    setCheckoutOpen,
    isReceiptOpen,
    setReceiptOpen,
    lastCompletedTx,
    getItemCount,
    getTotal,
  } = useCartStore();

  // Reactive Realtime Products Data Store
  const { products } = useDataStore();

  // Category list
  const categories = [
    { id: 'all', label: 'Semua', icon: Layers },
    { id: 'barang', label: 'Barang / Sparepart', icon: Package },
    { id: 'jasa', label: 'Jasa Servis', icon: Wrench },
    { id: 'Oli & Pelumas', label: 'Oli & Pelumas' },
    { id: 'Pengereman', label: 'Pengereman' },
    { id: 'Pengapian', label: 'Pengapian' },
    { id: 'CVT', label: 'CVT & Matik' },
    { id: 'Ban & Velg', label: 'Ban' },
  ];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory === 'barang' && p.category !== 'barang') return false;
      if (selectedCategory === 'jasa' && p.category !== 'jasa') return false;
      if (
        selectedCategory !== 'all' &&
        selectedCategory !== 'barang' &&
        selectedCategory !== 'jasa' &&
        p.sub_category !== selectedCategory
      ) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.sub_category && p.sub_category.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [products, selectedCategory, search]);

  const itemCount = getItemCount();
  const total = getTotal();

  const handleCheckoutSuccess = (tx: Transaction) => {
    setReceiptOpen(true, tx);
  };

  return (
    <div className="flex gap-6 relative">
      {/* Main Catalog Column */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Top Controls: Search Bar & Vehicle Quick Indicator */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari barang, oli, sparepart, atau jasa servis..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl shadow-soft-sm text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[48px]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-1"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Quick Vehicle Select Button (Mobile & Desktop) */}
          <button
            onClick={() => setIsVehicleModalOpen(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all text-left shrink-0 min-h-[48px]',
              selectedVehicle
                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-soft-sm'
                : 'bg-white border-slate-200/80 text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
            )}
          >
            <Car className="w-5 h-5 text-indigo-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                Kendaraan
              </span>
              <span className="text-xs font-mono font-extrabold truncate max-w-[130px]">
                {selectedVehicle ? selectedVehicle.plate_number : '+ Pilih Plat No'}
              </span>
            </div>
          </button>
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all select-none min-h-[40px]',
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-soft shadow-indigo-200'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Product Grid: 2 columns on Mobile, 3-5 columns on Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const inCart = items.find((i) => i.product.id === product.id);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addItem}
                  cartQty={inCart ? inCart.qty : 0}
                />
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-8">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
              <p className="text-sm font-semibold text-slate-600">Tidak ada item yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">
                Coba ubah kata kunci pencarian atau ganti filter kategori.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Persistent Side Cart Panel */}
      <CartDrawer
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
        onOpenCheckout={() => setCheckoutOpen(true)}
        isDesktopInline={true}
      />

      {/* Mobile Floating Cart Bar (Appears when item is selected) */}
      {itemCount > 0 && (
        <div className="lg:hidden fixed bottom-18 left-3 right-3 z-30 max-w-lg mx-auto animate-in slide-in-from-bottom-5 duration-200">
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="w-full flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-2xl shadow-soft-lg border border-slate-700/50 backdrop-blur-md active:scale-[0.99] transition-all min-h-[52px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-soft">
                {itemCount}
              </div>
              <div className="text-left">
                <span className="text-[11px] text-slate-400 block -mb-0.5">Total Belanja</span>
                <span className="text-sm font-extrabold text-white">{formatRupiah(total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
              <span>Lihat Keranjang</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Slide-Up Cart Sheet */}
      <CartDrawer
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
        onOpenCheckout={() => setCheckoutOpen(true)}
        isDesktopInline={false}
      />

      {/* Modals */}
      <VehicleSelectorModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSelectVehicle={(veh) => setSelectedVehicle(veh)}
        selectedVehicleId={selectedVehicle?.id}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setReceiptOpen(false)}
        transaction={lastCompletedTx}
        onNewTransaction={() => setReceiptOpen(false)}
      />
    </div>
  );
}
