-- ==============================================================================
-- MIGRATION: 20260903_enable_realtime_replication.sql
-- PERBAIKAN BUG #3: Supabase Realtime Subscriptions untuk Sinkronisasi Lintas Device
-- ==============================================================================

-- 1. SET REPLICA IDENTITY FULL
-- Memastikan payload event realtime 'UPDATE' dan 'DELETE' memuat seluruh kolom (new & old record)
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE transaction_details REPLICA IDENTITY FULL;
ALTER TABLE work_orders REPLICA IDENTITY FULL;

-- 2. TAMBAHKAN TABEL KE PUBLIKASI SUPABASE_REALTIME
-- Supabase hanya menyiarkan event postgres_changes untuk tabel yang terdaftar di publication ini
DO $$
BEGIN
    -- Cek apakah publication supabase_realtime sudah ada
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Tambahkan tabel jika belum terdaftar
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE products;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE transaction_details;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END;
$$;
