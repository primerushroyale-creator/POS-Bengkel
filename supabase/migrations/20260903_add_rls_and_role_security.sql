-- ==============================================================================
-- MIGRATION: 20260903_add_rls_and_role_security.sql
-- PERBAIKAN BUG #4: Row Level Security (RLS) & Proteksi Akses Berbasis Role
-- ==============================================================================

-- 1. HELPER FUNCTION: Mengambil role user saat ini dari JWT claims atau tabel users
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    -- 1. Cek claim custom 'role' pada JWT
    BEGIN
        v_role := current_setting('request.jwt.claims', true)::jsonb->>'role';
        IF v_role IS NOT NULL AND v_role <> '' THEN
            RETURN v_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- 2. Cek app_metadata / user_metadata pada Supabase Auth JWT
    BEGIN
        v_role := current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'role';
        IF v_role IS NOT NULL AND v_role <> '' THEN
            RETURN v_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- 3. Fallback: Query ke tabel users berdasarkan auth.uid()
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

-- 2. AKTIFKAN ROW LEVEL SECURITY (RLS) DI SELURUH TABEL
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES UNTUK TABEL: products
-- Mekanik, Kasir, dan Admin boleh melihat katalog produk/jasa
CREATE POLICY "products_select_policy" ON products
    FOR SELECT
    USING (auth_user_role() IN ('admin', 'kasir', 'mekanik'));

-- Hanya Admin yang berhak menambah, mengubah, dan menghapus master produk & stok manual
CREATE POLICY "products_insert_policy" ON products
    FOR INSERT
    WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "products_update_policy" ON products
    FOR UPDATE
    USING (auth_user_role() = 'admin');

CREATE POLICY "products_delete_policy" ON products
    FOR DELETE
    USING (auth_user_role() = 'admin');

-- 4. POLICIES UNTUK TABEL: transactions & transaction_details
-- KRITIS: Role 'mekanik' TIDAK MEMILIKI AKSES BACA MAUPUN TULIS ke transaksi kasir/keuangan!
CREATE POLICY "transactions_select_policy" ON transactions
    FOR SELECT
    USING (auth_user_role() IN ('admin', 'kasir'));

CREATE POLICY "transactions_insert_policy" ON transactions
    FOR INSERT
    WITH CHECK (auth_user_role() IN ('admin', 'kasir'));

-- Hanya Admin yang berhak mengubah transaksi (contoh: Void transaksi)
CREATE POLICY "transactions_update_policy" ON transactions
    FOR UPDATE
    USING (auth_user_role() = 'admin');

-- Transaction Details
CREATE POLICY "td_select_policy" ON transaction_details
    FOR SELECT
    USING (auth_user_role() IN ('admin', 'kasir'));

CREATE POLICY "td_insert_policy" ON transaction_details
    FOR INSERT
    WITH CHECK (auth_user_role() IN ('admin', 'kasir'));

CREATE POLICY "td_update_policy" ON transaction_details
    FOR UPDATE
    USING (auth_user_role() = 'admin');

-- 5. POLICIES UNTUK TABEL: vehicles (CRM Kendaraan)
-- Mekanik, Kasir, Admin boleh melihat data kendaraan saat menangani servis
CREATE POLICY "vehicles_select_policy" ON vehicles
    FOR SELECT
    USING (auth_user_role() IN ('admin', 'kasir', 'mekanik'));

-- Hanya Kasir & Admin yang menginput/memperbarui data master pelanggan/kendaraan
CREATE POLICY "vehicles_insert_policy" ON vehicles
    FOR INSERT
    WITH CHECK (auth_user_role() IN ('admin', 'kasir'));

CREATE POLICY "vehicles_update_policy" ON vehicles
    FOR UPDATE
    USING (auth_user_role() IN ('admin', 'kasir'));

CREATE POLICY "vehicles_delete_policy" ON vehicles
    FOR DELETE
    USING (auth_user_role() = 'admin');

-- 6. POLICIES UNTUK TABEL: work_orders (SPK Servis)
-- Hak sah Mekanik: melihat dan memperbarui status pengerjaan SPK Servis
CREATE POLICY "wo_select_policy" ON work_orders
    FOR SELECT
    USING (auth_user_role() IN ('admin', 'kasir', 'mekanik'));

CREATE POLICY "wo_insert_policy" ON work_orders
    FOR INSERT
    WITH CHECK (auth_user_role() IN ('admin', 'kasir'));

-- Mekanik diperbolehkan update status, diagnosa, dan catatan pengerjaan
CREATE POLICY "wo_update_policy" ON work_orders
    FOR UPDATE
    USING (auth_user_role() IN ('admin', 'kasir', 'mekanik'));

CREATE POLICY "wo_delete_policy" ON work_orders
    FOR DELETE
    USING (auth_user_role() = 'admin');

-- 7. POLICIES UNTUK TABEL: audit_logs
-- Hanya Admin yang bisa melihat audit trail log keamanan
CREATE POLICY "audit_select_policy" ON audit_logs
    FOR SELECT
    USING (auth_user_role() = 'admin');

CREATE POLICY "audit_insert_policy" ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- 8. POLICIES UNTUK TABEL: users
CREATE POLICY "users_select_policy" ON users
    FOR SELECT
    USING (auth_user_role() IN ('admin', 'kasir', 'mekanik'));

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT
    WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE
    USING (auth_user_role() = 'admin');

CREATE POLICY "users_delete_policy" ON users
    FOR DELETE
    USING (auth_user_role() = 'admin');

-- 9. PERBAIKAN FUNGSI CHECKOUT & VOID AGAR MEMVALIDASI ROLE DI LEVEL DATABASE
CREATE OR REPLACE FUNCTION fn_checkout_transaction(
    p_invoice_no VARCHAR,
    p_cashier_id UUID,
    p_vehicle_id UUID,
    p_total_amount NUMERIC,
    p_discount_amount NUMERIC,
    p_cash_given NUMERIC,
    p_change_amount NUMERIC,
    p_payment_method VARCHAR,
    p_items JSONB,
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
    v_cashier_role VARCHAR;
BEGIN
    -- Validasi Role: Mekanik TIDAK BOLEH melakukan checkout
    SELECT role INTO v_cashier_role FROM users WHERE id = p_cashier_id;
    IF v_cashier_role = 'mekanik' THEN
        RAISE EXCEPTION 'Akses ditolak: User dengan role mekanik tidak memiliki izin memproses transaksi kasir.';
    END IF;

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

-- Validasi Role pada fn_void_transaction: Hanya Admin yang boleh melakukan Void
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
    v_user_role VARCHAR;
BEGIN
    -- Validasi Role
    SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
    IF v_user_role <> 'admin' THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya role admin yang berwenang membatalkan transaksi (Void).';
    END IF;

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
