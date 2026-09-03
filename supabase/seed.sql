-- ==============================================================================
-- BENGKEL POS - INITIAL SEED DATA (INDONESIAN WORKSHOP)
-- ==============================================================================

-- 1. USERS (PIN: 1234 for Kasir, 9999 for Admin, 5678 for Mekanik)
INSERT INTO users (id, name, role, pin_hash, phone) VALUES
('11111111-1111-1111-1111-111111111111', 'Agus Prayitno (Kasir)', 'kasir', '1234', '081234567801'),
('22222222-2222-2222-2222-222222222222', 'Pak Bambang (Owner/Admin)', 'admin', '9999', '081234567802'),
('33333333-3333-3333-3333-333333333333', 'Doni Setiawan (Mekanik Senior)', 'mekanik', '5678', '081234567803'),
('44444444-4444-4444-4444-444444444444', 'Rian Hidayat (Mekanik)', 'mekanik', '5678', '081234567804')
ON CONFLICT (id) DO NOTHING;

-- 2. PRODUCTS (BARANG & JASA)
INSERT INTO products (id, code, name, category, sub_category, price, cost_price, stock, min_stock, unit) VALUES
-- Oli & Pelumas
('a0000001-0000-0000-0000-000000000001', 'OIL-001', 'Oli Shell Advance AX7 Matic 10W-40 0.8L', 'barang', 'Oli & Pelumas', 55000, 42000, 18, 5, 'Btl'),
('a0000002-0000-0000-0000-000000000002', 'OIL-002', 'Oli AHM MPX2 Matic 10W-30 0.8L', 'barang', 'Oli & Pelumas', 48000, 37000, 24, 6, 'Btl'),
('a0000003-0000-0000-0000-000000000003', 'OIL-003', 'Oli Yamalube Silver 20W-40 0.8L Bebek', 'barang', 'Oli & Pelumas', 42000, 32000, 12, 4, 'Btl'),
('a0000004-0000-0000-0000-000000000004', 'OIL-004', 'Oli Gardan Matic Shell Scooter Gear 120ml', 'barang', 'Oli & Pelumas', 18000, 12000, 30, 5, 'Tube'),
('a0000005-0000-0000-0000-000000000005', 'OIL-005', 'Oli Motul 3100 Gold 4T 10W-40 1L', 'barang', 'Oli & Pelumas', 85000, 68000, 2, 3, 'Btl'), -- LOW STOCK

-- Sparepart & Rem
('a0000006-0000-0000-0000-000000000006', 'BRK-001', 'Kampas Rem Depan Honda Beat / Vario FI', 'barang', 'Pengereman', 38000, 25000, 14, 4, 'Set'),
('a0000007-0000-0000-0000-000000000007', 'BRK-002', 'Kampas Rem Belakang Tromol Honda Beat', 'barang', 'Pengereman', 42000, 28000, 8, 3, 'Set'),
('a0000008-0000-0000-0000-000000000008', 'BRK-003', 'Kampas Rem Depan Yamaha NMAX / Aerox', 'barang', 'Pengereman', 65000, 48000, 1, 3, 'Set'), -- LOW STOCK
('a0000009-0000-0000-0000-000000000009', 'BRK-004', 'Minyak Rem DOT 4 Jumbo 50ml', 'barang', 'Pengereman', 15000, 9000, 20, 5, 'Btl'),

-- Mesin & Pengapian
('a0000010-0000-0000-0000-000000000010', 'IGN-001', 'Busi NGK CPR9EA-9 Standar Vario/Beat', 'barang', 'Pengapian', 22000, 14000, 22, 5, 'Pcs'),
('a0000011-0000-0000-0000-000000000011', 'IGN-002', 'Busi Daytona Iridium Racing', 'barang', 'Pengapian', 85000, 62000, 0, 2, 'Pcs'), -- HABIS
('a0000012-0000-0000-0000-000000000012', 'FLT-001', 'Filter Udara Honda Vario 125/150 eSP', 'barang', 'Filter', 45000, 32000, 6, 3, 'Pcs'),
('a0000013-0000-0000-0000-000000000013', 'CVT-001', 'Roller Vario 125 15 Gram Kawahara Set', 'barang', 'CVT', 75000, 55000, 5, 2, 'Set'),
('a0000014-0000-0000-0000-000000000014', 'CVT-002', 'V-Belt Mitsuboshi Honda Beat FI', 'barang', 'CVT', 95000, 72000, 4, 2, 'Pcs'),

-- Ban & Roda
('a0000015-0000-0000-0000-000000000015', 'TIR-001', 'Ban Tubeless Maxxis Victra 90/90-14', 'barang', 'Ban & Velg', 245000, 195000, 6, 2, 'Pcs'),
('a0000016-0000-0000-0000-000000000016', 'TIR-002', 'Pentil Tubeless Besi Chrome', 'barang', 'Ban & Velg', 10000, 4000, 35, 10, 'Pcs'),

-- Jasa & Biaya Servis
('j0000001-0000-0000-0000-000000000001', 'SRV-001', 'Jasa Ganti Oli Mesin / Gardan', 'jasa', 'Jasa Servis', 10000, 0, 999, 0, 'Jasa'),
('j0000002-0000-0000-0000-000000000002', 'SRV-002', 'Jasa Servis Ringan & Tune Up Matic / Bebek', 'jasa', 'Jasa Servis', 45000, 0, 999, 0, 'Jasa'),
('j0000003-0000-0000-0000-000000000003', 'SRV-003', 'Jasa Servis Lengkap + Bersih Injektor / Throttle Body', 'jasa', 'Jasa Servis', 75000, 0, 999, 0, 'Jasa'),
('j0000004-0000-0000-0000-000000000004', 'SRV-004', 'Jasa Servis CVT & Pembersihan Pulley', 'jasa', 'Jasa Servis', 35000, 0, 999, 0, 'Jasa'),
('j0000005-0000-0000-0000-000000000005', 'SRV-005', 'Jasa Ganti Ban Luar / Pasang Tubeless', 'jasa', 'Jasa Servis', 15000, 0, 999, 0, 'Jasa'),
('j0000006-0000-0000-0000-000000000006', 'SRV-006', 'Jasa Ganti Kampas Rem Depan / Belakang', 'jasa', 'Jasa Servis', 15000, 0, 999, 0, 'Jasa'),
('j0000007-0000-0000-0000-000000000007', 'SRV-007', 'Jasa Kuras Radiator & Tambah Coolant', 'jasa', 'Jasa Servis', 25000, 0, 999, 0, 'Jasa')
ON CONFLICT (id) DO NOTHING;

-- 3. VEHICLES (DATA PELANGGAN BENGKEL)
INSERT INTO vehicles (id, plate_number, owner_name, owner_phone, vehicle_type, notes) VALUES
('b1111111-1111-1111-1111-111111111111', 'B 3829 SJA', 'Budi Hartono', '081299887766', 'Honda Vario 125 2021', 'Rutin servis tiap 2000 KM'),
('b2222222-2222-2222-2222-222222222222', 'B 6612 GHA', 'Siti Rahmawati', '081377889900', 'Honda Beat Street 2022', 'Ganti oli MPX2'),
('b3333333-3333-3333-3333-333333333333', 'D 4590 ZKC', 'Eko Prasetyo', '087812345678', 'Yamaha NMAX 155 2020', 'Ada getar CVT saat akselerasi'),
('b4444444-4444-4444-4444-444444444444', 'F 2901 KLM', 'Hendro Wijaya', '085698741236', 'Yamaha Aerox 155 2023', 'Ban depan mulai tipis')
ON CONFLICT (id) DO NOTHING;

-- 4. WORK ORDERS (SPK BERJALAN)
INSERT INTO work_orders (id, invoice_no, vehicle_id, mechanic_id, status, mileage, complaint, diagnosis) VALUES
('w1111111-1111-1111-1111-111111111111', 'SPK-20260902-001', 'b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'in_progress', 28540, 'CVT gredek tarikan awal & rem depan bunyi gesek', 'Mangkok kopling kotor berdebu, kampas rem depan sisa 15%'),
('w2222222-2222-2222-2222-222222222222', 'SPK-20260902-002', 'b1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'pending', 19400, 'Servis berkala + ganti oli mesin & oli gardan', 'Menunggu giliran antrian pit 2')
ON CONFLICT (id) DO NOTHING;
