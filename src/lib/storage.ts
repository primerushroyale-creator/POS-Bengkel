import {
  User,
  Product,
  Vehicle,
  Transaction,
  WorkOrder,
  AuditLog,
  CheckoutPayload,
  DashboardStats,
} from '@/types';
import { generateInvoiceNumber } from './utils';

// Initial Seed Users
const INITIAL_USERS: User[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Agus Prayitno',
    role: 'kasir',
    pin_hash: '1234',
    phone: '081234567801',
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Pak Bambang (Owner)',
    role: 'admin',
    pin_hash: '9999',
    phone: '081234567802',
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Doni Setiawan (Mekanik)',
    role: 'mekanik',
    pin_hash: '5678',
    phone: '081234567803',
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Rian Hidayat (Mekanik)',
    role: 'mekanik',
    pin_hash: '5678',
    phone: '081234567804',
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
  },
];

// Initial Seed Products
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    code: 'OIL-001',
    name: 'Oli Shell Advance AX7 Matic 10W-40 0.8L',
    category: 'barang',
    sub_category: 'Oli & Pelumas',
    price: 55000,
    cost_price: 42000,
    stock: 18,
    min_stock: 5,
    unit: 'Btl',
    is_active: true,
  },
  {
    id: 'a0000002-0000-0000-0000-000000000002',
    code: 'OIL-002',
    name: 'Oli AHM MPX2 Matic 10W-30 0.8L',
    category: 'barang',
    sub_category: 'Oli & Pelumas',
    price: 48000,
    cost_price: 37000,
    stock: 24,
    min_stock: 6,
    unit: 'Btl',
    is_active: true,
  },
  {
    id: 'a0000003-0000-0000-0000-000000000003',
    code: 'OIL-003',
    name: 'Oli Yamalube Silver 20W-40 0.8L Bebek',
    category: 'barang',
    sub_category: 'Oli & Pelumas',
    price: 42000,
    cost_price: 32000,
    stock: 12,
    min_stock: 4,
    unit: 'Btl',
    is_active: true,
  },
  {
    id: 'a0000004-0000-0000-0000-000000000004',
    code: 'OIL-004',
    name: 'Oli Gardan Matic Shell Scooter Gear 120ml',
    category: 'barang',
    sub_category: 'Oli & Pelumas',
    price: 18000,
    cost_price: 12000,
    stock: 30,
    min_stock: 5,
    unit: 'Tube',
    is_active: true,
  },
  {
    id: 'a0000005-0000-0000-0000-000000000005',
    code: 'OIL-005',
    name: 'Oli Motul 3100 Gold 4T 10W-40 1L',
    category: 'barang',
    sub_category: 'Oli & Pelumas',
    price: 85000,
    cost_price: 68000,
    stock: 2, // LOW STOCK
    min_stock: 3,
    unit: 'Btl',
    is_active: true,
  },
  {
    id: 'a0000006-0000-0000-0000-000000000006',
    code: 'BRK-001',
    name: 'Kampas Rem Depan Honda Beat / Vario FI',
    category: 'barang',
    sub_category: 'Pengereman',
    price: 38000,
    cost_price: 25000,
    stock: 14,
    min_stock: 4,
    unit: 'Set',
    is_active: true,
  },
  {
    id: 'a0000007-0000-0000-0000-000000000007',
    code: 'BRK-002',
    name: 'Kampas Rem Belakang Tromol Honda Beat',
    category: 'barang',
    sub_category: 'Pengereman',
    price: 42000,
    cost_price: 28000,
    stock: 8,
    min_stock: 3,
    unit: 'Set',
    is_active: true,
  },
  {
    id: 'a0000008-0000-0000-0000-000000000008',
    code: 'BRK-003',
    name: 'Kampas Rem Depan Yamaha NMAX / Aerox',
    category: 'barang',
    sub_category: 'Pengereman',
    price: 65000,
    cost_price: 48000,
    stock: 1, // LOW STOCK
    min_stock: 3,
    unit: 'Set',
    is_active: true,
  },
  {
    id: 'a0000009-0000-0000-0000-000000000009',
    code: 'BRK-004',
    name: 'Minyak Rem DOT 4 Jumbo 50ml',
    category: 'barang',
    sub_category: 'Pengereman',
    price: 15000,
    cost_price: 9000,
    stock: 20,
    min_stock: 5,
    unit: 'Btl',
    is_active: true,
  },
  {
    id: 'a0000010-0000-0000-0000-000000000010',
    code: 'IGN-001',
    name: 'Busi NGK CPR9EA-9 Standar Vario/Beat',
    category: 'barang',
    sub_category: 'Pengapian',
    price: 22000,
    cost_price: 14000,
    stock: 22,
    min_stock: 5,
    unit: 'Pcs',
    is_active: true,
  },
  {
    id: 'a0000011-0000-0000-0000-000000000011',
    code: 'IGN-002',
    name: 'Busi Daytona Iridium Racing',
    category: 'barang',
    sub_category: 'Pengapian',
    price: 85000,
    cost_price: 62000,
    stock: 0, // OUT OF STOCK (HABIS)
    min_stock: 2,
    unit: 'Pcs',
    is_active: true,
  },
  {
    id: 'a0000012-0000-0000-0000-000000000012',
    code: 'FLT-001',
    name: 'Filter Udara Honda Vario 125/150 eSP',
    category: 'barang',
    sub_category: 'Filter',
    price: 45000,
    cost_price: 32000,
    stock: 6,
    min_stock: 3,
    unit: 'Pcs',
    is_active: true,
  },
  {
    id: 'a0000013-0000-0000-0000-000000000013',
    code: 'CVT-001',
    name: 'Roller Vario 125 15 Gram Kawahara Set',
    category: 'barang',
    sub_category: 'CVT',
    price: 75000,
    cost_price: 55000,
    stock: 5,
    min_stock: 2,
    unit: 'Set',
    is_active: true,
  },
  {
    id: 'a0000014-0000-0000-0000-000000000014',
    code: 'CVT-002',
    name: 'V-Belt Mitsuboshi Honda Beat FI',
    category: 'barang',
    sub_category: 'CVT',
    price: 95000,
    cost_price: 72000,
    stock: 4,
    min_stock: 2,
    unit: 'Pcs',
    is_active: true,
  },
  {
    id: 'a0000015-0000-0000-0000-000000000015',
    code: 'TIR-001',
    name: 'Ban Tubeless Maxxis Victra 90/90-14',
    category: 'barang',
    sub_category: 'Ban & Velg',
    price: 245000,
    cost_price: 195000,
    stock: 6,
    min_stock: 2,
    unit: 'Pcs',
    is_active: true,
  },
  {
    id: 'a0000016-0000-0000-0000-000000000016',
    code: 'TIR-002',
    name: 'Pentil Tubeless Besi Chrome',
    category: 'barang',
    sub_category: 'Ban & Velg',
    price: 10000,
    cost_price: 4000,
    stock: 35,
    min_stock: 10,
    unit: 'Pcs',
    is_active: true,
  },
  // Jasa Servis
  {
    id: 'j0000001-0000-0000-0000-000000000001',
    code: 'SRV-001',
    name: 'Jasa Ganti Oli Mesin / Gardan',
    category: 'jasa',
    sub_category: 'Jasa Servis',
    price: 10000,
    cost_price: 0,
    stock: 999,
    min_stock: 0,
    unit: 'Jasa',
    is_active: true,
  },
  {
    id: 'j0000002-0000-0000-0000-000000000002',
    code: 'SRV-002',
    name: 'Jasa Servis Ringan & Tune Up Matic / Bebek',
    category: 'jasa',
    sub_category: 'Jasa Servis',
    price: 45000,
    cost_price: 0,
    stock: 999,
    min_stock: 0,
    unit: 'Jasa',
    is_active: true,
  },
  {
    id: 'j0000003-0000-0000-0000-000000000003',
    code: 'SRV-003',
    name: 'Jasa Servis Lengkap + Bersih Injektor / TB',
    category: 'jasa',
    sub_category: 'Jasa Servis',
    price: 75000,
    cost_price: 0,
    stock: 999,
    min_stock: 0,
    unit: 'Jasa',
    is_active: true,
  },
  {
    id: 'j0000004-0000-0000-0000-000000000004',
    code: 'SRV-004',
    name: 'Jasa Servis CVT & Pembersihan Pulley',
    category: 'jasa',
    sub_category: 'Jasa Servis',
    price: 35000,
    cost_price: 0,
    stock: 999,
    min_stock: 0,
    unit: 'Jasa',
    is_active: true,
  },
  {
    id: 'j0000005-0000-0000-0000-000000000005',
    code: 'SRV-005',
    name: 'Jasa Ganti Ban Luar / Pasang Tubeless',
    category: 'jasa',
    sub_category: 'Jasa Servis',
    price: 15000,
    cost_price: 0,
    stock: 999,
    min_stock: 0,
    unit: 'Jasa',
    is_active: true,
  },
  {
    id: 'j0000006-0000-0000-0000-000000000006',
    code: 'SRV-006',
    name: 'Jasa Ganti Kampas Rem Depan / Belakang',
    category: 'jasa',
    sub_category: 'Jasa Servis',
    price: 15000,
    cost_price: 0,
    stock: 999,
    min_stock: 0,
    unit: 'Jasa',
    is_active: true,
  },
  {
    id: 'j0000007-0000-0000-0000-000000000007',
    code: 'SRV-007',
    name: 'Jasa Kuras Radiator & Coolant',
    category: 'jasa',
    sub_category: 'Jasa Servis',
    price: 25000,
    cost_price: 0,
    stock: 999,
    min_stock: 0,
    unit: 'Jasa',
    is_active: true,
  },
];

// Initial Seed Vehicles
const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    plate_number: 'B 3829 SJA',
    owner_name: 'Budi Hartono',
    owner_phone: '081299887766',
    vehicle_type: 'Honda Vario 125 2021',
    notes: 'Rutin ganti oli Shell AX7',
    last_service_date: '2026-08-25T10:30:00Z',
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    plate_number: 'B 6612 GHA',
    owner_name: 'Siti Rahmawati',
    owner_phone: '081377889900',
    vehicle_type: 'Honda Beat Street 2022',
    notes: 'Oli MPX2',
    last_service_date: '2026-08-28T14:15:00Z',
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    plate_number: 'D 4590 ZKC',
    owner_name: 'Eko Prasetyo',
    owner_phone: '087812345678',
    vehicle_type: 'Yamaha NMAX 155 2020',
    notes: 'Ada getar CVT di tarikan bawah',
    last_service_date: '2026-09-01T09:00:00Z',
  },
  {
    id: 'b4444444-4444-4444-4444-444444444444',
    plate_number: 'F 2901 KLM',
    owner_name: 'Hendro Wijaya',
    owner_phone: '085698741236',
    vehicle_type: 'Yamaha Aerox 155 2023',
    notes: 'Ban depan mulai tipis',
    last_service_date: '2026-08-15T11:45:00Z',
  },
];

// Initial Transactions
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1111111-1111-1111-1111-111111111111',
    invoice_no: 'INV-20260902-001',
    cashier_id: '11111111-1111-1111-1111-111111111111',
    cashier_name: 'Agus Prayitno',
    vehicle_id: 'b1111111-1111-1111-1111-111111111111',
    vehicle_plate: 'B 3829 SJA',
    vehicle_owner: 'Budi Hartono',
    vehicle_type: 'Honda Vario 125 2021',
    total_amount: 110000,
    discount_amount: 0,
    cash_given: 150000,
    change_amount: 40000,
    payment_method: 'tunai',
    status: 'completed',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    details: [
      {
        id: 'd1',
        transaction_id: 't1111111-1111-1111-1111-111111111111',
        product_id: 'a0000001-0000-0000-0000-000000000001',
        product_name: 'Oli Shell Advance AX7 Matic 10W-40 0.8L',
        product_code: 'OIL-001',
        category: 'barang',
        qty: 1,
        price_at_sale: 55000,
        subtotal: 55000,
      },
      {
        id: 'd2',
        transaction_id: 't1111111-1111-1111-1111-111111111111',
        product_id: 'j0000002-0000-0000-0000-000000000002',
        product_name: 'Jasa Servis Ringan & Tune Up Matic / Bebek',
        product_code: 'SRV-002',
        category: 'jasa',
        qty: 1,
        price_at_sale: 45000,
        subtotal: 45000,
      },
      {
        id: 'd3',
        transaction_id: 't1111111-1111-1111-1111-111111111111',
        product_id: 'j0000001-0000-0000-0000-000000000001',
        product_name: 'Jasa Ganti Oli Mesin / Gardan',
        product_code: 'SRV-001',
        category: 'jasa',
        qty: 1,
        price_at_sale: 10000,
        subtotal: 10000,
      },
    ],
  },
  {
    id: 't2222222-2222-2222-2222-222222222222',
    invoice_no: 'INV-20260902-002',
    cashier_id: '11111111-1111-1111-1111-111111111111',
    cashier_name: 'Agus Prayitno',
    vehicle_id: 'b2222222-2222-2222-2222-222222222222',
    vehicle_plate: 'B 6612 GHA',
    vehicle_owner: 'Siti Rahmawati',
    vehicle_type: 'Honda Beat Street 2022',
    total_amount: 86000,
    discount_amount: 0,
    cash_given: 86000,
    change_amount: 0,
    payment_method: 'qris',
    status: 'completed',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    details: [
      {
        id: 'd4',
        transaction_id: 't2222222-2222-2222-2222-222222222222',
        product_id: 'a0000002-0000-0000-0000-000000000002',
        product_name: 'Oli AHM MPX2 Matic 10W-30 0.8L',
        product_code: 'OIL-002',
        category: 'barang',
        qty: 1,
        price_at_sale: 48000,
        subtotal: 48000,
      },
      {
        id: 'd5',
        transaction_id: 't2222222-2222-2222-2222-222222222222',
        product_id: 'a0000006-0000-0000-0000-000000000006',
        product_name: 'Kampas Rem Depan Honda Beat / Vario FI',
        product_code: 'BRK-001',
        category: 'barang',
        qty: 1,
        price_at_sale: 38000,
        subtotal: 38000,
      },
    ],
  },
];

// Initial Work Orders
const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'w1111111-1111-1111-1111-111111111111',
    invoice_no: 'SPK-20260902-001',
    vehicle_id: 'b3333333-3333-3333-3333-333333333333',
    vehicle_plate: 'D 4590 ZKC',
    vehicle_type: 'Yamaha NMAX 155 2020',
    owner_name: 'Eko Prasetyo',
    mechanic_id: '33333333-3333-3333-3333-333333333333',
    mechanic_name: 'Doni Setiawan',
    status: 'in_progress',
    mileage: 28540,
    complaint: 'CVT gredek tarikan awal & rem depan bunyi gesek',
    diagnosis: 'Mangkok kopling berdebu, kampas rem depan sisa 15%',
    started_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'w2222222-2222-2222-2222-222222222222',
    invoice_no: 'SPK-20260902-002',
    vehicle_id: 'b1111111-1111-1111-1111-111111111111',
    vehicle_plate: 'B 3829 SJA',
    vehicle_type: 'Honda Vario 125 2021',
    owner_name: 'Budi Hartono',
    mechanic_id: '44444444-4444-4444-4444-444444444444',
    mechanic_name: 'Rian Hidayat',
    status: 'pending',
    mileage: 19400,
    complaint: 'Servis berkala + ganti oli mesin & oli gardan',
    diagnosis: 'Antrian Pit 2',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    user_id: '11111111-1111-1111-1111-111111111111',
    user_name: 'Agus Prayitno',
    action: 'CHECKOUT_TRANSACTION',
    details: {
      invoice_no: 'INV-20260902-001',
      total: 110000,
      payment_method: 'tunai',
    },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'log-2',
    user_id: '11111111-1111-1111-1111-111111111111',
    user_name: 'Agus Prayitno',
    action: 'CHECKOUT_TRANSACTION',
    details: {
      invoice_no: 'INV-20260902-002',
      total: 86000,
      payment_method: 'qris',
    },
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

// Keys
const KEYS = {
  USERS: 'bengkel_users_v1',
  PRODUCTS: 'bengkel_products_v1',
  VEHICLES: 'bengkel_vehicles_v1',
  TRANSACTIONS: 'bengkel_transactions_v1',
  WORK_ORDERS: 'bengkel_work_orders_v1',
  AUDIT_LOGS: 'bengkel_audit_logs_v1',
};

// Safe LocalStorage helpers
function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage save error:', err);
  }
}

export const BengkelStorage = {
  // Initialize default data if empty
  init: () => {
    if (typeof window === 'undefined') return;
    if (!window.localStorage.getItem(KEYS.USERS)) {
      setItem(KEYS.USERS, INITIAL_USERS);
    }
    if (!window.localStorage.getItem(KEYS.PRODUCTS)) {
      setItem(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!window.localStorage.getItem(KEYS.VEHICLES)) {
      setItem(KEYS.VEHICLES, INITIAL_VEHICLES);
    }
    if (!window.localStorage.getItem(KEYS.TRANSACTIONS)) {
      setItem(KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    }
    if (!window.localStorage.getItem(KEYS.WORK_ORDERS)) {
      setItem(KEYS.WORK_ORDERS, INITIAL_WORK_ORDERS);
    }
    if (!window.localStorage.getItem(KEYS.AUDIT_LOGS)) {
      setItem(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    }
  },

  // USERS
  getUsers: (): User[] => getItem(KEYS.USERS, INITIAL_USERS),
  findUserByPin: (pin: string): User | undefined => {
    const users = BengkelStorage.getUsers();
    return users.find((u) => u.pin_hash === pin && u.is_active);
  },

  // PRODUCTS
  getProducts: (): Product[] => getItem(KEYS.PRODUCTS, INITIAL_PRODUCTS),
  saveProduct: (product: Partial<Product> & { name: string; price: number }): Product => {
    const products = BengkelStorage.getProducts();
    if (product.id) {
      const idx = products.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        products[idx] = { ...products[idx], ...product, updated_at: new Date().toISOString() };
        setItem(KEYS.PRODUCTS, products);
        BengkelStorage.addAuditLog('UPDATE_PRODUCT', { product_id: product.id, name: product.name });
        return products[idx];
      }
    }
    // New product
    const newProduct: Product = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'prod-' + Date.now(),
      code: product.code || 'PRD-' + Math.floor(1000 + Math.random() * 9000),
      name: product.name,
      category: product.category || 'barang',
      sub_category: product.sub_category || 'Umum',
      price: product.price,
      cost_price: product.cost_price || 0,
      stock: product.category === 'jasa' ? 999 : (product.stock || 0),
      min_stock: product.min_stock || 3,
      unit: product.unit || (product.category === 'jasa' ? 'Jasa' : 'Pcs'),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    products.unshift(newProduct);
    setItem(KEYS.PRODUCTS, products);
    BengkelStorage.addAuditLog('CREATE_PRODUCT', { product_id: newProduct.id, name: newProduct.name });
    return newProduct;
  },
  deleteProduct: (id: string): boolean => {
    const products = BengkelStorage.getProducts().filter((p) => p.id !== id);
    setItem(KEYS.PRODUCTS, products);
    BengkelStorage.addAuditLog('DELETE_PRODUCT', { product_id: id });
    return true;
  },
  updateProductStock: (id: string, newStock: number): Product | null => {
    const products = BengkelStorage.getProducts();
    const p = products.find((item) => item.id === id);
    if (!p) return null;
    const oldStock = p.stock;
    p.stock = Math.max(0, newStock);
    p.updated_at = new Date().toISOString();
    setItem(KEYS.PRODUCTS, products);
    BengkelStorage.addAuditLog('STOCK_ADJUSTMENT', {
      product_id: id,
      product_name: p.name,
      old_stock: oldStock,
      new_stock: p.stock,
    });
    return p;
  },

  // VEHICLES
  getVehicles: (): Vehicle[] => getItem(KEYS.VEHICLES, INITIAL_VEHICLES),
  saveVehicle: (vehicle: Partial<Vehicle> & { plate_number: string; owner_name: string }): Vehicle => {
    const vehicles = BengkelStorage.getVehicles();
    const cleanPlate = vehicle.plate_number.toUpperCase().trim();
    if (vehicle.id) {
      const idx = vehicles.findIndex((v) => v.id === vehicle.id);
      if (idx >= 0) {
        vehicles[idx] = { ...vehicles[idx], ...vehicle, plate_number: cleanPlate };
        setItem(KEYS.VEHICLES, vehicles);
        return vehicles[idx];
      }
    }
    // Check existing plate
    const existing = vehicles.find((v) => v.plate_number.toUpperCase() === cleanPlate);
    if (existing) {
      existing.owner_name = vehicle.owner_name || existing.owner_name;
      existing.owner_phone = vehicle.owner_phone || existing.owner_phone;
      existing.vehicle_type = vehicle.vehicle_type || existing.vehicle_type;
      setItem(KEYS.VEHICLES, vehicles);
      return existing;
    }
    const newVehicle: Vehicle = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'veh-' + Date.now(),
      plate_number: cleanPlate,
      owner_name: vehicle.owner_name,
      owner_phone: vehicle.owner_phone,
      vehicle_type: vehicle.vehicle_type || 'Sepeda Motor',
      notes: vehicle.notes,
      created_at: new Date().toISOString(),
    };
    vehicles.unshift(newVehicle);
    setItem(KEYS.VEHICLES, vehicles);
    return newVehicle;
  },

  // TRANSACTIONS & CONCURRENCY ATOMIC CHECKOUT
  getTransactions: (): Transaction[] => getItem(KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS),
  
  checkout: (payload: CheckoutPayload): { success: boolean; transaction?: Transaction; error?: string } => {
    // 0. ROLE VALIDATION: Mekanik cannot checkout
    if (payload.cashier_id) {
      const users = BengkelStorage.getUsers();
      const user = users.find((u) => u.id === payload.cashier_id);
      if (user && user.role === 'mekanik') {
        return {
          success: false,
          error: 'Akses ditolak: User dengan role mekanik tidak memiliki izin memproses transaksi kasir.',
        };
      }
    }

    const products = BengkelStorage.getProducts();

    // 1. ATOMIC VALIDATION: Check stock sufficiency for ALL items before deducting anything
    for (const item of payload.items) {
      if (item.product.category === 'barang') {
        const currentProd = products.find((p) => p.id === item.product.id);
        if (!currentProd) {
          return { success: false, error: `Produk "${item.product.name}" tidak ditemukan.` };
        }
        if (currentProd.stock < item.qty) {
          return {
            success: false,
            error: `Stok "${currentProd.name}" tidak mencukupi. Sisa stok: ${currentProd.stock}, dibutuhkan: ${item.qty}.`,
          };
        }
      }
    }

    // 2. ATOMIC STOCK DEDUCTION
    for (const item of payload.items) {
      if (item.product.category === 'barang') {
        const prodIndex = products.findIndex((p) => p.id === item.product.id);
        if (prodIndex >= 0) {
          products[prodIndex].stock -= item.qty;
          products[prodIndex].updated_at = new Date().toISOString();
        }
      }
    }
    setItem(KEYS.PRODUCTS, products);

    // 3. GENERATE TRANSACTION
    const allTx = BengkelStorage.getTransactions();
    const invoiceNo = generateInvoiceNumber(allTx.length + 1);
    const subtotalSum = payload.items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalAmount = Math.max(0, subtotalSum - (payload.discount_amount || 0));
    const cashGiven = payload.payment_method === 'tunai' ? payload.cash_given : totalAmount;
    const changeAmount = payload.payment_method === 'tunai' ? Math.max(0, cashGiven - totalAmount) : 0;

    const newTxId = crypto.randomUUID ? crypto.randomUUID() : 'tx-' + Date.now();

    const newTransaction: Transaction = {
      id: newTxId,
      invoice_no: invoiceNo,
      cashier_id: payload.cashier_id,
      cashier_name: payload.cashier_name || 'Kasir',
      vehicle_id: payload.vehicle_id,
      vehicle_plate: payload.vehicle_plate,
      vehicle_owner: payload.vehicle_owner,
      vehicle_type: payload.vehicle_type,
      total_amount: totalAmount,
      discount_amount: payload.discount_amount || 0,
      cash_given: cashGiven,
      change_amount: changeAmount,
      payment_method: payload.payment_method,
      status: 'completed',
      notes: payload.notes,
      created_at: new Date().toISOString(),
      details: payload.items.map((item, idx) => ({
        id: `dt-${Date.now()}-${idx}`,
        transaction_id: newTxId,
        product_id: item.product.id,
        product_name: item.product.name,
        product_code: item.product.code,
        category: item.product.category,
        qty: item.qty,
        price_at_sale: item.product.price,
        cost_at_sale: item.product.cost_price || 0,
        subtotal: item.subtotal,
      })),
    };

    allTx.unshift(newTransaction);
    setItem(KEYS.TRANSACTIONS, allTx);

    // 4. UPDATE VEHICLE LAST SERVICE DATE
    if (payload.vehicle_id) {
      const vehicles = BengkelStorage.getVehicles();
      const v = vehicles.find((veh) => veh.id === payload.vehicle_id);
      if (v) {
        v.last_service_date = new Date().toISOString();
        setItem(KEYS.VEHICLES, vehicles);
      }
    }

    // 5. AUDIT LOG
    BengkelStorage.addAuditLog('CHECKOUT_TRANSACTION', {
      transaction_id: newTxId,
      invoice_no: invoiceNo,
      total: totalAmount,
      payment_method: payload.payment_method,
      item_count: payload.items.length,
    });

    return { success: true, transaction: newTransaction };
  },

  // VOID TRANSACTION WITH ATOMIC STOCK REVERSAL
  voidTransaction: (
    transactionId: string,
    reason: string,
    userId?: string,
    userName?: string
  ): { success: boolean; error?: string } => {
    // 0. ROLE VALIDATION: Only Admin can void
    if (userId) {
      const users = BengkelStorage.getUsers();
      const user = users.find((u) => u.id === userId);
      if (user && user.role !== 'admin') {
        return {
          success: false,
          error: 'Akses ditolak: Hanya role Admin / Owner yang berwenang membatalkan transaksi (Void).',
        };
      }
    }

    const transactions = BengkelStorage.getTransactions();
    const tx = transactions.find((t) => t.id === transactionId);

    if (!tx) {
      return { success: false, error: 'Transaksi tidak ditemukan.' };
    }
    if (tx.status === 'void') {
      return { success: false, error: 'Transaksi ini sudah pernah dibatalkan (void).' };
    }

    // 1. RESTORE STOCK FOR ALL 'barang'
    const products = BengkelStorage.getProducts();
    for (const detail of tx.details) {
      if (detail.category === 'barang') {
        const prodIndex = products.findIndex((p) => p.id === detail.product_id);
        if (prodIndex >= 0) {
          products[prodIndex].stock += detail.qty;
          products[prodIndex].updated_at = new Date().toISOString();
        }
      }
    }
    setItem(KEYS.PRODUCTS, products);

    // 2. MARK AS VOID
    tx.status = 'void';
    tx.void_reason = reason;
    tx.voided_at = new Date().toISOString();
    tx.voided_by = userName || 'Admin';
    setItem(KEYS.TRANSACTIONS, transactions);

    // 3. AUDIT LOG
    BengkelStorage.addAuditLog('VOID_TRANSACTION', {
      transaction_id: tx.id,
      invoice_no: tx.invoice_no,
      amount: tx.total_amount,
      reason: reason,
      voided_by: userName || 'Admin',
    });

    return { success: true };
  },

  // WORK ORDERS (SPK)
  getWorkOrders: (): WorkOrder[] => getItem(KEYS.WORK_ORDERS, INITIAL_WORK_ORDERS),
  saveWorkOrder: (order: Partial<WorkOrder> & { vehicle_id: string }): WorkOrder => {
    const orders = BengkelStorage.getWorkOrders();
    if (order.id) {
      const idx = orders.findIndex((o) => o.id === order.id);
      if (idx >= 0) {
        orders[idx] = { ...orders[idx], ...order };
        setItem(KEYS.WORK_ORDERS, orders);
        return orders[idx];
      }
    }
    const newOrder: WorkOrder = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'wo-' + Date.now(),
      invoice_no: 'SPK-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(orders.length + 1).padStart(3, '0'),
      vehicle_id: order.vehicle_id,
      vehicle_plate: order.vehicle_plate,
      vehicle_type: order.vehicle_type,
      owner_name: order.owner_name,
      mechanic_id: order.mechanic_id,
      mechanic_name: order.mechanic_name,
      status: order.status || 'pending',
      mileage: order.mileage || 0,
      complaint: order.complaint,
      diagnosis: order.diagnosis,
      notes: order.notes,
      created_at: new Date().toISOString(),
    };
    orders.unshift(newOrder);
    setItem(KEYS.WORK_ORDERS, orders);
    return newOrder;
  },
  updateWorkOrderStatus: (id: string, status: WorkOrder['status']): WorkOrder | null => {
    const orders = BengkelStorage.getWorkOrders();
    const o = orders.find((item) => item.id === id);
    if (!o) return null;
    o.status = status;
    if (status === 'in_progress' && !o.started_at) {
      o.started_at = new Date().toISOString();
    } else if (status === 'completed' && !o.completed_at) {
      o.completed_at = new Date().toISOString();
    }
    setItem(KEYS.WORK_ORDERS, orders);
    return o;
  },

  // AUDIT LOGS
  getAuditLogs: (): AuditLog[] => getItem(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  addAuditLog: (action: string, details: Record<string, any>, userId?: string, userName?: string): void => {
    const logs = BengkelStorage.getAuditLogs();
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      user_id: userId,
      user_name: userName || 'System',
      action,
      details,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep max 200 logs
    setItem(KEYS.AUDIT_LOGS, logs.slice(0, 200));
  },

  // DASHBOARD ANALYTICS
  getDashboardStats: (): DashboardStats => {
    const transactions = BengkelStorage.getTransactions();
    const products = BengkelStorage.getProducts();

    const todayStr = new Date().toISOString().slice(0, 10);
    const validTx = transactions.filter((t) => t.status === 'completed');

    const todayTx = validTx.filter((t) => t.created_at.startsWith(todayStr));
    const todayRevenue = todayTx.reduce((sum, t) => sum + t.total_amount, 0);
    const accumulativeRevenue = validTx.reduce((sum, t) => sum + t.total_amount, 0);

    const lowStockProducts = products.filter(
      (p) => p.category === 'barang' && p.stock <= p.min_stock
    );

    return {
      todayRevenue,
      todayTransactions: todayTx.length,
      accumulativeRevenue,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      recentTransactions: transactions.slice(0, 8),
    };
  },
};
