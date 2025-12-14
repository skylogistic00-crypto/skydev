# 📊 SISTEM AKUNTANSI TERINTEGRASI - TEMPOLABS

## 🎯 OVERVIEW

Sistem akuntansi terintegrasi yang menghubungkan **Chart of Accounts (COA)** dengan semua jenis transaksi barang, jasa, biaya, dan pajak. Setiap transaksi otomatis membuat jurnal yang terintegrasi dengan COA.

---

## 🗂️ STRUKTUR TABEL & RELASI

### 1️⃣ **chart_of_accounts** (Master COA)
Tabel master untuk semua akun keuangan perusahaan.

**Kolom:**
- `id` - UUID primary key
- `account_code` - Kode akun unik (format: 1-1100)
- `account_name` - Nama akun
- `account_type` - Tipe akun (Aset, Kewajiban, Ekuitas, Pendapatan, Beban)
- `level` - Level hierarki (1=utama, 2=sub, dst)
- `is_header` - Apakah akun ini header/grup
- `normal_balance` - Saldo normal (Debit/Kredit)
- `description` - Deskripsi akun
- `is_active` - Status aktif

**Contoh Data:**
```
1-1100 | Kas & Setara Kas | Aset | Debit
4-2100 | Pendapatan Jasa Storage/Penyimpanan | Pendapatan | Kredit
5-1100 | Biaya Freight/Ongkos Kirim | Beban Pokok Penjualan | Debit
```

---

### 2️⃣ **service_items** (Master Jasa)
Tabel untuk menyimpan item jasa yang dijual.

**Kolom:**
- `id` - UUID primary key
- `item_name` - Nama jasa
- `description` - Deskripsi jasa
- `price` - Harga jasa
- `unit` - Satuan (Jam, Paket, Bulan, dll)
- `category` - Kategori jasa
- `coa_revenue_code` - **FK → chart_of_accounts** (Akun Pendapatan)
- `coa_expense_code` - **FK → chart_of_accounts** (Akun Beban, optional)
- `is_active` - Status aktif

**Mapping COA:**
- `coa_revenue_code` → Akun yang akan di-**KREDIT** saat penjualan jasa
- `coa_expense_code` → Akun yang akan di-**DEBIT** jika ada biaya langsung

**Contoh:**
```
Konsultasi IT
- Revenue: 4-2100 (Pendapatan Jasa Storage)
- Expense: 6-5400 (Konsultan IT)
```

---

### 3️⃣ **inventory_items** (Master Barang)
Tabel untuk menyimpan item barang/persediaan.

**Kolom:**
- `id` - UUID primary key
- `item_name` - Nama barang
- `qty_available` - Stok tersedia
- `cost_per_unit` - Harga pokok per unit
- `coa_inventory_code` - **FK → chart_of_accounts** (Akun Persediaan)
- `coa_cogs_code` - **FK → chart_of_accounts** (Akun HPP)

**Mapping COA:**
- `coa_inventory_code` → Akun persediaan (1-14xx)
- `coa_cogs_code` → Akun Harga Pokok Penjualan (5-xxxx)

**Contoh:**
```
Kardus Kemasan
- Inventory: 1-1410 (Persediaan Bahan Kemasan)
- COGS: 5-1500 (Biaya Bahan Kemasan - Cargo)
```

---

### 4️⃣ **sales_transactions** (Transaksi Penjualan)
Tabel untuk mencatat semua transaksi penjualan barang dan jasa.

**Kolom:**
- `id` - UUID primary key
- `transaction_date` - Tanggal transaksi
- `transaction_type` - Jenis (Barang / Jasa)
- `item_id` - FK → inventory_items (jika Barang)
- `item_name` - Nama item
- `quantity` - Jumlah
- `unit_price` - Harga per unit
- `subtotal` - Total sebelum pajak
- `tax_percentage` - Persentase pajak
- `tax_amount` - Jumlah pajak
- `total_amount` - Total akhir
- `payment_method` - Metode pembayaran (Tunai, Transfer, Piutang)
- `customer_id` - FK → customers
- `coa_cash_code` - **FK → COA** (Akun Kas/Piutang - DEBIT)
- `coa_revenue_code` - **FK → COA** (Akun Pendapatan - KREDIT)
- `coa_cogs_code` - **FK → COA** (Akun HPP - DEBIT, untuk Barang)
- `coa_inventory_code` - **FK → COA** (Akun Persediaan - KREDIT, untuk Barang)
- `coa_tax_code` - **FK → COA** (Akun Pajak - KREDIT)
- `created_by` - User yang membuat

**Jurnal Otomatis untuk Penjualan Barang:**
```
Dr Kas/Piutang (1-1100 / 1-1200) ........... Rp 111.000
  Cr Pendapatan Penjualan (4-xxxx) ......... Rp 100.000
  Cr Utang Pajak (2-1250) .................. Rp 11.000

Dr Harga Pokok Penjualan (5-1000) .......... Rp 50.000
  Cr Persediaan Barang (1-1410) ............ Rp 50.000
```

**Jurnal Otomatis untuk Penjualan Jasa:**
```
Dr Kas/Piutang (1-1100 / 1-1200) ........... Rp 111.000
  Cr Pendapatan Jasa (4-2100) .............. Rp 100.000
  Cr Utang Pajak (2-1250) .................. Rp 11.000
```

---

### 5️⃣ **internal_usage** (Pemakaian Internal)
Tabel untuk mencatat pemakaian barang habis pakai internal.

**Kolom:**
- `id` - UUID primary key
- `usage_date` - Tanggal pemakaian
- `item_id` - FK → inventory_items
- `quantity` - Jumlah yang dipakai
- `unit_cost` - Biaya per unit
- `total_cost` - Total biaya
- `department_id` - Departemen yang menggunakan
- `purpose` - Keperluan
- `coa_expense_code` - **FK → COA** (Akun Beban - DEBIT)
- `coa_inventory_code` - **FK → COA** (Akun Persediaan - KREDIT)
- `verified_by` - User yang memverifikasi

**Jurnal Otomatis:**
```
Dr Beban Operasional (6-xxxx) .............. Rp 50.000
  Cr Persediaan Barang (1-1410) ............ Rp 50.000
```

---

### 6️⃣ **tax_transactions** (Transaksi Pajak)
Tabel untuk mencatat semua transaksi pajak.

**Kolom:**
- `id` - UUID primary key
- `transaction_date` - Tanggal transaksi
- `tax_type` - Jenis pajak (PPN Masukan, PPN Keluaran, PPh 21, PPh 23, dll)
- `amount` - Jumlah pajak
- `coa_tax_code` - **FK → COA** (Akun Pajak)
- `coa_tax_name` - Nama akun pajak
- `related_transaction_id` - ID transaksi terkait
- `related_doc_no` - Nomor dokumen terkait
- `description` - Deskripsi
- `created_by` - User yang membuat

**Contoh Mapping:**
```
PPN Masukan → 1-1720 (Piutang Pajak - Debit)
PPN Keluaran → 2-1250 (Hutang PPN - Kredit)
PPh 21 → 2-1210 (Hutang PPh 21 - Kredit)
PPh 23 → 2-1220 (Hutang PPh 23 - Kredit)
```

---

### 7️⃣ **journal_entries** (Jurnal Umum)
Tabel untuk menyimpan semua entri jurnal dari berbagai transaksi.

**Kolom:**
- `id` - UUID primary key
- `transaction_id` - ID transaksi sumber (SALE-xxx, USAGE-xxx, dll)
- `transaction_date` - Tanggal transaksi
- `account_code` - **FK → COA** (Kode akun)
- `account_name` - Nama akun
- `debit` - Jumlah debit (0 jika kredit)
- `credit` - Jumlah kredit (0 jika debit)
- `description` - Deskripsi entri
- `created_by` - User yang membuat

**Struktur:**
- Setiap baris = 1 entri jurnal (debit ATAU kredit)
- Setiap transaksi menghasilkan minimal 2 baris (1 debit + 1 kredit)

**Contoh:**
```
SALE-12345678 | 2024-01-15 | 1-1100 | Kas | 111000 | 0 | Penjualan Jasa
SALE-12345678 | 2024-01-15 | 4-2100 | Pendapatan Jasa | 0 | 100000 | Pendapatan Jasa
SALE-12345678 | 2024-01-15 | 2-1250 | Utang Pajak | 0 | 11000 | Pajak 11%
```

---

## 🔄 ALUR INTEGRASI

### **Penjualan Barang:**
1. User input transaksi di `SalesForm`
2. Validasi stok dengan edge function `check-stock-balance`
3. Insert ke `sales_transactions` dengan mapping COA
4. Update stok dengan edge function `update-stock-after-transaction`
5. **Otomatis buat jurnal:**
   - Dr Kas/Piutang
   - Cr Pendapatan
   - Cr Pajak
   - Dr HPP
   - Cr Persediaan
6. Insert ke `journal_entries`

### **Penjualan Jasa:**
1. User input transaksi di `SalesForm`
2. Ambil harga dari `service_items`
3. Insert ke `sales_transactions` dengan mapping COA
4. **Otomatis buat jurnal:**
   - Dr Kas/Piutang
   - Cr Pendapatan Jasa
   - Cr Pajak
5. Insert ke `journal_entries`

### **Pemakaian Internal:**
1. User input di `InternalUsageForm`
2. Validasi stok
3. Insert ke `internal_usage` dengan mapping COA
4. Update stok
5. **Otomatis buat jurnal:**
   - Dr Beban Operasional
   - Cr Persediaan
6. Insert ke `journal_entries`

---

## 📱 KOMPONEN UI

### 1. **COAMappingManager** (`/coa-mapping`)
Komponen untuk mengelola mapping COA ke setiap item barang/jasa.

**Fitur:**
- Tab untuk Service Items dan Inventory Items
- Dropdown untuk memilih akun COA yang sesuai
- Update mapping secara real-time
- Filter akun berdasarkan tipe (Revenue, Expense, Inventory, COGS)

### 2. **IntegratedFinancialReport** (`/financial-report`)
Komponen untuk menampilkan laporan keuangan terintegrasi.

**Fitur:**
- **Jurnal Umum:** Semua entri jurnal dengan detail debit/kredit
- **Buku Besar:** Saldo per akun dengan total debit/kredit
- **Neraca Saldo:** Trial balance dengan total debit = total kredit
- Filter berdasarkan tanggal
- Export ke CSV
- Real-time calculation

### 3. **SalesForm** (Updated)
Form penjualan dengan integrasi COA lengkap.

**Fitur Baru:**
- Otomatis mapping COA dari `service_items` atau `inventory_items`
- Simpan semua kode COA terkait di `sales_transactions`
- Buat jurnal otomatis dengan mapping yang benar
- Notifikasi toast saat jurnal dibuat

---

## 🎨 DESAIN UI

**Styling Guidelines:**
- Grid 2 kolom dengan `gap-3` dan `padding-4`
- Card dengan `rounded-2xl shadow-md`
- Field readonly: `bg-gray-100`
- Alert merah untuk validasi
- Tombol [Simpan]: biru, [Batal]: abu
- Toast notification di kanan atas

---

## 📊 LAPORAN YANG TERSEDIA

### 1. **Jurnal Umum**
Menampilkan semua entri jurnal dengan:
- Tanggal transaksi
- ID transaksi
- Kode dan nama akun
- Debit/Kredit
- Deskripsi
- Total debit = Total kredit

### 2. **Buku Besar**
Menampilkan saldo per akun dengan:
- Kode dan nama akun
- Tipe akun
- Total debit
- Total kredit
- Saldo akhir

### 3. **Neraca Saldo**
Menampilkan trial balance dengan:
- Kode dan nama akun
- Saldo debit
- Saldo kredit
- Total debit = Total kredit (balanced)

---

## 🔐 KEAMANAN & AUDIT

**Audit Trail:**
- Setiap transaksi menyimpan `created_by` (email user)
- Setiap jurnal menyimpan `created_by`
- Timestamp otomatis (`created_at`, `updated_at`)

**Validasi:**
- Stok tidak boleh negatif
- Jurnal harus balance (debit = kredit)
- COA mapping wajib diisi

---

## 🚀 CARA PENGGUNAAN

### **Setup Awal:**
1. Pastikan COA sudah lengkap di `/coa-management`
2. Mapping COA untuk setiap item di `/coa-mapping`
3. Mulai input transaksi di `/sales` atau `/internal-usage`

### **Monitoring:**
1. Cek jurnal di `/financial-report` → Tab "Jurnal Umum"
2. Cek saldo akun di `/financial-report` → Tab "Buku Besar"
3. Cek balance di `/financial-report` → Tab "Neraca Saldo"

### **Export:**
1. Pilih range tanggal
2. Klik tombol "Export CSV"
3. File akan terdownload otomatis

---

## 📝 CATATAN PENTING

1. **Setiap transaksi HARUS memiliki mapping COA yang benar**
2. **Jurnal dibuat otomatis, tidak perlu input manual**
3. **Total debit HARUS = Total kredit di setiap transaksi**
4. **Stok otomatis terupdate saat transaksi penjualan/pemakaian**
5. **Semua laporan real-time dari database**

---

## 🎯 BENEFIT SISTEM INI

✅ **Otomatis:** Jurnal dibuat otomatis dari setiap transaksi
✅ **Terintegrasi:** Semua transaksi terhubung dengan COA
✅ **Real-time:** Laporan selalu update
✅ **Audit Trail:** Semua transaksi tercatat dengan user dan timestamp
✅ **Akurat:** Tidak ada human error dalam pembuatan jurnal
✅ **Efisien:** Hemat waktu, tidak perlu input jurnal manual

---

**Sistem ini siap digunakan untuk mengelola akuntansi perusahaan secara terintegrasi! 🚀**
