# 🛠️ BengkelPOS PRO - Modern Bengkel POS & Workshop Management System

Aplikasi Kasir & Manajemen Bengkel Modern Mobile-First berbasis **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**, **Zustand**, **Supabase / PostgreSQL** dengan **Atomic Concurrency Control**, dan **Thermal Printing Integration (Web Bluetooth & RawBT)**.

---

## 📚 DOKUMENTASI LENGKAP
Untuk buku panduan pengguna dan arsitektur teknis mendalam, silakan baca:
👉 **[DOKUMENTASI_TEKNIS.md](./DOKUMENTASI_TEKNIS.md)**

---

## 🌟 Fitur Utama

### 📱 1. Halaman Kasir (Mobile-First & iPhone 13 Optimized)
* **Katalog Adaptif:** 2-kolom di mobile, 4-kolom di desktop. Filter kategori (Semua, Barang, Jasa, Oli & Pelumas, Pengereman, CVT, Ban).
* **Indikator Stok Otomatis:** Badge visual saat stok `Habis` (0) atau `Stok Menipis` ($\le 3$).
* **Floating Cart Bar (Mobile):** Bar melayang di bawah layar HP saat ada item dipilih (`🛒 X Item | Rp Total -> Lihat Keranjang`) & side-panel pada desktop.
* **Format Rupiah Otomatis:** Masking input nominal mata uang (`Rp 55.000`).
* **Prevent iOS Auto-Zoom:** Input font $\ge 16\text{px}$ dan ukuran touch target tombol $\ge 46\text{px}$.
* **Multi-Metode Pembayaran:** Tunai (dengan kalkulasi kembalian otomatis), QRIS, dan Transfer Bank.

### 🖨️ 2. Integrasi Thermal POS Printing (58mm & 80mm)
* **Web Bluetooth API:** Cetak langsung dari browser Chrome Android & Desktop ke printer thermal bluetooth tanpa install driver tambahan.
* **RawBT Android Direct Print Intent:** Integrasi protocol `rawbt:data:base64,...` untuk pencetakan thermal instan via RawBT app di Android.
* **Kirim Struk WhatsApp:** Bagikan ringkasan struk belanja langsung ke nomor WhatsApp pelanggan.
* **Browser Print Layout:** Format khusus thermal receipt dengan CSS `@media print`.

### 📊 3. Dashboard Analytics & Master Data
* **Live KPI Dashboard:** Omset Hari Ini, Jumlah Transaksi, Total Omset Akumulatif, dan Counter Stok Menipis.
* **CRUD Master Barang & Jasa:** Table view di desktop dan Card-List view di mobile, inline stock updater, batas minimum stok.
* **Laporan Transaksi & Void Action:** Riwayat nota dengan fitur **Void (Batal Nota)** yang secara otomatis mengembalikan stok barang ke inventori dan mencatat ke audit trail.
* **CRM Kendaraan Bengkel:** Database plat nomor, nama pelanggan, kontak WhatsApp, dan riwayat servis.
* **SPK Servis (Work Orders):** Manajemen antrian servis, penugasan mekanik, odometer KM, dan catatan diagnosa keluhan motor.
* **Audit Trail & Security Logs:** Rekaman otomatis untuk setiap transaksi, void, dan penyesuaian stok.

---

## 🏗️ Struktur Folder Proyek

```
POS Build 01/
├── DOKUMENTASI_TEKNIS.md        # Panduan Teknis & Pengguna Lengkap
├── prisma/
│   └── schema.prisma            # Schema Prisma ORM
├── supabase/
│   ├── schema.sql               # DDL Schema, Index, Stored Procedures & Atomic Functions
│   └── seed.sql                 # Data awal Bengkel Motor Indonesia (Oli, Busi, Sparepart, dsb.)
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── audit-logs/page.tsx   # Audit Trail & Security Viewer
│   │   │   ├── page.tsx              # Dashboard KPI & Analytics
│   │   │   ├── products/page.tsx     # Master Data Barang & Jasa CRUD
│   │   │   ├── transactions/page.tsx # Laporan Transaksi & Void Action
│   │   │   ├── vehicles/page.tsx     # CRM Kendaraan & Pelanggan
│   │   │   └── work-orders/page.tsx  # SPK Antrian Servis & Mekanik
│   │   ├── pos/page.tsx              # Halaman Kasir POS Utama
│   │   ├── globals.css               # Tailwind & Print Media Styling
│   │   ├── layout.tsx                # Root Layout dengan Viewport iOS Anti-Zoom
│   │   └── page.tsx                  # Root redirect ke /pos
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # Root container wrapper & DB init
│   │   │   ├── Navbar.tsx            # Header dengan Jam Live & Switcher PIN
│   │   │   └── Sidebar.tsx           # Desktop Sidebar & Mobile Bottom Navigation
│   │   ├── pos/
│   │   │   ├── CartDrawer.tsx        # Keranjang belanja responsif (Desktop & Mobile)
│   │   │   ├── CheckoutModal.tsx     # Modal pembayaran & hitung kembalian
│   │   │   ├── ProductCard.tsx       # Card katalog dengan badge stok
│   │   │   ├── ReceiptModal.tsx      # Modal preview struk & trigger printer Bluetooth
│   │   │   └── VehicleSelectorModal.tsx # Pencarian plat nomor & registrasi CRM
│   │   └── ui/
│   │       ├── Badge.tsx             # Visual badge indikator
│   │       ├── Modal.tsx             # Modal dialog dengan backdrop blur
│   │       ├── PinPadModal.tsx       # Numpad PIN untuk login & ganti peran
│   │       └── Toast.tsx             # Floating notification toaster
│   ├── lib/
│   │   ├── printer.ts                # ESC/POS byte builder, Web Bluetooth & RawBT intent
│   │   ├── storage.ts                # Storage engine dengan simulasi Atomic Concurrency
│   │   ├── supabase.ts               # Supabase JS client configuration
│   │   └── utils.ts                  # Helper Rupiah formatting & Invoice generator
│   ├── stores/
│   │   ├── useAuthStore.ts           # State autentikasi PIN & User Role
│   │   ├── useCartStore.ts           # State Keranjang POS & Checkout
│   │   └── useToastStore.ts          # State Toast Notifications
│   └── types/
│       └── index.ts                  # TypeScript Interface Definitions
├── .env.example
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🚀 Cara Menjalankan Proyek

### 1. Instalasi Dependencies
```bash
npm install
```

### 2. Menjalankan Server Development
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### 3. Build Mode Produksi
```bash
npm run build
npm start
```

---

## 🔑 Demo Akun & PIN Default

| Role | Nama Pengguna | PIN |
| :--- | :--- | :--- |
| **Kasir** | Agus Prayitno | `1234` |
| **Admin / Owner** | Pak Bambang | `9999` |
| **Mekanik** | Doni Setiawan | `5678` |

---

## 🛡️ Atomic Concurrency Control (Race Condition Prevention)

Pada `supabase/schema.sql`, transaksi checkout menggunakan function `fn_checkout_transaction` yang mengunci baris produk (`FOR UPDATE`) dan memvalidasi `stock >= qty` secara atomik dalam single transaction block. Jika terjadi 2 kasir checkout produk dengan stok 1 secara bersamaan, transaksi kedua akan di-rollback dengan aman.

Fitur **Void Transaksi** (`fn_void_transaction`) secara otomatis membalikkan dan menambahkan kembali seluruh stok item bertipe `barang` serta mencatat riwayat pembatalan ke tabel `audit_logs`.
