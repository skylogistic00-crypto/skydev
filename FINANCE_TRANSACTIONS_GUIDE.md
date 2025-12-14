# Finance Transactions Feature - User Guide

## ✅ Status Koneksi
- **Supabase**: ✅ Terhubung
- **Storage Bucket**: ✅ `finance-documents` (siap digunakan)
- **Database Tables**: ✅ Sudah dibuat via migration
- **OCR Edge Function**: ✅ `vision-google-ocr` (siap dipanggil)

---

## 📍 Lokasi Fitur

### 1. **Halaman List Transaksi**
- **URL**: `/finance/transactions`
- **Navigasi**: Sidebar → Finance Transactions
- **Fitur**:
  - Tabel daftar semua transaksi
  - Search by merchant/employee
  - Filter by status & category
  - Tombol "New Transaction" (biru, kanan atas)

### 2. **Halaman Form Input (Upload & Auto-Fill)**
- **URL**: `/finance/transactions/new`
- **Akses**: Klik tombol "New Transaction" dari list
- **Layout**: 2 kolom (kiri: Upload, kanan: Form)

---

## 🖼️ Tombol Upload & Auto-Fill

### Lokasi di Halaman:
```
┌─────────────────────────────────────────────────────────────┐
│  ← New Finance Transaction                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │  Upload Receipt      │  │ Transaction Details  │         │
│  │  ─────────────────   │  │ ─────────────────    │         │
│  │                      │  │                      │         │
│  │  ┌────────────────┐  │  │ Employee Name: [___] │         │
│  │  │  📤 Click to   │  │  │ Merchant: [_______]  │         │
│  │  │  upload image  │  │  │ Category: [Select]   │         │
│  │  │                │  │  │ Date: [__/__/____]   │         │
│  │  └────────────────┘  │  │                      │         │
│  │                      │  │ Amount: [_______]    │         │
│  │ [Process with OCR]   │  │ PPN (10%): [_____]   │         │
│  │                      │  │ Total: [_________]   │         │
│  │ Extracted Text:      │  │                      │         │
│  │ ┌────────────────┐   │  │                      │         │
│  │ │ (multiline)    │   │  │                      │         │
│  │ │ (text here)    │   │  │                      │         │
│  │ └────────────────┘   │  │                      │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Breakdown Items                                      │   │
│  │ ─────────────────────────────────────────────────    │   │
│  │ [Add Item]                                           │   │
│  │                                                      │   │
│  │ Description | Qty | Price | Subtotal | [Delete]    │   │
│  │ ─────────────────────────────────────────────────    │   │
│  │ (items akan muncul di sini)                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│                              [Cancel] [Save Transaction]    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Cara Menggunakan

### Step 1: Buka Halaman Form
1. Klik **"Finance Transactions"** di sidebar
2. Klik tombol **"New Transaction"** (biru, kanan atas)

### Step 2: Upload Gambar Receipt
1. **Klik area upload** (kotak dengan icon 📤)
2. **Pilih file gambar** dari komputer (JPG, PNG, dll)
3. **Preview gambar** akan muncul di area upload

### Step 3: Proses OCR & Auto-Fill
1. Klik tombol **"Process with OCR"** (biru)
2. **Tunggu proses** (loading spinner akan muncul)
3. **Extracted Text** akan muncul di text area
4. **Form fields akan auto-fill** dengan data:
   - ✅ Merchant name
   - ✅ Date (format: YYYY-MM-DD)
   - ✅ Category (auto-detect)
   - ✅ Amount
   - ✅ PPN (10% auto-calculated)
   - ✅ Total (Amount + PPN)
   - ✅ Breakdown items (jika ada)

### Step 4: Review & Edit
- **Periksa** data yang sudah di-fill
- **Edit** jika ada yang salah
- **Tambah/hapus** breakdown items jika perlu

### Step 5: Simpan Transaksi
1. Klik tombol **"Save Transaction"** (biru, kanan bawah)
2. **File akan di-upload** ke storage `finance-documents`
3. **Data akan disimpan** ke database
4. **Redirect** ke halaman list

---

## 📊 Data yang Disimpan

### Tabel: `finance_transactions`
```
id              | UUID (auto)
employee_name   | Text (dari form)
merchant        | Text (dari OCR)
category        | Text (auto-detect)
date_trans      | Date (dari OCR)
description     | Text (opsional)
amount          | Numeric (dari OCR)
ppn             | Numeric (10% auto)
total           | Numeric (amount + ppn)
file_url        | Text (URL storage)
status          | Text (default: "pending")
created_at      | Timestamp (auto)
created_by      | UUID (user ID)
```

### Tabel: `finance_transaction_breakdown`
```
id              | UUID (auto)
transaction_id  | UUID (FK)
qty             | Integer
price           | Numeric
subtotal        | Numeric (qty × price)
description     | Text (opsional)
created_at      | Timestamp (auto)
```

---

## 🔍 Fitur OCR Parser

### Deteksi Otomatis:

#### 1. **Merchant Name**
- Mencari 2+ kata berturut-turut dengan huruf kapital
- Contoh: "STARBUCKS COFFEE", "PT MITRA JAYA"

#### 2. **Date**
- Format yang didukung:
  - `dd/mm/yyyy` → `2024-11-30`
  - `dd-mm-yyyy` → `2024-11-30`
  - `dd.mm.yyyy` → `2024-11-30`

#### 3. **Category** (Auto-detect)
- **Travel**: TIKET, PESAWAT, HOTEL, TAXI, GRAB
- **Food**: RESTO, CAFE, MAKAN, WARUNG
- **Office Supplies**: ATK, KERTAS, PRINTER
- **Entertainment**: BIOSKOP, GAME, KARAOKE
- **Utilities**: LISTRIK, AIR, INTERNET
- **Transportation**: BENSIN, PARKIR, TOL
- **Medical**: APOTEK, OBAT, RUMAH SAKIT
- **Shopping**: SUPERMARKET, MALL, INDOMARET

#### 4. **Amount & PPN**
- Mencari pola: `TOTAL: Rp 100.000`
- PPN otomatis: 10% dari amount

#### 5. **Breakdown Items**
- Pola: `qty × price = subtotal`
- Contoh: `2 × 50000 = 100000`

---

## 🔐 Approval Workflow

### Halaman Detail Transaksi
- **URL**: `/finance/transactions/{id}`
- **Akses**: Klik row di tabel list

### Approval Levels:
1. **Finance** (Level 1)
2. **Manager** (Level 2)
3. **Accounting** (Level 3 - Final)

### Tombol Approval:
- ✅ **Approve** (hijau) - Lanjut ke level berikutnya
- ❌ **Reject** (merah) - Tolak transaksi

### Saat Level Terakhir Approved:
- Status berubah menjadi "approved"
- RPC `create_journal_from_payload` dipanggil
- Journal entry otomatis dibuat

---

## 📁 File Structure

```
src/
├── components/
│   ├── FinanceTransactionsPage.tsx      ← Form input + upload
│   ├── FinanceTransactionsList.tsx      ← List view
│   └── FinanceTransactionDetail.tsx     ← Detail + approval
├── utils/
│   └── FinanceOCRParser.ts              ← Parser functions
└── lib/
    └── supabase.ts                      ← Supabase client

supabase/
└── migrations/
    └── 20240354_create_finance_transactions_tables.sql
```

---

## ⚙️ Environment Variables (Sudah Set)

```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

---

## 🐛 Troubleshooting

### OCR tidak bekerja?
- ✅ Pastikan edge function `vision-google-ocr` sudah deployed
- ✅ Periksa console browser (F12) untuk error message
- ✅ Coba upload gambar dengan kualitas lebih baik

### Data tidak tersimpan?
- ✅ Pastikan migration sudah dijalankan
- ✅ Periksa Supabase dashboard → Tables
- ✅ Pastikan user sudah login

### File tidak ter-upload?
- ✅ Pastikan storage bucket `finance-documents` sudah ada
- ✅ Periksa ukuran file (max 10MB)
- ✅ Coba refresh halaman

---

## 📞 Support

Jika ada masalah, cek:
1. Browser console (F12)
2. Supabase dashboard → Logs
3. Network tab → lihat request/response
