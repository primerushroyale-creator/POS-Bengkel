# 📖 DOKUMENTASI TEKNIS & PANDUAN PENGGUNA
# BENGKEL POS & WORKSHOP MANAGEMENT SYSTEM (PRO)

Aplikasi Web Modern Sistem Kasir & Manajemen Bengkel Mobile-First berbasis **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**, **Zustand**, **Supabase / PostgreSQL Schema** dengan **Atomic Concurrency Control**, serta **Integrasi Thermal Printing (Web Bluetooth & RawBT)**.

---

## 📑 DAFTAR ISI
1. [Ringkasan Proyek & Arsitektur](#1-ringkasan-proyek--arsitektur)
2. [Tech Stack & Library](#2-tech-stack--library)
3. [Struktur Folder Codebase](#3-struktur-folder-codebase)
4. [Skema Database & Atomic Concurrency Control](#4-skema-database--atomic-concurrency-control)
5. [Integrasi Thermal Printing POS](#5-integrasi-thermal-printing-pos)
6. [Panduan Modul & Fitur Aplikasi](#6-panduan-modul--fitur-aplikasi)
   - [Halaman Kasir POS (Mobile-First)](#61-halaman-kasir-pos-mobile-first)
   - [Dashboard & Analytics](#62-dashboard--analytics)
   - [Master Data Barang & Jasa](#63-master-data-barang--jasa)
   - [Laporan Transaksi & Fitur Void](#64-laporan-transaksi--fitur-void)
   - [Data Kendaraan CRM Bengkel](#65-data-kendaraan-crm-bengkel)
   - [SPK Servis & Antrian Mekanik](#66-spk-servis--antrian-mekanik)
   - [Audit Trail & Log Keamanan](#67-audit-trail--log-keamanan)
7. [Matriks Peran Pengguna & Autentikasi PIN](#7-matriks-peran-pengguna--autentikasi-pin)
8. [Panduan Instalasi & Menjalankan Aplikasi](#8-panduan-instalasi--menjalankan-aplikasi)
9. [Panduan Deploy ke Cloud (Vercel & Supabase)](#9-panduan-deploy-ke-cloud-vercel--supabase)
10. [Troubleshooting & Solusi Kendala Umum](#10-troubleshooting--solusi-kendala-umum)

---

## 1. RINGKASAN PROYEK & ARSITEKTUR

Sistem ini dirancang khusus untuk memodernisasi operasional bengkel motor/mobil dari sistem lama (Google Apps Script / Excel) menjadi aplikasi web modern yang sangat cepat, responsif, dan dioptimalkan untuk perangkat mobile (iPhone/Android) maupun desktop di meja kasir.

```
+-------------------------------------------------------------------------+
|                        BENGKEL POS CLIENT (NEXT.JS)                     |
|                                                                         |
|  +-----------------------+  +-------------------+  +-----------------+  |
|  |     Zustand Stores    |  |  UI (Tailwind CSS)|  | Thermal Printing|  |
|  | - useCartStore        |  | - Kasir POS       |  | - Web Bluetooth |  |
|  | - useAuthStore (PIN)  |  | - Dashboard       |  | - RawBT Intent  |  |
|  | - useToastStore       |  | - Master Barang   |  | - WA Digital    |  |
|  +-----------------------+  +-------------------+  +-----------------+  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        DATA & STORAGE ENGINE                            |
|                                                                         |
|  +-------------------------------------+  +--------------------------+  |
|  |       Supabase / PostgreSQL         |  |   Local Reactive Engine  |  |
|  | - fn_checkout_transaction (FOR UPD) |  | - Standalone Zero-Config |  |
|  | - fn_void_transaction (Auto-Restore)|  | - Atomic Stock Decrement |  |
|  | - Row Level Security (RLS)          |  | - Indonesian Seed Data   |  |
|  +-------------------------------------+  +--------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 2. TECH STACK & LIBRARY

| Komponen | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) | Server & Client Components, Dynamic Routing, Fast Refresh |
| **UI Library** | React 18 + TypeScript | Komponen strongly-typed dengan verifikasi tipe data ketat |
| **Styling & Theme** | Tailwind CSS 3 | Light clean theme (`#f8fafc` + Indigo `#4f46e5`), Glassmorphism |
| **Icon Pack** | Lucide React | Ikon modern, clean, dan ringan |
| **State Management** | Zustand 4 | Lightweight reactive state untuk Keranjang, Auth, dan Notifikasi |
| **Database & ORM** | PostgreSQL / Supabase / Prisma | Skema relational dengan foreign key, constraint, dan index |
| **Thermal Printing** | Web Bluetooth API & RawBT | ESC/POS binary command generator untuk printer 58mm & 80mm |

---

## 3. STRUKTUR FOLDER CODEBASE

```
POS Build 01/
├── prisma/
│   └── schema.prisma            # Schema Prisma ORM
├── supabase/
│   ├── schema.sql               # DDL Schema, Index, Stored Procedures & Atomic Functions
│   └── seed.sql                 # Data awal Bengkel Motor Indonesia
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── audit-logs/page.tsx   # Halaman Audit Trail Viewer
│   │   │   ├── page.tsx              # Halaman Dashboard KPI & Analytics
│   │   │   ├── products/page.tsx     # Halaman Master Data Barang & Jasa CRUD
│   │   │   ├── transactions/page.tsx # Halaman Laporan & Void Action
│   │   │   ├── vehicles/page.tsx     # Halaman CRM Kendaraan & Pelanggan
│   │   │   └── work-orders/page.tsx  # Halaman SPK Servis & Antrian Mekanik
│   │   ├── pos/page.tsx              # Halaman Utama Kasir POS Mobile-First
│   │   ├── globals.css               # Styling Global & Print Media CSS (@media print)
│   │   ├── layout.tsx                # Root Layout dengan Viewport Anti-Zoom iOS
│   │   └── page.tsx                  # Root redirect ke /pos
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # Root Layout Container & DB Initializer
│   │   │   ├── Navbar.tsx            # Header Top Bar dengan Jam Live & PIN Switcher
│   │   │   └── Sidebar.tsx           # Desktop Sidebar & Mobile Bottom Tabs
│   │   ├── pos/
│   │   │   ├── CartDrawer.tsx        # Panel Keranjang Responsif (Desktop & Mobile)
│   │   │   ├── CheckoutModal.tsx     # Modal Pembayaran & Kalkulasi Kembalian Tunai
│   │   │   ├── ProductCard.tsx       # Touch Card Produk dengan Visual Stock Badge
│   │   │   ├── ReceiptModal.tsx      # Modal Preview Struk & Trigger Bluetooth Printer
│   │   │   └── VehicleSelectorModal.tsx # Pencarian Plat No & Registrasi CRM Cepat
│   │   └── ui/
│   │       ├── Badge.tsx             # Visual Tag Status
│   │       ├── Modal.tsx             # Modal Dialog dengan Backdrop Blur
│   │       ├── PinPadModal.tsx       # Numpad PIN untuk Pergantian User Kasir/Admin
│   │       └── Toast.tsx             # Notifikasi Melayang Top-Right
│   ├── lib/
│   │   ├── printer.ts                # Generator ESC/POS, Konektor Bluetooth & RawBT
│   │   ├── storage.ts                # Storage Engine dengan Atomic Concurrency Control
│   │   ├── supabase.ts               # Konfigurasi Supabase Client JS
│   │   └── utils.ts                  # Formatter Rupiah, Tanggal Indo, & Generator Invoice
│   ├── stores/
│   │   ├── useAuthStore.ts           # State Autentikasi PIN & User Session
│   │   ├── useCartStore.ts           # State Keranjang POS & Checkout
│   │   └── useToastStore.ts          # State Notifikasi Toast
│   └── types/
│       └── index.ts                  # Definisi TypeScript Interface Lengkap
├── .env.example
├── DOKUMENTASI_TEKNIS.md
├── next.config.js
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
└── tsconfig.json
```

---

## 4. SKEMA DATABASE & ATOMIC CONCURRENCY CONTROL

Database schema dirancang menggunakan PostgreSQL / Supabase untuk menjamin integritas data transaksi dan inventori secara menyeluruh.

### 4.1 Tabel Database

1. **`users`**: Menyimpan data kasir, admin, dan mekanik (`id`, `name`, `role`, `pin_hash`, `phone`, `is_active`, `created_at`).
2. **`products`**: Katalog barang sparepart & jasa servis (`id`, `code`, `name`, `category`, `sub_category`, `price`, `cost_price`, `stock`, `min_stock`, `unit`, `is_active`).
3. **`vehicles`**: CRM database kendaraan pelanggan (`id`, `plate_number`, `owner_name`, `owner_phone`, `vehicle_type`, `notes`, `last_service_date`).
4. **`transactions`**: Header transaksi nota (`id`, `invoice_no`, `cashier_id`, `vehicle_id`, `total_amount`, `discount_amount`, `cash_given`, `change_amount`, `payment_method`, `status`, `void_reason`, `created_at`).
5. **`transaction_details`**: Rincian item nota (`id`, `transaction_id`, `product_id`, `qty`, `price_at_sale`, `cost_at_sale`, `subtotal`).
6. **`work_orders`**: SPK antrian servis bengkel (`id`, `invoice_no`, `vehicle_id`, `mechanic_id`, `status`, `mileage`, `complaint`, `diagnosis`, `notes`).
7. **`audit_logs`**: Rekaman jejak keamanan (`id`, `user_id`, `action`, `details`, `created_at`).

### 4.2 Pencegahan Race Condition (Atomic Concurrency Control)

Untuk mencegah *oversell* saat 2 kasir melakukan checkout barang yang tersisa 1 secara bersamaan:
* **Fungsi `fn_checkout_transaction`** di PostgreSQL menggunakan klausa `FOR UPDATE` saat memverifikasi baris produk.
* Sistem memeriksa apakah `product.stock >= qty`. Jika tidak mencukupi, seluruh transaksi dibatalkan (*rollback*) dengan error eksplisit.
* Hanya item dengan kategori `barang` yang memotong stok, sementara kategori `jasa` tidak memiliki batasan stok fisik.

### 4.3 Fitur Batal Nota (Atomic Void Transaction)

* **Fungsi `fn_void_transaction`** menandai status transaksi menjadi `void`, mencatat alasan pembatalan dan nama petugas, secara otomatis mengembalikan seluruh stok barang ke tabel `products`, dan menuliskan rekam jejak ke `audit_logs`.

---

## 5. INTEGRASI THERMAL PRINTING POS

Aplikasi mendukung 4 metode cetak struk tanpa ketergantungan driver pihak ketiga yang rumit:

```
+-------------------+-------------------------------------------------------------+
| Metode Cetak      | Deskripsi & Cara Kerja                                      |
+-------------------+-------------------------------------------------------------+
| 1. Web Bluetooth  | Menggunakan Web Bluetooth API langsung dari Chrome Android  |
|    Thermal Direct | atau Desktop untuk pairing ke Printer Thermal 58mm/80mm     |
|                   | dan mengirim command ESC/POS (Initialize, Align, Bold, Cut).|
+-------------------+-------------------------------------------------------------+
| 2. RawBT Android  | Mengirim data struk yang di-encode Base64 ke aplikasi       |
|    Intent Direct  | RawBT Android via URL Scheme: rawbt:data:base64,...         |
+-------------------+-------------------------------------------------------------+
| 3. WhatsApp Struk | Menghasilkan ringkasan nota digital terformat rapi dan      |
|    Digital        | membuka WhatsApp Web / App dengan satu klik ke nomor HP.   |
+-------------------+-------------------------------------------------------------+
| 4. Browser Print  | Layout struk monospace thermal yang kompatibel dengan print |
|    (Ctrl + P)     | dialog browser dan printer PDF standar via CSS @media print.|
+-------------------+-------------------------------------------------------------+
```

### Parameter Ukuran Kertas:
* **58mm (Lebar 32 Karakter):** Format standar mini thermal Bluetooth portable.
* **80mm (Lebar 48 Karakter):** Format printer kasir desktop berkecepatan tinggi (Epson/Xprinter).

---

## 6. PANDUAN MODUL & FITUR APLIKASI

### 6.1 Halaman Kasir POS (Mobile-First)
* **Pencarian Cepat & Filter Kategori:** Cari nama produk atau kode SKU secara realtime. Filter chip (Semua, Barang, Jasa, Oli, Rem, CVT, Ban).
* **Indikator Visual Stok:**
  * Badge Merah `Habis`: Stok $= 0$, tombol tambah nonaktif.
  * Badge Kuning `Sisa X`: Stok $\le$ batas minimum (default: 3).
* **Hubungkan Kendaraan (CRM Selector):** Klik tombol `+ Pilih Plat No` untuk mencari atau mendaftarkan nomor polisi dan nama pemilik kendaraan secara instan.
* **Mobile Floating Cart Bar:** Bar melayang di bawah layar HP saat ada barang yang dipilih (`🛒 X Item | Rp Total -> Lihat Keranjang`).
* **Modal Pembayaran:**
  * Pilih Tunai, QRIS, atau Transfer.
  * Tombol uang cepat: `Uang Pas`, `+50rb`, `+100rb`, `200rb`.
  * Hitung kembalian otomatis.
  * Validasi: Tombol checkout terkunci jika uang tunai kurang.
* **Anti Auto-Zoom iOS:** Seluruh target input berukuran minimal `16px` dan tombol minimal `46px` untuk kenyamanan pengguna iPhone & Android.

### 6.2 Dashboard & Analytics
* **KPI Utama:** Omset Hari Ini, Jumlah Transaksi, Omset Akumulatif, dan Counter Stok Menipis.
* **Peringatan Stok Rendah:** Menampilkan daftar barang yang harus segera di-restock ke supplier.
* **Transaksi Terbaru:** Menampilkan riwayat nota terbaru beserta statusnya.

### 6.3 Master Data Barang & Jasa
* **CRUD Penuh:** Tambah, Edit, dan Hapus data barang fisik maupun jasa servis.
* **Inline Quick Stock Updater:** Tombol `+` dan `-` langsung di tabel/card untuk penyesuaian stok harian yang cepat.
* **Tampilan Fleksibel:** Mode Tabel di layar desktop, dan Mode Card di layar smartphone.

### 6.4 Laporan Transaksi & Fitur Void
* **Filter:** Berdasarkan status (Semua, Sukses, VOID), rentang tanggal, atau pencarian nomor nota.
* **Cetak Ulang:** Kemampuan cetak ulang struk thermal kapan saja.
* **Void Transaksi:** Tombol `Void` dengan form alasan pembatalan. Stok barang otomatis dipulihkan ke gudang.

### 6.5 Data Kendaraan CRM Bengkel
* Database nomor polisi, nama pelanggan, tipe motor, dan catatan riwayat servis.
* Tombol WhatsApp langsung untuk menghubungi pelanggan saat motor selesai diservis.
* Riwayat transaksi servis spesifik per kendaraan.

### 6.6 SPK Servis & Antrian Mekanik
* Mengatur alur kerja: `Antrian (Pending)` $\rightarrow$ `Dikerjakan (In Progress)` $\rightarrow$ `Selesai (Completed)`.
* Catatan keluhan pelanggan, catatan diagnosis mekanik, dan odometer (KM).
* Pembagian penugasan mekanik.

### 6.7 Audit Trail & Log Keamanan
* Merekam setiap aksi penting: `CHECKOUT_TRANSACTION`, `VOID_TRANSACTION`, `STOCK_ADJUSTMENT`, `USER_LOGIN`, `CREATE_PRODUCT`, `UPDATE_PRODUCT`.
* Mencatat waktu kejadian, user pelaksana, dan payload data JSON lengkap.

---

## 7. MATRIKS PERAN PENGGUNA & AUTENTIKASI PIN

Aplikasi menggunakan sistem login berbasis PIN 4-6 digit yang sangat cepat untuk lingkungan bengkel yang sibuk:

| Akun Demo | Peran (Role) | PIN Default | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Agus Prayitno** | `kasir` | `1234` | Kasir POS, Buat Transaksi, Cetak Struk, Input Kendaraan |
| **Pak Bambang** | `admin` (Owner) | `9999` | Seluruh Modul: Kasir, Dashboard, Master Barang, Void Transaksi, SPK, Audit Trail |
| **Doni Setiawan** | `mekanik` | `5678` | SPK Servis, Update Status Pengerjaan Motor, Diagnosa |

*Untuk mengganti peran atau login, klik avatar/nama user di pojok kanan atas Navbar.*

---

## 8. PANDUAN INSTALASI & MENJALANKAN APLIKASI

### Persyaratan Sistem:
* Node.js v18 atau v20+
* NPM atau PNPM

### Langkah-langkah:

1. **Buka Terminal di Direktori Proyek:**
   ```powershell
   cd "c:\Users\hp\Documents\Yoga\Private\POS Build 01"
   ```

2. **Install Dependencies (jika belum):**
   ```powershell
   npm install
   ```

3. **Jalankan Server Development:**
   ```powershell
   npm run dev
   ```

4. **Buka Browser:**
   Kunjungi **`http://localhost:3000`** (atau langsung ke **`http://localhost:3000/pos`**).

5. **Build untuk Mode Produksi:**
   ```powershell
   npm run build
   npm start
   ```

---

## 9. PANDUAN DEPLOY KE CLOUD (VERCEL & SUPABASE)

### Deploy Frontend ke Vercel:
1. Push repository ini ke GitHub / GitLab.
2. Buat proyek baru di [Vercel](https://vercel.com) dan import repository.
3. Tambahkan Environment Variable di Vercel:
   ```env
   NEXT_PUBLIC_WORKSHOP_NAME="BENGKEL MOTOR JAYA ABADI"
   NEXT_PUBLIC_WORKSHOP_ADDRESS="Jl. Raya Otomotif No. 88, Jakarta"
   NEXT_PUBLIC_WORKSHOP_PHONE="0812-3456-7890"
   NEXT_PUBLIC_DEFAULT_PRINTER_WIDTH="58"
   ```
4. Klik **Deploy**.

### Setup Database Supabase (Opsional untuk Database Cloud):
1. Buat project baru di [Supabase](https://supabase.com).
2. Buka menu **SQL Editor** di dashboard Supabase.
3. Copy-paste isi file [`supabase/schema.sql`](file:///c:/Users/hp/Documents/Yoga/Private/POS%20Build%2001/supabase/schema.sql) dan klik **Run**.
4. Copy-paste isi file [`supabase/seed.sql`](file:///c:/Users/hp/Documents/Yoga/Private/POS%20Build%2001/supabase/seed.sql) dan klik **Run**.
5. Salin URL dan Anon Key dari Project Settings $\rightarrow$ API ke file `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

---

## 10. TROUBLESHOOTING & SOLUSI KENDALA UMUM

### Q1: Perintah `npm` tidak dikenali saat buka jendela PowerShell baru?
**Solusi:** Jalankan perintah berikut di PowerShell atau tambahkan ke PATH Environment:
```powershell
$env:PATH = "C:\Users\hp\AppData\Local\Programs\nodejs;" + $env:PATH
```

### Q2: Bluetooth Printer tidak terdeteksi saat tombol cetak diklik?
**Solusi:**
1. Pastikan Bluetooth di perangkat HP / Laptop sudah aktif.
2. Pastikan printer thermal sudah dalam kondisi menyala (*ON*).
3. Gunakan browser **Google Chrome** (karena Web Bluetooth API membutuhkan engine Chromium).
4. Jika menggunakan HP Android, Anda juga dapat menggunakan opsi tombol **`RawBT Direct Print`**.

### Q3: Apakah aplikasi bisa berjalan tanpa koneksi internet (Offline)?
**Solusi:** Ya, aplikasi dilengkapi dengan storage engine lokal yang berjalan langsung di browser client sehingga transaksi kasir tetap dapat dilakukan secara lancar.

---

*Dokumentasi ini disiapkan untuk BengkelPOS PRO v1.0.0. Terakhir diperbarui: 03 September 2026.*
