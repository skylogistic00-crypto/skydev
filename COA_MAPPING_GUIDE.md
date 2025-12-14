# 📘 PANDUAN MAPPING COA & LOGIKA JURNAL OTOMATIS

## 🎯 OVERVIEW

Sistem ini menggunakan **mapping COA** yang tersimpan di tabel master (`inventory_items`, `service_items`) untuk otomatis membuat jurnal yang benar setiap kali ada transaksi.

---

## 🗂️ MAPPING COA DI TABEL MASTER

### 1️⃣ **inventory_items** (Barang)
Setiap barang memiliki 2 akun COA:

| Kolom | Fungsi | Contoh |
|-------|--------|--------|
| `coa_inventory_code` | Akun Persediaan (Asset) | 1-1410 - Persediaan Bahan Kemasan |
| `coa_cogs_code` | Akun HPP (COGS) | 5-1500 - Biaya Bahan Kemasan |

**Cara Setting:**
- Buka `/coa-mapping` → Tab "Inventory Items"
- Pilih akun untuk setiap barang

---

### 2️⃣ **service_items** (Jasa)
Setiap jasa memiliki 2 akun COA:

| Kolom | Fungsi | Contoh |
|-------|--------|--------|
| `coa_revenue_code` | Akun Pendapatan (Revenue) | 4-2100 - Pendapatan Jasa Storage |
| `coa_expense_code` | Akun Beban (Expense, optional) | 6-5400 - Konsultan IT |

**Cara Setting:**
- Buka `/coa-mapping` → Tab "Service Items"
- Pilih akun untuk setiap jasa

---

## 🔄 LOGIKA JURNAL OTOMATIS

### 1️⃣ **PENJUALAN BARANG** (Sales Form - Type: Barang)

**Sumber Data COA:**
- Kas/Piutang: Hardcoded (1-1100 atau 1-1200)
- Pendapatan: `inventory_items.coa_revenue_code` ❌ **SALAH!**
- HPP: `inventory_items.coa_cogs_code` ✅
- Persediaan: `inventory_items.coa_inventory_code` ✅
- Pajak: Hardcoded (2-1250 - Utang PPN)

**Jurnal yang Dibuat:**
```
Dr Kas/Piutang (1-1100/1-1200) ............. Rp 111.000
  Cr Pendapatan Penjualan (user pilih) ..... Rp 100.000
  Cr Utang Pajak (2-1250) .................. Rp 11.000

Dr Harga Pokok Penjualan (coa_cogs_code) ... Rp 50.000
  Cr Persediaan (coa_inventory_code) ....... Rp 50.000
```

**PERBAIKAN YANG DIPERLUKAN:**
- Pendapatan harus diambil dari **user input** (dropdown COA Revenue)
- Bukan dari `inventory_items` karena barang tidak punya akun pendapatan

---

### 2️⃣ **PENJUALAN JASA** (Sales Form - Type: Jasa)

**Sumber Data COA:**
- Kas/Piutang: Hardcoded (1-1100 atau 1-1200)
- Pendapatan: `service_items.coa_revenue_code` ✅
- Pajak: Hardcoded (2-1250 - Utang PPN)

**Jurnal yang Dibuat:**
```
Dr Kas/Piutang (1-1100/1-1200) ............. Rp 111.000
  Cr Pendapatan Jasa (coa_revenue_code) .... Rp 100.000
  Cr Utang Pajak (2-1250) .................. Rp 11.000
```

**STATUS:** ✅ Sudah benar!

---

### 3️⃣ **PEMBELIAN BARANG** (Purchase Form - Belum Ada)

**Sumber Data COA:**
- Persediaan: `inventory_items.coa_inventory_code` ✅
- PPN Masukan: Hardcoded (1-1720 - Piutang Pajak)
- Kas/Bank: Hardcoded (1-1100)

**Jurnal yang Dibuat:**
```
Dr Persediaan (coa_inventory_code) ......... Rp 100.000
Dr PPN Masukan (1-1720) .................... Rp 11.000
  Cr Kas/Bank (1-1100) .................... Rp 111.000
```

---

### 4️⃣ **PEMBELIAN JASA** (Purchase Form - Belum Ada)

**Sumber Data COA:**
- Biaya Jasa: `service_items.coa_expense_code` ✅
- PPN Masukan: Hardcoded (1-1720 - Piutang Pajak)
- Kas/Bank: Hardcoded (1-1100)

**Jurnal yang Dibuat:**
```
Dr Biaya Jasa (coa_expense_code) ........... Rp 100.000
Dr PPN Masukan (1-1720) .................... Rp 11.000
  Cr Kas/Bank (1-1100) .................... Rp 111.000
```

---

### 5️⃣ **PEMAKAIAN INTERNAL** (Internal Usage Form)

**Sumber Data COA:**
- Beban Operasional: User pilih dari dropdown (Expense accounts)
- Persediaan: `inventory_items.coa_inventory_code` ✅

**Jurnal yang Dibuat:**
```
Dr Beban Operasional (user pilih) .......... Rp 50.000
  Cr Persediaan (coa_inventory_code) ....... Rp 50.000
```

**STATUS:** ✅ Sudah benar!

---

### 6️⃣ **PENGELUARAN OPERASIONAL** (Expense Form - Dihapus)

**Sumber Data COA:**
- Biaya Operasional: User pilih dari dropdown
- Kas/Bank: Hardcoded (1-1100)
- PPN Masukan (optional): Hardcoded (1-1720)

**Jurnal yang Dibuat:**
```
Dr Biaya Operasional (user pilih) .......... Rp 100.000
Dr PPN Masukan (1-1720) .................... Rp 11.000 (jika ada)
  Cr Kas/Bank (1-1100) .................... Rp 111.000
```

---

### 7️⃣ **PEMBAYARAN PAJAK** (Tax Payment Form - Belum Ada)

**Sumber Data COA:**
- Kewajiban Pajak: `tax_transactions.coa_tax_code` ✅
- Kas/Bank: Hardcoded (1-1100)

**Jurnal yang Dibuat:**
```
Dr Kewajiban Pajak (coa_tax_code) .......... Rp 11.000
  Cr Kas/Bank (1-1100) .................... Rp 11.000
```

---

## 🔧 PERBAIKAN YANG DIPERLUKAN

### **SalesForm.tsx - Penjualan Barang**

**MASALAH SAAT INI:**
- Akun Pendapatan diambil dari user input (dropdown COA)
- Seharusnya untuk **Barang**, tidak ada akun pendapatan di `inventory_items`

**SOLUSI:**
1. Untuk **Penjualan Barang**: User tetap pilih akun pendapatan dari dropdown
2. Untuk **Penjualan Jasa**: Otomatis ambil dari `service_items.coa_revenue_code`

**UPDATE LOGIC:**
```typescript
// Saat user pilih Jasa
const handleServiceChange = async (serviceId: string) => {
  const { data } = await supabase
    .from("service_items")
    .select("id, item_name, price, coa_revenue_code, coa_revenue_name")
    .eq("id", serviceId)
    .single();
  
  if (data) {
    setFormData(prev => ({
      ...prev,
      item_id: serviceId,
      item_name: data.item_name,
      unit_price: data.price,
      coa_account_code: data.coa_revenue_code, // Auto-fill
      coa_account_name: data.coa_revenue_name,
    }));
  }
};

// Saat user pilih Barang
const handleItemChange = async (itemId: string) => {
  const { data } = await supabase
    .from("inventory_items")
    .select("id, item_name, qty_available, cost_per_unit, coa_inventory_code, coa_cogs_code")
    .eq("id", itemId)
    .single();
  
  if (data) {
    setFormData(prev => ({
      ...prev,
      item_id: itemId,
      item_name: data.item_name,
      stock_current: data.qty_available,
      cost_per_unit: data.cost_per_unit,
      // User tetap harus pilih akun pendapatan manual
    }));
  }
};
```

---

## 📊 TABEL REFERENSI COA

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

### **Akun Persediaan (Asset)**
| Kode | Nama | Digunakan Untuk |
|------|------|-----------------|
| 1-1410 | Persediaan Bahan Kemasan | Kardus, Bubble Wrap, dll |
| 1-1420 | Persediaan Alat Tulis | ATK |

### **Akun Pendapatan (Revenue)**
| Kode | Nama | Digunakan Untuk |
|------|------|-----------------|
| 4-1100 | Pendapatan Penjualan Barang | Penjualan Barang |
| 4-2100 | Pendapatan Jasa Storage | Penjualan Jasa |

### **Akun HPP (COGS)**
| Kode | Nama | Digunakan Untuk |
|------|------|-----------------|
| 5-1100 | Biaya Freight/Ongkos Kirim | HPP Barang |
| 5-1500 | Biaya Bahan Kemasan | HPP Kemasan |

### **Akun Beban (Expense)**
| Kode | Nama | Digunakan Untuk |
|------|------|-----------------|
| 6-5400 | Konsultan IT | Biaya Jasa IT |
| 6-6100 | Biaya Listrik | Biaya Operasional |
| 6-6200 | Biaya Telepon & Internet | Biaya Operasional |

---

## ✅ CHECKLIST IMPLEMENTASI

- [x] Tabel `inventory_items` memiliki `coa_inventory_code` dan `coa_cogs_code`
- [x] Tabel `service_items` memiliki `coa_revenue_code` dan `coa_expense_code`
- [x] Tabel `sales_transactions` menyimpan semua kode COA terkait
- [x] Tabel `internal_usage` menyimpan kode COA terkait
- [x] Komponen `COAMappingManager` untuk setting mapping
- [ ] **UPDATE SalesForm**: Auto-fill COA untuk Jasa
- [ ] **UPDATE SalesForm**: Ambil `coa_inventory_code` dan `coa_cogs_code` saat pilih Barang
- [ ] **CREATE PurchaseForm**: Form pembelian barang/jasa
- [ ] **CREATE TaxPaymentForm**: Form pembayaran pajak
- [ ] **UPDATE InternalUsageForm**: Ambil `coa_inventory_code` dari `inventory_items`

---

## 🚀 NEXT STEPS

1. **Update SalesForm** agar mengambil COA dari tabel master
2. **Buat PurchaseForm** untuk pembelian barang/jasa
3. **Buat TaxPaymentForm** untuk pembayaran pajak
4. **Update InternalUsageForm** agar mengambil `coa_inventory_code`
5. **Testing** semua jurnal otomatis

---

**Sistem ini akan memastikan setiap transaksi otomatis membuat jurnal yang benar sesuai mapping COA! 🎯**
