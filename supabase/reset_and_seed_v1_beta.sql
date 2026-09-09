-- BERSHKAN SEMUA DATA UNTUK BETA TEST
-- Hati-hati, ini akan menghapus semua data operasional bengkel!

TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE transaction_details RESTART IDENTITY CASCADE;
TRUNCATE TABLE transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE work_orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE vehicles RESTART IDENTITY CASCADE;

-- Opsi: jika ingin mengembalikan produk ke stok default juga
-- UPDATE products SET stock = 100;

-- Selesai.

