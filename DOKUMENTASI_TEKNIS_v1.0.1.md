# 📖 DOKUMENTASI TEKNIS & PANDUAN PENGGUNA
# BENGKELPOS PRO (PROGRESSIVE WEB APP & CLOUD SYNC) v1.0.1

BengkelPOS PRO adalah aplikasi Kasir & Manajemen Bengkel modern yang mengusung konsep **Offline-First & Cloud-Synced**. Dibangun dengan **Next.js 14**, **React 18**, **TypeScript**, **Zustand**, dan **Supabase PostgreSQL**. Aplikasi ini dapat diinstal sebagai **PWA (Progressive Web App)** di Android, iOS, dan Desktop layaknya aplikasi native, serta memiliki kapabilitas cetak struk thermal langsung dari browser.

---

## 1. TECH STACK & TEKNOLOGI UTAMA

| Lapisan (Layer) | Teknologi | Fungsi & Alasan Penggunaan |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) | Mengelola routing halaman kasir & admin. Route dikonfigurasi sebagai *Static Shell* untuk kecepatan muat awal (<50ms). |
| **PWA**| "next-pwa" & Service Worker | Mengizinkan instalasi aplikasi ke *Home Screen* dan menyimpan aset di cache browser agar tetap bisa terbuka sangat cepat meskipun offline. |
| **State Management** | Zustand | Menyimpan state keranjang ("useCartStore") dan data realtime ("useDataStore"). Sangat ringan dan reaktif tanpa butuh Context Provider yang rumit. |
| **Backend & Database** | Supabase (PostgreSQL) | Bertindak sebagai *Single Source of Truth* di cloud. Menyimpan data relasional SPK, Inventori, dan Transaksi secara cloud. |
| **Realtime Engine** | Supabase Realtime | Menyebarkan perubahan data (contoh: status SPK Mekanik ke Kasir) ke seluruh perangkat aktif dalam hitungan milidetik secara *live*. |
| **Styling UI** | Tailwind CSS & Lucide Icons | Membuat UI yang *mobile-first*, bersih, responsif, dan mudah dimodifikasi tanpa menulis file CSS eksternal. |

---

## 2. ARSITEKTUR "OFFLINE-FIRST" & SINKRONISASI

Aplikasi dirancang agar **kasir tidak pernah menunggu loading jaringan** saat sedang melayani pelanggan di bengkel.

1. **Optimistic UI & Local Cache:** 
   Saat kasir menekan "Bayar", data langsung disimpan ke penyimpanan lokal perangkat ("localStorage" via "BengkelStorage") dan antarmuka (UI) langsung sukses (0 milidetik latensi). Di latar belakang, fungsi pengirim data ke tabel Supabase baru akan dijalankan.
2. **Auto-Reconnect & Catch-Up:** 
   Aplikasi selalu memonitor status perangkat ("online", layar nyala kembali, ganti tab). Jika HP/Laptop sempat hilang sinyal lalu terhubung kembali, sistem secara otomatis memanggil fungsi "refreshData()" untuk menarik data terbaru dari Supabase tanpa perlu menekan tombol refresh (F5).
3. **Cross-Device Realtime Sync:** 
   Kasir di Desktop dan Mekanik di HP saling terhubung via WebSocket. Ketika Mekanik mengubah status SPK menjadi "Selesai", aplikasi Kasir akan langsung ter-update otomatis dalam hitungan milidetik.
4. **Pencegahan Transaksi Ganda (Idempotency):** 
   Setiap transaksi dibekali "client_transaction_id" (UUID dari browser). Jika koneksi tidak stabil dan aplikasi mencoba mengirim ulang pesanan (karena kasir double-click "Bayar"), server database tidak akan memotong stok atau membuat laporan keuangan ganda.

---

## 3. FITUR & MODUL UTAMA APLIKASI

### Mode Kasir (Point of Sales) - /pos`n* **Mobile-First Touch UI:** Desain tombol keranjang dan daftar produk disesuaikan untuk layar sentuh HP kasir.
* **Keranjang Reaktif:** Total harga, harga modal, potongan, dan kalkulator kembalian tunai terhitung secara live.
* **Integrasi Kendaraan (CRM):** Kasir dapat mengaitkan setiap transaksi belanja dan servis dengan Plat Nomor kendaraan pelanggan secara cepat.

### Dashboard & Analytics - /admin`n* Dasbor utama untuk Pemilik / Admin bengkel.
* Pantauan omset harian, indikator total transaksi, dan peringatan visual untuk **Stok Menipis**.

### Master Data Barang & Jasa - /admin/products`n* Input dan kelola inventori sparepart, harga beli, harga jual, stok gudang, dan kategori (Barang Fisik vs Jasa Servis).
* Fitur *Quick Stock Update* ("+" / "-") langsung dari tabel untuk memudahkan mekanik/kasir menyesuaikan opname stok.

### Laporan Transaksi & Pembatalan (Void) - /admin/transactions`n* Riwayat penjualan historis harian/bulanan.
* **Fitur VOID:** Jika kasir salah input nota, Admin dapat melakukan *Void*. Aplikasi akan membatalkan nota tersebut secara aman dan **mengembalikan (restoring)** stok fisik suku cadang yang sudah terpotong kembali ke dalam tabel inventori gudang.

### SPK Servis & Antrian (Work Orders) - /admin/work-orders`n* Modul digital untuk Mekanik memantau perbaikan motor.
* Status alur kerja: "Menunggu" -> "Sedang Dikerjakan" -> "Selesai".
* Mekanik dapat mencatat detail keluhan, diagnosa mekanik, dan catatan (notes) perbaikan langsung dari layar HP-nya di bawah kolong motor.

### CRM Kendaraan Pelanggan - /admin/vehicles`n* Database terpusat seluruh nomor polisi, tipe motor, tanggal servis terakhir, dan nomor HP. 
* Dilengkapi dengan tombol "Kirim Nota/Pesan via WhatsApp".

---

## 4. SKEMA DATABASE & KEAMANAN 

Berjalan di atas PostgreSQL (Supabase) dengan konfigurasi keamanan *Row Level Security* (RLS).

**Tabel Database Utama:**
1. "users" — Data pin akses kasir, admin, dan mekanik.
2. "products" — Katalog sparepart dan oli (memonitor "stock" realtime).
3. "vehicles" — Data pelanggan dan plat nomor CRM.
4. "transactions" — Header/kepala Nota Belanja.
5. "transaction_details" — Detail keranjang per-nota (mengunci "price_at_sale").
6. "work_orders" — Lembar Kerja Servis (SPK).
7. "audit_logs" — Rekaman jejak keamanan untuk pelacakan aksi mencurigakan.

---

## 5. INTEGRASI THERMAL PRINTING

Tidak perlu repot meng-install driver printer Windows/Mac. Aplikasi ini dapat langsung menembak ke Printer Kasir:

1. **Web Bluetooth API:** Mencetak dari browser Google Chrome (Desktop/Android) langsung ke printer Bluetooth thermal kasir (ukuran kertas 58mm atau 80mm) menggunakan command ESC/POS bawaan.
2. **RawBT Android:** Integrasi *Intent Scheme* "rawbt:base64..." jika kasir lebih nyaman menggunakan aplikasi bantu RawBT di Android.
3. **Browser Print:** Modul desain CSS khusus "@media print" untuk mencetak nota menggunakan Printer standar A4/A5, PDF, atau dialog sistem konvensional ("Ctrl+P").
4. **Struk Digital (Paperless):** Membangun teks format rapi untuk dikirimkan sebagai *invoice digital* ke nomor WhatsApp pelanggan.

---

## 6. PANDUAN PENGATURAN VERCEL (DEPLOYMENT)

Aplikasi ini *stateless* pada sisi servernya sehingga Vercel adalah tempat hosting ideal. 

**Variabel Lingkungan (Environment Variables) di Vercel:**
Agar fitur Sinkronisasi Cloud, pencetakan nota, dan judul toko berjalan baik, pastikan variabel berikut sudah terisi di menu **Settings > Environment Variables** pada Vercel Anda:

* "NEXT_PUBLIC_SUPABASE_URL" = "https://<kode-unik>.supabase.co"
* "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "<kunci-anonim-panjang>"
* "NEXT_PUBLIC_WORKSHOP_NAME" = "BENGKEL ANDA"
* "NEXT_PUBLIC_WORKSHOP_PHONE" = "081xxxx"
* "NEXT_PUBLIC_WORKSHOP_ADDRESS" = "Alamat Bengkel Anda"
* "NEXT_PUBLIC_DEFAULT_PRINTER_WIDTH" = "58" *(Ukuran kertas: 58 atau 80)*

**PENTING**: Jika Anda mengubah variabel ini di Vercel, pastikan untuk menekan tombol **"Redeploy"** di tab Deployments agar nilai baru dimasukkan/di-bake ke dalam kode JavaScript Next.js.

---

*Dokumentasi v1.0.1 - Terakhir diperbarui: September 2026*
