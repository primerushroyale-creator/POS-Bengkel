-- ==============================================================================
-- MIGRATION: 20260904_enable_anon_access_and_realtime.sql
-- PERBAIKAN DARURAT: Sinkronisasi Lintas Device (Realtime + Anon Access Policy)
-- ==============================================================================

-- 1. PASTIKAN SELURUH TABEL TRANSAKSIONAL MENGGUNAKAN REPLICA IDENTITY FULL
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE transaction_details REPLICA IDENTITY FULL;
ALTER TABLE work_orders REPLICA IDENTITY FULL;
ALTER TABLE vehicles REPLICA IDENTITY FULL;

-- 2. PASTIKAN SEMUA TABEL TERDAFTAR DI PUBLIKASI SUPABASE_REALTIME
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE products;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE transaction_details;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
END;
$$;

-- 3. PERBAIKAN RLS POLICIES UNTUK ANON KEY (POS CLIENT APPLICATION ACCESS)
-- Mengizinkan role 'anon' dan 'authenticated' melakukan SELECT, INSERT, UPDATE pada data operasional bengkel

-- A. PRODUCTS
DROP POLICY IF EXISTS "anon_products_select" ON products;
DROP POLICY IF EXISTS "anon_products_all" ON products;
CREATE POLICY "anon_products_all" ON products
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- B. WORK ORDERS (SPK)
DROP POLICY IF EXISTS "anon_wo_select" ON work_orders;
DROP POLICY IF EXISTS "anon_wo_all" ON work_orders;
CREATE POLICY "anon_wo_all" ON work_orders
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- C. VEHICLES
DROP POLICY IF EXISTS "anon_vehicles_all" ON vehicles;
CREATE POLICY "anon_vehicles_all" ON vehicles
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- D. TRANSACTIONS & TRANSACTION DETAILS
DROP POLICY IF EXISTS "anon_transactions_all" ON transactions;
CREATE POLICY "anon_transactions_all" ON transactions
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "anon_td_all" ON transaction_details;
CREATE POLICY "anon_td_all" ON transaction_details
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- E. AUDIT LOGS
DROP POLICY IF EXISTS "anon_audit_all" ON audit_logs;
CREATE POLICY "anon_audit_all" ON audit_logs
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- F. USERS
DROP POLICY IF EXISTS "anon_users_select" ON users;
CREATE POLICY "anon_users_select" ON users
    FOR SELECT
    TO anon, authenticated
    USING (true);
