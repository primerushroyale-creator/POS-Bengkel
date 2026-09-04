import { create } from 'zustand';
import { Product, Transaction, DashboardStats } from '@/types';
import { BengkelStorage } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface DataStoreState {
  products: Product[];
  transactions: Transaction[];
  stats: DashboardStats | null;
  isRealtimeConnected: boolean;
  lastSyncedAt: string | null;
  isLoading: boolean;

  // Actions
  loadLocalData: () => void;
  refreshData: () => Promise<void>;
  initRealtimeSubscription: () => () => void;
}

export const useDataStore = create<DataStoreState>((set, get) => ({
  products: [],
  transactions: [],
  stats: null,
  isRealtimeConnected: false,
  lastSyncedAt: null,
  isLoading: false,

  loadLocalData: () => {
    const products = BengkelStorage.getProducts();
    const transactions = BengkelStorage.getTransactions();
    const stats = BengkelStorage.getDashboardStats();
    set({
      products,
      transactions,
      stats,
      lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
    });
  },

  refreshData: async () => {
    // 1. Always load current local storage as baseline
    get().loadLocalData();

    // 2. If Supabase is configured, fetch latest data from database
    if (isSupabaseConfigured && supabase) {
      try {
        set({ isLoading: true });

        // Fetch products
        const { data: dbProducts, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .order('name');

        if (!prodErr && dbProducts) {
          // Sync with local storage
          const formattedProducts: Product[] = dbProducts.map((p) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            category: p.category,
            sub_category: p.sub_category,
            price: Number(p.price),
            cost_price: Number(p.cost_price || 0),
            stock: Number(p.stock),
            min_stock: Number(p.min_stock || 3),
            unit: p.unit || 'Pcs',
            is_active: p.is_active,
            created_at: p.created_at,
            updated_at: p.updated_at,
          }));
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('bengkel_products', JSON.stringify(formattedProducts));
          }
          set({ products: formattedProducts });
        }

        // Fetch transactions with details
        const { data: dbTx, error: txErr } = await supabase
          .from('transactions')
          .select('*, details:transaction_details(*)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!txErr && dbTx) {
          const formattedTx: Transaction[] = dbTx.map((t) => ({
            id: t.id,
            invoice_no: t.invoice_no,
            cashier_id: t.cashier_id,
            cashier_name: t.cashier_name || 'Kasir',
            vehicle_id: t.vehicle_id,
            vehicle_plate: t.vehicle_plate,
            vehicle_owner: t.vehicle_owner,
            vehicle_type: t.vehicle_type,
            total_amount: Number(t.total_amount),
            discount_amount: Number(t.discount_amount || 0),
            cash_given: Number(t.cash_given || 0),
            change_amount: Number(t.change_amount || 0),
            payment_method: t.payment_method,
            status: t.status,
            void_reason: t.void_reason,
            voided_at: t.voided_at,
            voided_by: t.voided_by,
            notes: t.notes,
            created_at: t.created_at,
            details: (t.details || []).map((d: any) => ({
              id: d.id,
              transaction_id: d.transaction_id,
              product_id: d.product_id,
              product_name: d.product_name,
              product_code: d.product_code,
              category: d.category,
              qty: Number(d.qty),
              price_at_sale: Number(d.price_at_sale),
              cost_at_sale: Number(d.cost_at_sale || 0),
              subtotal: Number(d.subtotal),
            })),
          }));
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('bengkel_transactions', JSON.stringify(formattedTx));
          }
          set({ transactions: formattedTx });
        }

        // Recalculate stats
        set({
          stats: BengkelStorage.getDashboardStats(),
          lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
        });
      } catch (err) {
        console.error('Error fetching Supabase data:', err);
      } finally {
        set({ isLoading: false });
      }
    }
  },

  initRealtimeSubscription: () => {
    // 1. Initial Load
    get().loadLocalData();

    // 2. Listen to BroadcastChannel for cross-tab realtime sync
    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel = new BroadcastChannel('bengkel_realtime_sync');
        broadcastChannel.onmessage = () => {
          get().loadLocalData();
        };
      } catch {}
    }

    // 3. Listen to same-window DOM events
    const handleStorageChanged = () => {
      get().loadLocalData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('bengkel_storage_changed', handleStorageChanged);
      window.addEventListener('storage', handleStorageChanged);
    }

    // 4. Reconnection & Visibility Change Fallback
    const handleVisibilityOrOnline = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        get().refreshData();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleVisibilityOrOnline);
      window.addEventListener('focus', handleVisibilityOrOnline);
      document.addEventListener('visibilitychange', handleVisibilityOrOnline);
    }

    // 5. Supabase Realtime Subscription (for cross-device cloud sync)
    let supabaseChannel: any = null;
    if (isSupabaseConfigured && supabase) {
      supabaseChannel = supabase
        .channel('public:bengkel_realtime_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            // Realtime Product / Stock Change
            if (payload.eventType === 'INSERT') {
              const newProd: Product = {
                id: payload.new.id,
                code: payload.new.code,
                name: payload.new.name,
                category: payload.new.category,
                sub_category: payload.new.sub_category,
                price: Number(payload.new.price),
                cost_price: Number(payload.new.cost_price || 0),
                stock: Number(payload.new.stock),
                min_stock: Number(payload.new.min_stock || 3),
                unit: payload.new.unit || 'Pcs',
                is_active: payload.new.is_active,
                created_at: payload.new.created_at,
                updated_at: payload.new.updated_at,
              };
              set((state) => {
                const exists = state.products.some((p) => p.id === newProd.id);
                const updated = exists
                  ? state.products.map((p) => (p.id === newProd.id ? newProd : p))
                  : [newProd, ...state.products];
                return { products: updated, lastSyncedAt: new Date().toLocaleTimeString('id-ID') };
              });
            } else if (payload.eventType === 'UPDATE') {
              set((state) => {
                const updated = state.products.map((p) => {
                  if (p.id === payload.new.id) {
                    return {
                      ...p,
                      ...payload.new,
                      price: Number(payload.new.price ?? p.price),
                      stock: Number(payload.new.stock ?? p.stock),
                      min_stock: Number(payload.new.min_stock ?? p.min_stock),
                    };
                  }
                  return p;
                });
                return { products: updated, lastSyncedAt: new Date().toLocaleTimeString('id-ID') };
              });
            } else if (payload.eventType === 'DELETE') {
              set((state) => ({
                products: state.products.filter((p) => p.id !== payload.old.id),
                lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
              }));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          (payload) => {
            // Realtime Transaction / Payment / Void Change
            if (payload.eventType === 'INSERT') {
              const newTx: Transaction = {
                id: payload.new.id,
                invoice_no: payload.new.invoice_no,
                cashier_id: payload.new.cashier_id,
                cashier_name: payload.new.cashier_name || 'Kasir',
                vehicle_id: payload.new.vehicle_id,
                vehicle_plate: payload.new.vehicle_plate,
                vehicle_owner: payload.new.vehicle_owner,
                vehicle_type: payload.new.vehicle_type,
                total_amount: Number(payload.new.total_amount),
                discount_amount: Number(payload.new.discount_amount || 0),
                cash_given: Number(payload.new.cash_given || 0),
                change_amount: Number(payload.new.change_amount || 0),
                payment_method: payload.new.payment_method,
                status: payload.new.status,
                void_reason: payload.new.void_reason,
                voided_at: payload.new.voided_at,
                voided_by: payload.new.voided_by,
                notes: payload.new.notes,
                created_at: payload.new.created_at,
                details: [],
              };
              set((state) => {
                const exists = state.transactions.some((t) => t.id === newTx.id);
                const updated = exists
                  ? state.transactions.map((t) => (t.id === newTx.id ? newTx : t))
                  : [newTx, ...state.transactions];
                return {
                  transactions: updated,
                  stats: BengkelStorage.getDashboardStats(),
                  lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
                };
              });
            } else if (payload.eventType === 'UPDATE') {
              set((state) => {
                const updated = state.transactions.map((t) => {
                  if (t.id === payload.new.id) {
                    return {
                      ...t,
                      status: payload.new.status,
                      void_reason: payload.new.void_reason,
                      voided_at: payload.new.voided_at,
                      voided_by: payload.new.voided_by,
                    };
                  }
                  return t;
                });
                return {
                  transactions: updated,
                  stats: BengkelStorage.getDashboardStats(),
                  lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
                };
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            set({ isRealtimeConnected: true });
            // Reconnection fallback: refetch once to prevent stale data
            get().refreshData();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            set({ isRealtimeConnected: false });
          }
        });
    } else {
      // Standalone mode: mark realtime connected via local broadcast
      set({ isRealtimeConnected: true });
    }

    // Return proper cleanup function
    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('bengkel_storage_changed', handleStorageChanged);
        window.removeEventListener('storage', handleStorageChanged);
        window.removeEventListener('online', handleVisibilityOrOnline);
        window.removeEventListener('focus', handleVisibilityOrOnline);
        document.removeEventListener('visibilitychange', handleVisibilityOrOnline);
      }
      if (supabaseChannel && supabase) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  },
}));
