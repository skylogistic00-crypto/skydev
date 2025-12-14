# 📊 LOGIKA JURNAL OTOMATIS - SISTEM AKUNTANSI TERINTEGRASI

## 🎯 OVERVIEW

Setiap transaksi di sistem ini **otomatis membuat jurnal** berdasarkan mapping COA yang tersimpan di tabel master. Dokumen ini menjelaskan logika lengkap untuk setiap jenis transaksi.

---

## 1️⃣ PENJUALAN BARANG

### **Form:** `SalesForm` (Type: Barang)

### **Sumber Data COA:**
| Akun | Sumber | Contoh |
|------|--------|--------|
| Kas/Piutang | Hardcoded | 1-1100 (Kas) / 1-1200 (Piutang) |
| Pendapatan | **User Input** | 4-1100 (Pendapatan Penjualan Barang) |
| HPP | `inventory_items.coa_cogs_code` | 5-1500 (Biaya Bahan Kemasan) |
| Persediaan | `inventory_items.coa_inventory_code` | 1-1410 (Persediaan Bahan Kemasan) |
| PPN Keluaran | Hardcoded | 2-1250 (Hutang PPN) |

### **Jurnal yang Dibuat:**
```
TRANSAKSI: Jual Kardus 10 pcs @ Rp 10.000 + PPN 11%
COGS: Rp 5.000/pcs

Dr Kas/Piutang (1-1100/1-1200) ............. Rp 111.000
  Cr Pendapatan Penjualan (4-1100) ......... Rp 100.000
  Cr Hutang PPN (2-1250) ................... Rp 11.000

Dr Harga Pokok Penjualan (5-1500) .......... Rp 50.000
  Cr Persediaan Bahan Kemasan (1-1410) ..... Rp 50.000
```

### **Kode Implementasi:**
```typescript
// 1️⃣ Dr Kas/Piutang
journalEntries.push({
  account_code: payment_method === "Piutang" ? "1-1200" : "1-1100",
  account_name: payment_method === "Piutang" ? "Piutang Usaha" : "Kas",
  debit: total_amount,
  credit: 0,
});

// 2️⃣ Cr Pendapatan (user pilih)
journalEntries.push({
  account_code: formData.coa_account_code, // User input
  account_name: formData.coa_account_name,
  debit: 0,
  credit: subtotal,
});

// 3️⃣ Cr PPN Keluaran
journalEntries.push({
  account_code: "2-1250",
  account_name: "Hutang PPN",
  debit: 0,
  credit: tax_amount,
});

// 4️⃣ Dr HPP (from inventory_items)
journalEntries.push({
  account_code: formData.coa_cogs_code, // From inventory_items
  account_name: "Harga Pokok Penjualan",
  debit: quantity * cost_per_unit,
  credit: 0,
});

// 5️⃣ Cr Persediaan (from inventory_items)
journalEntries.push({
  account_code: formData.coa_inventory_code, // From inventory_items
  account_name: "Persediaan Barang",
  debit: 0,
  credit: quantity * cost_per_unit,
});
```

---

## 2️⃣ PENJUALAN JASA

### **Form:** `SalesForm` (Type: Jasa)

### **Sumber Data COA:**
| Akun | Sumber | Contoh |
|------|--------|--------|
| Kas/Piutang | Hardcoded | 1-1100 (Kas) / 1-1200 (Piutang) |
| Pendapatan | `service_items.coa_revenue_code` | 4-2100 (Pendapatan Jasa Storage) |
| PPN Keluaran | Hardcoded | 2-1250 (Hutang PPN) |

### **Jurnal yang Dibuat:**
```
TRANSAKSI: Jasa Konsultasi IT @ Rp 500.000 + PPN 11%

Dr Kas/Piutang (1-1100/1-1200) ............. Rp 555.000
  Cr Pendapatan Jasa (4-2100) .............. Rp 500.000
  Cr Hutang PPN (2-1250) ................... Rp 55.000
```

### **Kode Implementasi:**
```typescript
// 1️⃣ Dr Kas/Piutang
journalEntries.push({
  account_code: payment_method === "Piutang" ? "1-1200" : "1-1100",
  account_name: payment_method === "Piutang" ? "Piutang Usaha" : "Kas",
  debit: total_amount,
  credit: 0,
});

// 2️⃣ Cr Pendapatan Jasa (from service_items)
journalEntries.push({
  account_code: formData.coa_account_code, // From service_items.coa_revenue_code
  account_name: formData.coa_account_name,
  debit: 0,
  credit: subtotal,
});

// 3️⃣ Cr PPN Keluaran
journalEntries.push({
  account_code: "2-1250",
  account_name: "Hutang PPN",
  debit: 0,
  credit: tax_amount,
});
```

---

## 3️⃣ PEMBELIAN BARANG

### **Form:** `PurchaseForm` (Type: Barang) - **BELUM ADA**

### **Sumber Data COA:**
| Akun | Sumber | Contoh |
|------|--------|--------|
| Persediaan | `inventory_items.coa_inventory_code` | 1-1410 (Persediaan Bahan Kemasan) |
| PPN Masukan | Hardcoded | 1-1720 (Piutang Pajak) |
| Kas/Bank | Hardcoded | 1-1100 (Kas) |

### **Jurnal yang Dibuat:**
```
TRANSAKSI: Beli Kardus 100 pcs @ Rp 5.000 + PPN 11%

Dr Persediaan Bahan Kemasan (1-1410) ....... Rp 500.000
Dr Piutang Pajak (1-1720) .................. Rp 55.000
  Cr Kas/Bank (1-1100) .................... Rp 555.000
```

### **Kode Implementasi:**
```typescript
// 1️⃣ Dr Persediaan (from inventory_items)
journalEntries.push({
  account_code: formData.coa_inventory_code, // From inventory_items
  account_name: "Persediaan Barang",
  debit: subtotal,
  credit: 0,
});

// 2️⃣ Dr PPN Masukan
journalEntries.push({
  account_code: "1-1720",
  account_name: "Piutang Pajak",
  debit: tax_amount,
  credit: 0,
});

// 3️⃣ Cr Kas/Bank
journalEntries.push({
  account_code: "1-1100",
  account_name: "Kas",
  debit: 0,
  credit: total_amount,
});
```

---

## 4️⃣ PEMBELIAN JASA

### **Form:** `PurchaseForm` (Type: Jasa) - **BELUM ADA**

### **Sumber Data COA:**
| Akun | Sumber | Contoh |
|------|--------|--------|
| Biaya Jasa | `service_items.coa_expense_code` | 6-5400 (Konsultan IT) |
| PPN Masukan | Hardcoded | 1-1720 (Piutang Pajak) |
| Kas/Bank | Hardcoded | 1-1100 (Kas) |

### **Jurnal yang Dibuat:**
```
TRANSAKSI: Bayar Konsultan IT @ Rp 1.000.000 + PPN 11%

Dr Biaya Konsultan IT (6-5400) ............. Rp 1.000.000
Dr Piutang Pajak (1-1720) .................. Rp 110.000
  Cr Kas/Bank (1-1100) .................... Rp 1.110.000
```

### **Kode Implementasi:**
```typescript
// 1️⃣ Dr Biaya Jasa (from service_items)
journalEntries.push({
  account_code: formData.coa_expense_code, // From service_items
  account_name: "Biaya Jasa",
  debit: subtotal,
  credit: 0,
});

// 2️⃣ Dr PPN Masukan
journalEntries.push({
  account_code: "1-1720",
  account_name: "Piutang Pajak",
  debit: tax_amount,
  credit: 0,
});

// 3️⃣ Cr Kas/Bank
journalEntries.push({
  account_code: "1-1100",
  account_name: "Kas",
  debit: 0,
  credit: total_amount,
});
```

---

## 5️⃣ PEMAKAIAN INTERNAL

### **Form:** `InternalUsageForm`

### **Sumber Data COA:**
| Akun | Sumber | Contoh |
|------|--------|--------|
| Beban Operasional | **User Input** | 6-6100 (Biaya Listrik) |
| Persediaan | `inventory_items.coa_inventory_code` | 1-1410 (Persediaan Bahan Kemasan) |

### **Jurnal yang Dibuat:**
```
TRANSAKSI: Pakai Kardus 5 pcs untuk Departemen Warehouse

Dr Biaya Operasional (6-6100) .............. Rp 25.000
  Cr Persediaan Bahan Kemasan (1-1410) ..... Rp 25.000
```

### **Kode Implementasi:**
```typescript
// 1️⃣ Dr Beban Operasional (user pilih)
journalEntries.push({
  account_code: formData.coa_account_code, // User input
  account_name: formData.coa_account_name,
  debit: total_cost,
  credit: 0,
});

// 2️⃣ Cr Persediaan (from inventory_items)
journalEntries.push({
  account_code: formData.coa_inventory_code, // From inventory_items
  account_name: "Persediaan Barang",
  debit: 0,
  credit: total_cost,
});
```

---

## 6️⃣ PENGELUARAN OPERASIONAL

### **Form:** `ExpenseForm` - **DIHAPUS**

### **Sumber Data COA:**
| Akun | Sumber | Contoh |
|------|--------|--------|
| Biaya Operasional | **User Input** | 6-6200 (Biaya Telepon) |
| PPN Masukan | Hardcoded (optional) | 1-1720 (Piutang Pajak) |
| Kas/Bank | Hardcoded | 1-1100 (Kas) |

### **Jurnal yang Dibuat:**
```
TRANSAKSI: Bayar Listrik Rp 1.000.000 + PPN 11%

Dr Biaya Listrik (6-6100) .................. Rp 1.000.000
Dr Piutang Pajak (1-1720) .................. Rp 110.000
  Cr Kas/Bank (1-1100) .................... Rp 1.110.000
```

### **Kode Implementasi:**
```typescript
// 1️⃣ Dr Biaya Operasional (user pilih)
journalEntries.push({
  account_code: formData.coa_account_code, // User input
  account_name: formData.coa_account_name,
  debit: subtotal,
  credit: 0,
});

// 2️⃣ Dr PPN Masukan (if any)
if (tax_amount > 0) {
  journalEntries.push({
    account_code: "1-1720",
    account_name: "Piutang Pajak",
    debit: tax_amount,
    credit: 0,
  });
}

// 3️⃣ Cr Kas/Bank
journalEntries.push({
  account_code: "1-1100",
  account_name: "Kas",
  debit: 0,
  credit: total_amount,
});
```

---

## 7️⃣ PEMBAYARAN PAJAK

### **Form:** `TaxPaymentForm` - **BELUM ADA**

### **Sumber Data COA:**
| Akun | Sumber | Contoh |
|------|--------|--------|
| Kewajiban Pajak | `tax_transactions.coa_tax_code` | 2-1250 (Hutang PPN) |
| Kas/Bank | Hardcoded | 1-1100 (Kas) |

### **Jurnal yang Dibuat:**
```
TRANSAKSI: Bayar PPN Keluaran Rp 500.000

Dr Hutang PPN (2-1250) ..................... Rp 500.000
  Cr Kas/Bank (1-1100) .................... Rp 500.000
```

### **Kode Implementasi:**
```typescript
// 1️⃣ Dr Kewajiban Pajak (from tax_transactions)
journalEntries.push({
  account_code: formData.coa_tax_code, // From tax_transactions
  account_name: formData.coa_tax_name,
  debit: amount,
  credit: 0,
});

// 2️⃣ Cr Kas/Bank
journalEntries.push({
  account_code: "1-1100",
  account_name: "Kas",
  debit: 0,
  credit: amount,
});
```

---

## 📊 TABEL REFERENSI COA HARDCODED

### **Akun Kas/Bank (Asset)**
| Kode | Nama | Digunakan Untuk |
|------|------|-----------------|
| 1-1100 | Kas | Pembayaran Tunai |
| 1-1110 | Bank BCA | Pembayaran Transfer |
| 1-1200 | Piutang Usaha | Pembayaran Piutang |

### **Akun Pajak**
| Kode | Nama | Digunakan Untuk |
|------|------|-----------------|
| 1-1720 | Piutang Pajak (PPN Masukan) | Pembelian dengan PPN |
| 2-1250 | Hutang PPN (PPN Keluaran) | Penjualan dengan PPN |
| 2-1210 | Hutang PPh 21 | Gaji Karyawan |
| 2-1220 | Hutang PPh 23 | Jasa Profesional |

---

## ✅ STATUS IMPLEMENTASI

| Transaksi | Form | Status | Jurnal Otomatis |
|-----------|------|--------|-----------------|
| Penjualan Barang | `SalesForm` | ✅ Done | ✅ 5 entri |
| Penjualan Jasa | `SalesForm` | ✅ Done | ✅ 3 entri |
| Pembelian Barang | `PurchaseForm` | ❌ Belum | ⏳ 3 entri |
| Pembelian Jasa | `PurchaseForm` | ❌ Belum | ⏳ 3 entri |
| Pemakaian Internal | `InternalUsageForm` | ✅ Done | ✅ 2 entri |
| Pengeluaran Operasional | `ExpenseForm` | ❌ Dihapus | ⏳ 3 entri |
| Pembayaran Pajak | `TaxPaymentForm` | ❌ Belum | ⏳ 2 entri |

---

## 🔍 VALIDASI JURNAL

Setiap jurnal HARUS memenuhi prinsip **Double-Entry Bookkeeping**:

### **Aturan:**
1. **Total Debit = Total Kredit** untuk setiap transaksi
2. Setiap transaksi minimal 2 entri (1 debit + 1 kredit)
3. Akun COA harus valid dan aktif
4. Tanggal transaksi tidak boleh di masa depan

### **Contoh Validasi:**
```typescript
const totalDebit = journalEntries.reduce((sum, entry) => sum + entry.debit, 0);
const totalCredit = journalEntries.reduce((sum, entry) => sum + entry.credit, 0);

if (totalDebit !== totalCredit) {
  throw new Error("Jurnal tidak balance! Total Debit harus = Total Kredit");
}
```

---

## 🚀 NEXT STEPS

1. ✅ **Update SalesForm** - Ambil COA dari tabel master
2. ⏳ **Create PurchaseForm** - Form pembelian barang/jasa
3. ⏳ **Create TaxPaymentForm** - Form pembayaran pajak
4. ⏳ **Update InternalUsageForm** - Ambil `coa_inventory_code`
5. ⏳ **Create ExpenseForm** - Form pengeluaran operasional

---

**Sistem ini memastikan setiap transaksi otomatis membuat jurnal yang benar dan balance! 🎯**
