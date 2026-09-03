import { create } from 'zustand';
import { Product, CartItem, Vehicle, Transaction } from '@/types';

interface CartState {
  items: CartItem[];
  selectedVehicle: Vehicle | null;
  discount: number;
  notes: string;
  isCartDrawerOpen: boolean;
  isCheckoutOpen: boolean;
  isReceiptOpen: boolean;
  lastCompletedTx: Transaction | null;

  // Actions
  addItem: (product: Product, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  setDiscount: (discount: number) => void;
  setNotes: (notes: string) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  clearCart: () => void;
  
  // Modals
  setCartDrawerOpen: (open: boolean) => void;
  setCheckoutOpen: (open: boolean) => void;
  setReceiptOpen: (open: boolean, tx?: Transaction | null) => void;

  // Computed Getters
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedVehicle: null,
  discount: 0,
  notes: '',
  isCartDrawerOpen: false,
  isCheckoutOpen: false,
  isReceiptOpen: false,
  lastCompletedTx: null,

  addItem: (product: Product, qty = 1) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.product.id === product.id);

    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const maxAllowed = product.category === 'barang' ? product.stock : 9999;
      const newQty = Math.min(existing.qty + qty, maxAllowed);
      
      const newItems = [...items];
      newItems[existingIndex] = {
        ...existing,
        qty: newQty,
        subtotal: newQty * product.price,
      };
      set({ items: newItems });
    } else {
      const initialQty = Math.min(qty, product.category === 'barang' ? product.stock : 9999);
      if (initialQty <= 0 && product.category === 'barang') return; // Don't add out of stock

      set({
        items: [
          ...items,
          {
            product,
            qty: initialQty,
            discount: 0,
            subtotal: initialQty * product.price,
          },
        ],
      });
    }
  },

  updateQty: (productId: string, qty: number) => {
    const { items } = get();
    if (qty <= 0) {
      set({ items: items.filter((i) => i.product.id !== productId) });
      return;
    }

    set({
      items: items.map((item) => {
        if (item.product.id === productId) {
          const maxAllowed = item.product.category === 'barang' ? item.product.stock : 9999;
          const finalQty = Math.min(qty, maxAllowed);
          return {
            ...item,
            qty: finalQty,
            subtotal: finalQty * item.product.price,
          };
        }
        return item;
      }),
    });
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }));
  },

  setDiscount: (discount: number) => {
    set({ discount: Math.max(0, discount) });
  },

  setNotes: (notes: string) => {
    set({ notes });
  },

  setSelectedVehicle: (vehicle: Vehicle | null) => {
    set({ selectedVehicle: vehicle });
  },

  clearCart: () => {
    set({
      items: [],
      selectedVehicle: null,
      discount: 0,
      notes: '',
      isCheckoutOpen: false,
    });
  },

  setCartDrawerOpen: (open: boolean) => set({ isCartDrawerOpen: open }),
  setCheckoutOpen: (open: boolean) => set({ isCheckoutOpen: open }),
  setReceiptOpen: (open: boolean, tx: Transaction | null = null) =>
    set({ isReceiptOpen: open, lastCompletedTx: tx }),

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.qty, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.subtotal, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().discount;
    return Math.max(0, subtotal - discount);
  },
}));
