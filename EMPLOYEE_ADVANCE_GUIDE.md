# 📘 Panduan Sistem Uang Muka Karyawan / Kas Bon

## 🎯 Tujuan Sistem

Sistem ini dirancang untuk mengelola **Uang Muka Karyawan (Kas Bon)** dengan logika akuntansi yang benar:

1. ✅ Saat uang diberikan → dicatat sebagai **Aset (Piutang)**, bukan langsung beban
2. ✅ Saat karyawan serahkan struk → baru dicatat sebagai **Beban**
3. ✅ Saat karyawan kembalikan sisa → dicatat sebagai **Penerimaan Kas**
4. ✅ Semua transaksi otomatis membuat **Jurnal** ke General Ledger

---

## 📊 Alur Kerja (Workflow)

### **STEP 1: Berikan Uang Muka ke Karyawan**

**Contoh:** Finance memberikan Rp 1.000.000 kepada Febri untuk keperluan operasional.

**Jurnal Otomatis:**
```
Debit:  Uang Muka Karyawan - Febri (1-1009-001)  Rp 1.000.000
Credit: Kas (1-1001)                              Rp 1.000.000
```

**Penjelasan:**
- Uang yang diberikan **TIDAK langsung masuk ke beban**
- Dicatat sebagai **Aset** (piutang kepada karyawan)
- Setiap karyawan punya akun COA unik (contoh: 1-1009-001 untuk Febri)

---

### **STEP 2: Karyawan Serahkan Struk Belanja**

**Contoh:** Febri belanja ATK Rp 500.000 dan serahkan struk.

**Jurnal Otomatis:**
```
Debit:  Beban Perlengkapan Kantor (6-2005)       Rp 500.000
Credit: Uang Muka Karyawan - Febri (1-1009-001)  Rp 500.000
```

**Penjelasan:**
- Uang muka **dikurangi** sebesar struk yang diserahkan
- Dicatat sebagai **Beban** sesuai kategori (ATK, Transport, dll)
- Sisa saldo uang muka: Rp 1.000.000 - Rp 500.000 = **Rp 500.000**

---

### **STEP 3: Karyawan Kembalikan Sisa Uang**

**Contoh:** Febri kembalikan sisa uang Rp 500.000.

**Jurnal Otomatis:**
```
Debit:  Kas (1-1001)                              Rp 500.000
Credit: Uang Muka Karyawan - Febri (1-1009-001)  Rp 500.000
```

**Penjelasan:**
- Sisa uang dikembalikan ke kas perusahaan
- Akun uang muka Febri menjadi **Rp 0** (selesai)
- Status berubah menjadi **"Settled"**

---

## 🗂️ Struktur Database

### **1. Table: employee_advances**
Menyimpan data uang muka yang diberikan.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID | Primary key |
| employee_id | UUID | ID karyawan (FK ke users) |
| employee_name | TEXT | Nama karyawan |
| advance_number | TEXT | Nomor uang muka (auto: ADV-202501-0001) |
| advance_date | DATE | Tanggal pemberian |
| amount | NUMERIC | Jumlah uang muka |
| remaining_balance | NUMERIC | Sisa saldo yang belum diselesaikan |
| coa_account_code | TEXT | Kode akun COA (auto: 1-1009-001) |
| status | TEXT | pending / partially_settled / settled |
| notes | TEXT | Catatan |

### **2. Table: employee_advance_settlements**
Menyimpan data struk yang diserahkan karyawan.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID | Primary key |
| advance_id | UUID | FK ke employee_advances |
| settlement_date | DATE | Tanggal penyelesaian |
| merchant | TEXT | Nama toko/merchant |
| category | TEXT | Kategori beban |
| expense_account_code | TEXT | Kode akun beban (6-xxxx) |
| amount | NUMERIC | Jumlah sebelum PPN |
| ppn | NUMERIC | PPN 10% |
| total | NUMERIC | Total (amount + ppn) |
| description | TEXT | Keterangan |
| receipt_number | TEXT | Nomor struk |
| file_url | TEXT | URL file struk (opsional) |
| journal_entry_id | UUID | ID jurnal yang dibuat |

### **3. Table: employee_advance_returns**
Menyimpan data pengembalian sisa uang.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID | Primary key |
| advance_id | UUID | FK ke employee_advances |
| return_date | DATE | Tanggal pengembalian |
| amount | NUMERIC | Jumlah dikembalikan |
| payment_method | TEXT | Cash / Transfer |
| notes | TEXT | Catatan |
| journal_entry_id | UUID | ID jurnal yang dibuat |

---

## 🔧 Fitur Otomatis

### **1. Auto-Generate Nomor Uang Muka**
Format: `ADV-YYYYMM-XXXX`

Contoh:
- ADV-202501-0001
- ADV-202501-0002
- ADV-202502-0001 (bulan baru, reset nomor)

### **2. Auto-Create COA Account per Karyawan**
Setiap karyawan otomatis dapat akun COA unik:

| Karyawan | Kode COA | Nama Akun |
|----------|----------|-----------|
| Febri | 1-1009-001 | Uang Muka Karyawan - Febri |
| Budi | 1-1009-002 | Uang Muka Karyawan - Budi |
| Siti | 1-1009-003 | Uang Muka Karyawan - Siti |

**Parent Account:** 1-1009 (Uang Muka Karyawan)

### **3. Auto-Update Saldo**
Saldo otomatis dihitung:
```
Sisa Saldo = Jumlah Awal - Total Diselesaikan - Total Dikembalikan
```

### **4. Auto-Update Status**
- **pending**: Belum ada penyelesaian
- **partially_settled**: Sebagian sudah diselesaikan
- **settled**: Semua sudah diselesaikan (saldo = 0)

---

## 🖥️ Cara Menggunakan

### **Akses Halaman**
```
URL: /employee-advance
Menu: Navigation → "Uang Muka Karyawan"
```

### **Tab 1: Buat Uang Muka**
1. Pilih karyawan dari dropdown
2. Masukkan jumlah uang muka
3. Pilih tanggal
4. Tambahkan catatan (opsional)
5. Klik **"Berikan Uang Muka"**

✅ Jurnal otomatis dibuat
✅ Akun COA karyawan otomatis dibuat (jika belum ada)

### **Tab 2: Serahkan Struk**
1. Pilih uang muka yang akan diselesaikan
2. Masukkan data struk:
   - Merchant (nama toko)
   - Nomor struk
   - Kategori beban
   - Akun beban (contoh: 6-2005 untuk ATK)
   - Jumlah (PPN otomatis dihitung 10%)
3. Klik **"Catat Penyelesaian"**

✅ Jurnal otomatis dibuat
✅ Saldo uang muka otomatis berkurang

### **Tab 3: Kembalikan Sisa**
1. Pilih uang muka
2. Masukkan jumlah yang dikembalikan
3. Pilih metode (Cash/Transfer)
4. Klik **"Catat Pengembalian"**

✅ Jurnal otomatis dibuat
✅ Saldo uang muka otomatis berkurang

### **Tab 4: Daftar Uang Muka**
Lihat semua uang muka dengan:
- Nomor uang muka
- Nama karyawan
- Jumlah awal
- Sisa saldo
- Status
- Kode akun COA

---

## 📝 Contoh Kasus Lengkap

### **Kasus: Febri Dapat Uang Muka Rp 2.000.000**

#### **1. Pemberian Uang Muka (1 Januari)**
```
Input:
- Karyawan: Febri
- Jumlah: Rp 2.000.000
- Tanggal: 2025-01-01

Jurnal:
Debit:  Uang Muka Karyawan - Febri (1-1009-001)  Rp 2.000.000
Credit: Kas (1-1001)                              Rp 2.000.000

Status: pending
Sisa Saldo: Rp 2.000.000
```

#### **2. Febri Belanja ATK Rp 500.000 (5 Januari)**
```
Input:
- Merchant: Toko ATK Jaya
- Kategori: Beban Perlengkapan Kantor
- Akun: 6-2005
- Jumlah: Rp 500.000
- PPN: Rp 50.000 (auto)
- Total: Rp 550.000

Jurnal:
Debit:  Beban Perlengkapan Kantor (6-2005)       Rp 550.000
Credit: Uang Muka Karyawan - Febri (1-1009-001)  Rp 550.000

Status: partially_settled
Sisa Saldo: Rp 1.450.000
```

#### **3. Febri Belanja Bensin Rp 300.000 (10 Januari)**
```
Input:
- Merchant: SPBU Pertamina
- Kategori: Beban Operasional
- Akun: 6-2011
- Jumlah: Rp 300.000
- PPN: Rp 30.000 (auto)
- Total: Rp 330.000

Jurnal:
Debit:  Beban Lain-lain (6-2011)                 Rp 330.000
Credit: Uang Muka Karyawan - Febri (1-1009-001)  Rp 330.000

Status: partially_settled
Sisa Saldo: Rp 1.120.000
```

#### **4. Febri Kembalikan Sisa Rp 1.120.000 (15 Januari)**
```
Input:
- Jumlah: Rp 1.120.000
- Metode: Cash

Jurnal:
Debit:  Kas (1-1001)                              Rp 1.120.000
Credit: Uang Muka Karyawan - Febri (1-1009-001)  Rp 1.120.000

Status: settled
Sisa Saldo: Rp 0
```

---

## 🔐 Role & Permission

| Role | Buat Uang Muka | Serahkan Struk | Kembalikan Sisa | Lihat Daftar |
|------|----------------|----------------|-----------------|--------------|
| super_admin | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ |
| finance | ✅ | ✅ | ✅ | ✅ |
| accounting_manager | ✅ | ✅ | ✅ | ✅ |
| accounting_staff | ✅ | ✅ | ✅ | ✅ |
| Karyawan (owner) | ❌ | ✅ | ✅ | ✅ (hanya miliknya) |

---

## 🚀 Teknologi

- **Database:** PostgreSQL (Supabase)
- **Edge Function:** Deno (untuk create jurnal)
- **Frontend:** React + TypeScript
- **UI:** shadcn/ui + Tailwind CSS

---

## 📞 Troubleshooting

### **Error: "expense_account_code is required"**
**Solusi:** Pastikan Anda mengisi akun beban saat serahkan struk (contoh: 6-2005)

### **Error: "Unauthorized"**
**Solusi:** Pastikan Anda sudah login dan punya role yang sesuai

### **Saldo tidak update**
**Solusi:** Trigger otomatis sudah dibuat. Jika masih error, cek console browser (F12)

### **Jurnal tidak terbuat**
**Solusi:** Cek edge function sudah deployed dengan benar

---

## ✅ Checklist Setup

- [x] Migration 20240388 (tables & triggers)
- [x] Migration 20240389 (dynamic COA function)
- [x] Edge function deployed (employee-advance-journal)
- [x] Component created (EmployeeAdvanceForm.tsx)
- [x] Route added (/employee-advance)
- [x] Navigation link added
- [x] RLS policies enabled

---

## 🎉 Selesai!

Sistem Uang Muka Karyawan sudah siap digunakan dengan logika akuntansi yang benar!

**Keuntungan:**
✅ Uang muka tidak langsung jadi beban
✅ Tracking saldo per karyawan
✅ Jurnal otomatis
✅ Audit trail lengkap
✅ Sesuai standar akuntansi

---

**Dibuat dengan ❤️ untuk sistem akuntansi yang lebih baik**
