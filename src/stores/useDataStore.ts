import { create } from 'zustand';
import {
  Product,
  Transaction,
  DashboardStats,
  WorkOrder,
  Vehicle,
  CheckoutPayload,
} from '@/types';
import { BengkelStorage } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface DataStoreState {
  products: Product[];
  transactions: Transaction[];
  workOrders: WorkOrder[];
  vehicles: Vehicle[];
  stats: DashboardStats | null;
  isRealtimeConnected: boolean;
  lastSyncedAt: string | null;
  isLoading: boolean;

  // Actions
  loadLocalData: () => void;
  refreshData: () => Promise<void>;
  initRealtimeSubscription: () => () => void;

  // Cloud + Local Synced Mutations
  saveProduct: (product: Partial<Product> & { name: string; price: number }) => Promise<Product>;
  deleteProduct: (id: string) => Promise<boolean>;
  updateProductStock: (id: string, newStock: number) => Promise<Product | null>;

  saveWorkOrder: (order: Partial<WorkOrder> & { vehicle_id: string }) => Promise<WorkOrder>;
  updateWorkOrderStatus: (id: string, status: WorkOrder['status']) => Promise<WorkOrder | null>;

  saveVehicle: (vehicle: Partial<Vehicle> & { plate_number: string; owner_name: string }) => Promise<Vehicle>;

  checkout: (payload: CheckoutPayload) => Promise<{ success: boolean; transaction?: Transaction; error?: string }>;
  voidTransaction: (
    transactionId: string,
    reason: string,
    userId?: string,
    userName?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const useDataStore = create<DataStoreState>((set, get) => ({
  products: [],
  transactions: [],
  workOrders: [],
  vehicles: [],
  stats: null,
  isRealtimeConnected: false,
  lastSyncedAt: null,
  isLoading: false,

  loadLocalData: () => {
    const products = BengkelStorage.getProducts();
    const transactions = BengkelStorage.getTransactions();
    const workOrders = BengkelStorage.getWorkOrders();
    const vehicles = BengkelStorage.getVehicles();
    const stats = BengkelStorage.getDashboardStats();
    set({
      products,
      transactions,
      workOrders,
      vehicles,
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
          BengkelStorage.setProducts(formattedProducts);
          set({ products: formattedProducts });
        }

        // Fetch vehicles
        const { data: dbVehicles, error: vehErr } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!vehErr && dbVehicles) {
          const formattedVehicles: Vehicle[] = dbVehicles.map((v) => ({
            id: v.id,
            plate_number: v.plate_number,
            owner_name: v.owner_name,
            owner_phone: v.owner_phone,
            vehicle_type: v.vehicle_type,
            notes: v.notes,
            last_service_date: v.last_service_date,
            created_at: v.created_at,
          }));
          BengkelStorage.setVehicles(formattedVehicles);
          set({ vehicles: formattedVehicles });
        }

        // Fetch work orders with vehicle and mechanic relations
        const { data: dbWorkOrders, error: woErr } = await supabase
          .from('work_orders')
          .select('*, vehicle:vehicles(*), mechanic:users(name)')
          .order('created_at', { ascending: false });

        if (!woErr && dbWorkOrders) {
          const formattedWorkOrders: WorkOrder[] = dbWorkOrders.map((wo: any) => ({
            id: wo.id,
            invoice_no: wo.invoice_no,
            vehicle_id: wo.vehicle_id,
            vehicle_plate: wo.vehicle?.plate_number || '',
            vehicle_type: wo.vehicle?.vehicle_type || '',
            owner_name: wo.vehicle?.owner_name || '',
            mechanic_id: wo.mechanic_id || undefined,
            mechanic_name: wo.mechanic?.name || undefined,
            status: wo.status,
            mileage: Number(wo.mileage || 0),
            complaint: wo.complaint || undefined,
            diagnosis: wo.diagnosis || undefined,
            notes: wo.notes || undefined,
            started_at: wo.started_at || undefined,
            completed_at: wo.completed_at || undefined,
            created_at: wo.created_at,
          }));
          BengkelStorage.setWorkOrders(formattedWorkOrders);
          set({ workOrders: formattedWorkOrders });
        }

        // Fetch transactions with details
        const { data: dbTx, error: txErr } = await supabase
          .from('transactions')
          .select('*, details:transaction_details(*), vehicle:vehicles(*), cashier:users(name)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!txErr && dbTx) {
          const formattedTx: Transaction[] = dbTx.map((t: any) => ({
            id: t.id,
            client_transaction_id: t.client_transaction_id,
            invoice_no: t.invoice_no,
            cashier_id: t.cashier_id,
            cashier_name: t.cashier_name || t.cashier?.name || 'Kasir',
            vehicle_id: t.vehicle_id,
            vehicle_plate: t.vehicle_plate || t.vehicle?.plate_number,
            vehicle_owner: t.vehicle_owner || t.vehicle?.owner_name,
            vehicle_type: t.vehicle_type || t.vehicle?.vehicle_type,
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
              product_name: d.product_name || '',
              product_code: d.product_code || '',
              category: d.category || 'barang',
              qty: Number(d.qty),
              price_at_sale: Number(d.price_at_sale),
              cost_at_sale: Number(d.cost_at_sale || 0),
              subtotal: Number(d.subtotal),
            })),
          }));
          BengkelStorage.setTransactions(formattedTx);
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

    // 2. Listen to BroadcastChannel for cross-tab realtime sync on same browser
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
                BengkelStorage.setProducts(updated);
                return {
                  products: updated,
                  stats: BengkelStorage.getDashboardStats(),
                  lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
                };
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
                BengkelStorage.setProducts(updated);
                return {
                  products: updated,
                  stats: BengkelStorage.getDashboardStats(),
                  lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
                };
              });
            } else if (payload.eventType === 'DELETE') {
              set((state) => {
                const updated = state.products.filter((p) => p.id !== payload.old.id);
                BengkelStorage.setProducts(updated);
                return {
                  products: updated,
                  stats: BengkelStorage.getDashboardStats(),
                  lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
                };
              });
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
                client_transaction_id: payload.new.client_transaction_id,
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
                BengkelStorage.setTransactions(updated);
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
                BengkelStorage.setTransactions(updated);
                return {
                  transactions: updated,
                  stats: BengkelStorage.getDashboardStats(),
                  lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
                };
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'work_orders' },
          (payload) => {
            // Realtime SPK / Work Order status change
            if (payload.eventType === 'INSERT') {
              const currentVehicles = get().vehicles;
              const matchedVeh = currentVehicles.find((v) => v.id === payload.new.vehicle_id);
              const newOrder: WorkOrder = {
                id: payload.new.id,
                invoice_no: payload.new.invoice_no,
                vehicle_id: payload.new.vehicle_id,
                vehicle_plate: matchedVeh?.plate_number || payload.new.vehicle_plate || '',
                vehicle_type: matchedVeh?.vehicle_type || payload.new.vehicle_type || '',
                owner_name: matchedVeh?.owner_name || payload.new.owner_name || '',
                mechanic_id: payload.new.mechanic_id,
                mechanic_name: payload.new.mechanic_name,
                status: payload.new.status,
                mileage: Number(payload.new.mileage || 0),
                complaint: payload.new.complaint,
                diagnosis: payload.new.diagnosis,
                notes: payload.new.notes,
                started_at: payload.new.started_at,
                completed_at: payload.new.completed_at,
                created_at: payload.new.created_at,
              };
              set((state) => {
                const exists = state.workOrders.some((o) => o.id === newOrder.id);
                const updated = exists
                  ? state.workOrders.map((o) => (o.id === newOrder.id ? newOrder : o))
                  : [newOrder, ...state.workOrders];
                BengkelStorage.setWorkOrders(updated);
                return {
                  workOrders: updated,
                  lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
                };
              });
            } else if (payload.eventType === 'UPDATE') {
              set((state) => {
                const updated = state.workOrders.map((o) => {
                  if (o.id === payload.new.id) {
                    return {
                      ...o,
                      status: payload.new.status ?? o.status,
                      mechanic_id: payload.new.mechanic_id ?? o.mechanic_id,
                      mileage: Number(payload.new.mileage ?? o.mileage),
                      complaint: payload.new.complaint ?? o.complaint,
                      diagnosis: payload.new.diagnosis ?? o.diagnosis,
                      notes: payload.new.notes ?? o.notes,
                      started_at: payload.new.started_at ?? o.started_at,
                      completed_at: payload.new.completed_at ?? o.completed_at,
                    };
                  }
                  return o;
                });
                BengkelStorage.setWorkOrders(updated);
                return {
                  workOrders: updated,
                  lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
                };
              });
            } else if (payload.eventType === 'DELETE') {
              set((state) => {
                const updated = state.workOrders.filter((o) => o.id !== payload.old.id);
                BengkelStorage.setWorkOrders(updated);
                return {
                  workOrders: updated,
                  lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
                };
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'transactions' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newTx = payload.new;
              if (newTx.status === 'completed') {
                // Trigger event for UI to play sound and show toast
                if (typeof window !== 'undefined') {
                  const event = new CustomEvent('bengkel_new_transaction', { detail: newTx });
                  window.dispatchEvent(event);
                }
              }
              // Data sync will happen via refreshData which is called below anyway if needed,
              // or we can optimistically insert it here.
              // Wait, the regular refresh logic will fetch this. But let's insert it locally if missing.
              set((state) => {
                const exists = state.transactions.some((t) => t.id === newTx.id);
                if (!exists) {
                  // For a complete transaction we actually need its details, 
                  // which are not in this payload. So we should just trigger a refresh.
                  // But we don't want to spam refreshData.
                  // We'll let refreshData run (we can call it explicitly).
                  setTimeout(() => get().refreshData(), 500);
                }
                return state;
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vehicles' },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newVeh: Vehicle = {
                id: payload.new.id,
                plate_number: payload.new.plate_number,
                owner_name: payload.new.owner_name,
                owner_phone: payload.new.owner_phone,
                vehicle_type: payload.new.vehicle_type,
                notes: payload.new.notes,
                last_service_date: payload.new.last_service_date,
                created_at: payload.new.created_at,
              };
              set((state) => {
                const exists = state.vehicles.some((v) => v.id === newVeh.id);
                const updated = exists
                  ? state.vehicles.map((v) => (v.id === newVeh.id ? newVeh : v))
                  : [newVeh, ...state.vehicles];
                BengkelStorage.setVehicles(updated);
                return {
                  vehicles: updated,
                  lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
                };
              });
            } else if (payload.eventType === 'DELETE') {
              set((state) => {
                const updated = state.vehicles.filter((v) => v.id !== payload.old.id);
                BengkelStorage.setVehicles(updated);
                return {
                  vehicles: updated,
                  lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
                };
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            set({ isRealtimeConnected: true });
            get().refreshData();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            set({ isRealtimeConnected: false });
          }
        });
    } else {
      // Standalone mode: mark realtime connected via local broadcast
      set({ isRealtimeConnected: true });
    }

    // Return cleanup function
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

  // CLOUD + LOCAL SYNCED MUTATIONS
  saveProduct: async (product) => {
    // 1. Optimistic Local Save
    const saved = BengkelStorage.saveProduct(product);
    set((state) => {
      const exists = state.products.some((p) => p.id === saved.id);
      const updated = exists
        ? state.products.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...state.products];
      return {
        products: updated,
        stats: BengkelStorage.getDashboardStats(),
      };
    });

    // 2. Cloud Sync
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').upsert({
          id: saved.id,
          code: saved.code,
          name: saved.name,
          category: saved.category,
          sub_category: saved.sub_category,
          price: saved.price,
          cost_price: saved.cost_price,
          stock: saved.stock,
          min_stock: saved.min_stock,
          unit: saved.unit,
          is_active: saved.is_active,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Supabase saveProduct error:', err);
      }
    }

    return saved;
  },

  deleteProduct: async (id) => {
    // 1. Optimistic Local Delete
    BengkelStorage.deleteProduct(id);
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
      stats: BengkelStorage.getDashboardStats(),
    }));

    // 2. Cloud Sync
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase deleteProduct error:', err);
      }
    }

    return true;
  },

  updateProductStock: async (id, newStock) => {
    // 1. Optimistic Local Update
    const updated = BengkelStorage.updateProductStock(id, newStock);
    if (updated) {
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updated : p)),
        stats: BengkelStorage.getDashboardStats(),
      }));
    }

    // 2. Cloud Sync
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('products')
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.error('Supabase updateProductStock error:', err);
      }
    }

    return updated;
  },

  saveWorkOrder: async (order) => {
    // 1. Optimistic Local Save
    const saved = BengkelStorage.saveWorkOrder(order);
    set((state) => {
      const exists = state.workOrders.some((o) => o.id === saved.id);
      const updated = exists
        ? state.workOrders.map((o) => (o.id === saved.id ? saved : o))
        : [saved, ...state.workOrders];
      return { workOrders: updated };
    });

    // 2. Cloud Sync
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('work_orders').upsert({
          id: saved.id,
          invoice_no: saved.invoice_no,
          vehicle_id: saved.vehicle_id,
          mechanic_id: saved.mechanic_id || null,
          status: saved.status || 'pending',
          mileage: Number(saved.mileage) || 0,
          complaint: saved.complaint || null,
          diagnosis: saved.diagnosis || null,
          notes: saved.notes || null,
          started_at: saved.started_at || null,
          completed_at: saved.completed_at || null,
        });
      } catch (err) {
        console.error('Supabase saveWorkOrder error:', err);
      }
    }

    return saved;
  },

  updateWorkOrderStatus: async (id, status) => {
    // 1. Optimistic Local Update
    const updated = BengkelStorage.updateWorkOrderStatus(id, status);
    if (updated) {
      set((state) => ({
        workOrders: state.workOrders.map((o) => (o.id === id ? updated : o)),
      }));
    }

    // 2. Cloud Sync
    if (isSupabaseConfigured && supabase) {
      try {
        const patch: any = { status };
        if (status === 'in_progress' && updated?.started_at) {
          patch.started_at = updated.started_at;
        } else if (status === 'completed' && updated?.completed_at) {
          patch.completed_at = updated.completed_at;
        }
        await supabase.from('work_orders').update(patch).eq('id', id);
      } catch (err) {
        console.error('Supabase updateWorkOrderStatus error:', err);
      }
    }

    return updated;
  },

  saveVehicle: async (vehicle) => {
    // 1. Optimistic Local Save
    const saved = BengkelStorage.saveVehicle(vehicle);
    set((state) => {
      const exists = state.vehicles.some((v) => v.id === saved.id);
      const updated = exists
        ? state.vehicles.map((v) => (v.id === saved.id ? saved : v))
        : [saved, ...state.vehicles];
      return { vehicles: updated };
    });

    // 2. Cloud Sync
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('vehicles').upsert({
          id: saved.id,
          plate_number: saved.plate_number,
          owner_name: saved.owner_name,
          owner_phone: saved.owner_phone || null,
          vehicle_type: saved.vehicle_type,
          notes: saved.notes || null,
          last_service_date: saved.last_service_date || null,
        });
      } catch (err) {
        console.error('Supabase saveVehicle error:', err);
      }
    }

    return saved;
  },

  checkout: async (payload) => {
    // 1. Atomic Local Checkout
    const result = BengkelStorage.checkout(payload);
    if (!result.success || !result.transaction) {
      return result;
    }

    // Update local state immediately
    const tx = result.transaction;
    set((state) => ({
      transactions: [tx, ...state.transactions.filter((t) => t.id !== tx.id)],
      products: BengkelStorage.getProducts(),
      stats: BengkelStorage.getDashboardStats(),
    }));

    // 2. Cloud Sync with Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        // Attempt RPC call first
        const rpcPayload = {
          p_invoice_no: tx.invoice_no,
          p_cashier_id: payload.cashier_id || null,
          p_vehicle_id: payload.vehicle_id || null,
          p_total_amount: tx.total_amount,
          p_discount_amount: tx.discount_amount,
          p_cash_given: tx.cash_given,
          p_change_amount: tx.change_amount,
          p_payment_method: payload.payment_method,
          p_items: payload.items.map((it) => ({
            product_id: it.product.id,
            qty: it.qty,
            price: it.product.price,
          })),
          p_notes: payload.notes || null,
          p_client_transaction_id: payload.client_transaction_id || null,
        };

        const { error: rpcErr } = await supabase.rpc('fn_checkout_transaction', rpcPayload);

        // Fallback: If stored procedure fails (e.g. not created yet), perform direct table inserts
        if (rpcErr) {
          console.warn('RPC fn_checkout_transaction fallback:', rpcErr.message);

          // Insert transaction header
          await supabase.from('transactions').insert({
            id: tx.id,
            invoice_no: tx.invoice_no,
            cashier_id: tx.cashier_id || null,
            vehicle_id: tx.vehicle_id || null,
            total_amount: tx.total_amount,
            discount_amount: tx.discount_amount,
            cash_given: tx.cash_given,
            change_amount: tx.change_amount,
            payment_method: tx.payment_method,
            status: tx.status,
            notes: tx.notes || null,
            client_transaction_id: tx.client_transaction_id || null,
            created_at: tx.created_at,
          });

          // Insert transaction details
          if (tx.details && tx.details.length > 0) {
            await supabase.from('transaction_details').insert(
              tx.details.map((d) => ({
                id: d.id,
                transaction_id: tx.id,
                product_id: d.product_id,
                qty: d.qty,
                price_at_sale: d.price_at_sale,
                cost_at_sale: d.cost_at_sale,
                subtotal: d.subtotal,
              }))
            );
          }

          // Deduct stock for each item in Supabase products
          for (const item of payload.items) {
            if (item.product.category === 'barang') {
              const currentStock = BengkelStorage.getProducts().find(
                (p) => p.id === item.product.id
              )?.stock;
              if (typeof currentStock === 'number') {
                await supabase
                  .from('products')
                  .update({ stock: currentStock, updated_at: new Date().toISOString() })
                  .eq('id', item.product.id);
              }
            }
          }

          // Update vehicle last service date
          if (payload.vehicle_id) {
            await supabase
              .from('vehicles')
              .update({ last_service_date: new Date().toISOString() })
              .eq('id', payload.vehicle_id);
          }
        }
      } catch (cloudErr) {
        console.error('Supabase checkout cloud sync error:', cloudErr);
      }
    }

    return result;
  },

  voidTransaction: async (transactionId, reason, userId, userName) => {
    // 1. Local Void
    const result = BengkelStorage.voidTransaction(transactionId, reason, userId, userName);
    if (!result.success) {
      return result;
    }

    // Update local state
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'void',
              void_reason: reason,
              voided_at: new Date().toISOString(),
              voided_by: userName || 'Admin',
            }
          : t
      ),
      products: BengkelStorage.getProducts(),
      stats: BengkelStorage.getDashboardStats(),
    }));

    // 2. Cloud Sync
    if (isSupabaseConfigured && supabase) {
      try {
        const { error: rpcErr } = await supabase.rpc('fn_void_transaction', {
          p_transaction_id: transactionId,
          p_user_id: userId || null,
          p_reason: reason,
        });

        if (rpcErr) {
          console.warn('RPC fn_void_transaction fallback:', rpcErr.message);
          await supabase
            .from('transactions')
            .update({
              status: 'void',
              void_reason: reason,
              voided_at: new Date().toISOString(),
              voided_by: userId || null,
            })
            .eq('id', transactionId);

          // Restore stock in Supabase products
          const tx = get().transactions.find((t) => t.id === transactionId);
          if (tx?.details) {
            for (const detail of tx.details) {
              if (detail.category === 'barang') {
                const currentProd = BengkelStorage.getProducts().find(
                  (p) => p.id === detail.product_id
                );
                if (currentProd) {
                  await supabase
                    .from('products')
                    .update({ stock: currentProd.stock, updated_at: new Date().toISOString() })
                    .eq('id', detail.product_id);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Supabase voidTransaction cloud sync error:', err);
      }
    }

    return result;
  },
}));
