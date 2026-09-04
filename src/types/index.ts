export type Role = 'admin' | 'kasir' | 'mekanik';

export type ProductCategory = 'barang' | 'jasa';

export type PaymentMethod = 'tunai' | 'qris' | 'transfer';

export type TransactionStatus = 'completed' | 'void';

export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  role: Role;
  pin_hash: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  sub_category?: string;
  price: number;
  cost_price?: number;
  stock: number;
  min_stock: number;
  unit?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  owner_name: string;
  owner_phone?: string;
  vehicle_type: string;
  notes?: string;
  last_service_date?: string;
  created_at?: string;
}

export interface TransactionDetail {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  category: ProductCategory;
  qty: number;
  price_at_sale: number;
  cost_at_sale?: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  invoice_no: string;
  cashier_id?: string;
  cashier_name?: string;
  vehicle_id?: string;
  vehicle_plate?: string;
  vehicle_owner?: string;
  vehicle_type?: string;
  total_amount: number;
  discount_amount: number;
  cash_given: number;
  change_amount: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  client_transaction_id?: string;
  void_reason?: string;
  voided_at?: string;
  voided_by?: string;
  notes?: string;
  created_at: string;
  details: TransactionDetail[];
}

export interface WorkOrder {
  id: string;
  invoice_no?: string;
  vehicle_id: string;
  vehicle_plate?: string;
  vehicle_type?: string;
  owner_name?: string;
  mechanic_id?: string;
  mechanic_name?: string;
  status: WorkOrderStatus;
  mileage?: number;
  complaint?: string;
  diagnosis?: string;
  notes?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  discount: number;
  subtotal: number;
  note?: string;
}

export interface CheckoutPayload {
  cashier_id?: string;
  cashier_name?: string;
  vehicle_id?: string;
  vehicle_plate?: string;
  vehicle_owner?: string;
  vehicle_type?: string;
  items: CartItem[];
  discount_amount: number;
  payment_method: PaymentMethod;
  cash_given: number;
  client_transaction_id?: string;
  notes?: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayTransactions: number;
  accumulativeRevenue: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  recentTransactions: Transaction[];
}
