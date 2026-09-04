-- ==============================================================================
-- BENGKEL POS & MANAGEMENT SYSTEM - DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Kasir, Admin, Mekanik)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'kasir', 'mekanik')),
    pin_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRODUCTS TABLE (Barang Sparepart & Jasa Servis)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('barang', 'jasa')),
    sub_category VARCHAR(50) DEFAULT 'Umum',
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    cost_price NUMERIC(12, 2) DEFAULT 0 CHECK (cost_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock INTEGER NOT NULL DEFAULT 3 CHECK (min_stock >= 0),
    unit VARCHAR(20) DEFAULT 'Pcs',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. VEHICLES TABLE (CRM Kendaraan Bengkel)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    owner_phone VARCHAR(30),
    vehicle_type VARCHAR(100) NOT NULL, -- e.g. 'Honda Vario 125', 'Yamaha NMAX', 'Toyota Avanza'
    notes TEXT,
    last_service_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    discount_amount NUMERIC(12, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    cash_given NUMERIC(12, 2) DEFAULT 0,
    change_amount NUMERIC(12, 2) DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('tunai', 'qris', 'transfer')),
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'void')),
    void_reason TEXT,
    voided_at TIMESTAMP WITH TIME ZONE,
    voided_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TRANSACTION DETAILS TABLE
CREATE TABLE IF NOT EXISTS transaction_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    qty INTEGER NOT NULL CHECK (qty > 0),
    price_at_sale NUMERIC(12, 2) NOT NULL CHECK (price_at_sale >= 0),
    cost_at_sale NUMERIC(12, 2) DEFAULT 0,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. WORK ORDERS TABLE (SPK Servis Bengkel)
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(50),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    mechanic_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    mileage INTEGER DEFAULT 0, -- Odometer KM
    complaint TEXT, -- Keluhan pelanggan
    diagnosis TEXT, -- Hasil pemeriksaan mekanik
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- e.g. 'VOID_TRANSACTION', 'STOCK_UPDATE', 'USER_LOGIN', 'PRICE_CHANGE'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_no);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_details_transaction ON transaction_details(transaction_id);
CREATE INDEX IF NOT EXISTS idx_details_product ON transaction_details(product_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ==============================================================================
-- CONCURRENCY CONTROL: ATOMIC CHECKOUT STORED PROCEDURE
-- ==============================================================================
CREATE OR REPLACE FUNCTION fn_checkout_transaction(
    p_invoice_no VARCHAR,
    p_cashier_id UUID,
    p_vehicle_id UUID,
    p_total_amount NUMERIC,
    p_discount_amount NUMERIC,
    p_cash_given NUMERIC,
    p_change_amount NUMERIC,
    p_payment_method VARCHAR,
    p_items JSONB, -- Array of objects: [{"product_id": "...", "qty": 1, "price": 50000}]
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_transaction_id UUID;
    v_item JSONB;
    v_product RECORD;
    v_item_qty INTEGER;
    v_item_price NUMERIC;
    v_item_subtotal NUMERIC;
BEGIN
    -- 1. Insert Transaction Header
    INSERT INTO transactions (
        invoice_no,
        cashier_id,
        vehicle_id,
        total_amount,
        discount_amount,
        cash_given,
        change_amount,
        payment_method,
        status,
        notes
    ) VALUES (
        p_invoice_no,
        p_cashier_id,
        p_vehicle_id,
        p_total_amount,
        p_discount_amount,
        p_cash_given,
        p_change_amount,
        p_payment_method,
        'completed',
        p_notes
    ) RETURNING id INTO v_transaction_id;

    -- 2. Process each item with Row-Locking & Stock Deduction
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_qty := (v_item->>'qty')::INTEGER;
        v_item_price := (v_item->>'price')::NUMERIC;
        v_item_subtotal := v_item_qty * v_item_price;

        -- Lock the product row to prevent race condition / oversell
        SELECT * INTO v_product
        FROM products
        WHERE id = (v_item->>'product_id')::UUID
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found', (v_item->>'product_id');
        END IF;

        -- Deduct stock only for 'barang'
        IF v_product.category = 'barang' THEN
            IF v_product.stock < v_item_qty THEN
                RAISE EXCEPTION 'Stok tidak mencukupi untuk % (Sisa: %, Diminta: %)', 
                    v_product.name, v_product.stock, v_item_qty;
            END IF;

            UPDATE products
            SET stock = stock - v_item_qty,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_product.id;
        END IF;

        -- Insert Transaction Detail line item
        INSERT INTO transaction_details (
            transaction_id,
            product_id,
            qty,
            price_at_sale,
            cost_at_sale,
            subtotal
        ) VALUES (
            v_transaction_id,
            v_product.id,
            v_item_qty,
            v_item_price,
            v_product.cost_price,
            v_item_subtotal
        );
    END LOOP;

    -- 3. Update Vehicle last service date if vehicle provided
    IF p_vehicle_id IS NOT NULL THEN
        UPDATE vehicles
        SET last_service_date = CURRENT_TIMESTAMP
        WHERE id = p_vehicle_id;
    END IF;

    -- 4. Record Audit Log
    INSERT INTO audit_logs (user_id, action, details)
    VALUES (
        p_cashier_id,
        'CHECKOUT_TRANSACTION',
        jsonb_build_object(
            'transaction_id', v_transaction_id,
            'invoice_no', p_invoice_no,
            'total', p_total_amount,
            'payment_method', p_payment_method
        )
    );

    RETURN v_transaction_id;
END;
$$;

-- ==============================================================================
-- CONCURRENCY CONTROL: ATOMIC VOID TRANSACTION STORED PROCEDURE
-- ==============================================================================
CREATE OR REPLACE FUNCTION fn_void_transaction(
    p_transaction_id UUID,
    p_user_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_transaction RECORD;
    v_detail RECORD;
    v_product RECORD;
BEGIN
    -- 1. Lock and fetch transaction
    SELECT * INTO v_transaction
    FROM transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    IF v_transaction.status = 'void' THEN
        RAISE EXCEPTION 'Transaction is already voided';
    END IF;

    -- 2. Mark Transaction as Void
    UPDATE transactions
    SET status = 'void',
        void_reason = p_reason,
        voided_at = CURRENT_TIMESTAMP,
        voided_by = p_user_id
    WHERE id = p_transaction_id;

    -- 3. Restore Stock for each 'barang' item
    FOR v_detail IN
        SELECT td.*, p.category, p.name as product_name
        FROM transaction_details td
        JOIN products p ON td.product_id = p.id
        WHERE td.transaction_id = p_transaction_id
    LOOP
        IF v_detail.category = 'barang' THEN
            UPDATE products
            SET stock = stock + v_detail.qty,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_detail.product_id;
        END IF;
    END LOOP;

    -- 4. Record Audit Log
    INSERT INTO audit_logs (user_id, action, details)
    VALUES (
        p_user_id,
        'VOID_TRANSACTION',
        jsonb_build_object(
            'transaction_id', p_transaction_id,
            'invoice_no', v_transaction.invoice_no,
            'amount', v_transaction.total_amount,
            'reason', p_reason
        )
    );

    RETURN TRUE;
END;
$$;

-- ==============================================================================
-- [MIGRATION 20260903] ROW LEVEL SECURITY (RLS) & ROLE-BASED ACCESS CONTROL
-- ==============================================================================

-- Helper Function: Dapatkan role aktif user
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    BEGIN
        v_role := current_setting('request.jwt.claims', true)::jsonb->>'role';
        IF v_role IS NOT NULL AND v_role <> '' THEN
            RETURN v_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        v_role := current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'role';
        IF v_role IS NOT NULL AND v_role <> '' THEN
            RETURN v_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        SELECT role INTO v_role FROM users WHERE id = auth.uid() AND is_active = TRUE;
        IF v_role IS NOT NULL THEN
            RETURN v_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN 'anon';
END;
$$;

-- Aktifkan RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies Products
CREATE POLICY "products_select_policy" ON products FOR SELECT USING (auth_user_role() IN ('admin', 'kasir', 'mekanik'));
CREATE POLICY "products_insert_policy" ON products FOR INSERT WITH CHECK (auth_user_role() = 'admin');
CREATE POLICY "products_update_policy" ON products FOR UPDATE USING (auth_user_role() = 'admin');
CREATE POLICY "products_delete_policy" ON products FOR DELETE USING (auth_user_role() = 'admin');

-- Policies Transactions (Mekanik DITOLAK dari membaca / menulis transaksi kasir)
CREATE POLICY "transactions_select_policy" ON transactions FOR SELECT USING (auth_user_role() IN ('admin', 'kasir'));
CREATE POLICY "transactions_insert_policy" ON transactions FOR INSERT WITH CHECK (auth_user_role() IN ('admin', 'kasir'));
CREATE POLICY "transactions_update_policy" ON transactions FOR UPDATE USING (auth_user_role() = 'admin');

-- Policies Transaction Details
CREATE POLICY "td_select_policy" ON transaction_details FOR SELECT USING (auth_user_role() IN ('admin', 'kasir'));
CREATE POLICY "td_insert_policy" ON transaction_details FOR INSERT WITH CHECK (auth_user_role() IN ('admin', 'kasir'));
CREATE POLICY "td_update_policy" ON transaction_details FOR UPDATE USING (auth_user_role() = 'admin');

-- Policies Vehicles
CREATE POLICY "vehicles_select_policy" ON vehicles FOR SELECT USING (auth_user_role() IN ('admin', 'kasir', 'mekanik'));
CREATE POLICY "vehicles_insert_policy" ON vehicles FOR INSERT WITH CHECK (auth_user_role() IN ('admin', 'kasir'));
CREATE POLICY "vehicles_update_policy" ON vehicles FOR UPDATE USING (auth_user_role() IN ('admin', 'kasir'));
CREATE POLICY "vehicles_delete_policy" ON vehicles FOR DELETE USING (auth_user_role() = 'admin');

-- Policies Work Orders (Hak Sah Mekanik)
CREATE POLICY "wo_select_policy" ON work_orders FOR SELECT USING (auth_user_role() IN ('admin', 'kasir', 'mekanik'));
CREATE POLICY "wo_insert_policy" ON work_orders FOR INSERT WITH CHECK (auth_user_role() IN ('admin', 'kasir'));
CREATE POLICY "wo_update_policy" ON work_orders FOR UPDATE USING (auth_user_role() IN ('admin', 'kasir', 'mekanik'));
CREATE POLICY "wo_delete_policy" ON work_orders FOR DELETE USING (auth_user_role() = 'admin');

-- Policies Audit Logs
CREATE POLICY "audit_select_policy" ON audit_logs FOR SELECT USING (auth_user_role() = 'admin');
CREATE POLICY "audit_insert_policy" ON audit_logs FOR INSERT WITH CHECK (true);

-- Policies Users
CREATE POLICY "users_select_policy" ON users FOR SELECT USING (auth_user_role() IN ('admin', 'kasir', 'mekanik'));
CREATE POLICY "users_insert_policy" ON users FOR INSERT WITH CHECK (auth_user_role() = 'admin');
CREATE POLICY "users_update_policy" ON users FOR UPDATE USING (auth_user_role() = 'admin');
CREATE POLICY "users_delete_policy" ON users FOR DELETE USING (auth_user_role() = 'admin');

-- ==============================================================================
-- [MIGRATION 20260903] SUPABASE REALTIME REPLICATION (CROSS-DEVICE SYNC)
-- ==============================================================================
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE transaction_details REPLICA IDENTITY FULL;
ALTER TABLE work_orders REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE products, transactions, transaction_details, work_orders;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
END;
$$;

-- ==============================================================================
-- [MIGRATION 20260904] IDEMPOTENCY KEY TO PREVENT DOUBLE INPUT & RACE CONDITIONS
-- ==============================================================================
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS client_transaction_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_transactions_client_id 
ON transactions(client_transaction_id);



