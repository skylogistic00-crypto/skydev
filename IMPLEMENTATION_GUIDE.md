# Dokumentasi Implementasi Sistem COA dengan Pemetaan Otomatis
## PT. Solusi Logistik Nusantara

---

## 📌 EXECUTIVE SUMMARY

Dokumen ini berisi panduan lengkap untuk implementasi sistem Chart of Accounts (COA) dengan fitur **automatic mapping** yang memilih akun secara otomatis berdasarkan kategori layanan/produk.

**Tujuan**: Meminimalisir kesalahan input manual dan mempercepat proses pencatatan akuntansi.

---

## 🎯 REKOMENDASI IMPLEMENTASI

### Opsi 1: Item/Service List (RECOMMENDED ⭐)

**Cara Kerja:**
- Setiap layanan/produk didaftarkan sebagai "Item" atau "Service" dalam master data
- Setiap item memiliki field:
  - **Kategori Layanan** (dropdown: Jasa Cargo, Jasa Tambahan, Jasa Gudang, Persediaan)
  - **Jenis Layanan** (dropdown: tergantung kategori)
  - **Akun Pendapatan** (auto-filled)
  - **Akun HPP/Beban** (auto-filled)
  - **Akun Aset** (auto-filled untuk persediaan)

**Keuntungan:**
- ✅ Paling akurat dan konsisten
- ✅ Mudah untuk tracking per item
- ✅ Support untuk pricing per item
- ✅ Cocok untuk software akuntansi modern (Accurate, Zahir, QuickBooks, Xero)

**Implementasi:**
1. Buat master "Service List" atau "Item List"
2. Tambahkan field custom untuk kategori dan jenis
3. Setup rule: saat kategori + jenis dipilih → auto-fill akun COA
4. Saat buat invoice/bill, pilih item → akun otomatis terisi

**Contoh Setup di Software:**
```
Item: Cargo Udara Domestik - Jakarta to Surabaya
├── Kategori: Jasa Cargo
├── Jenis: Cargo Udara Domestik
├── Akun Pendapatan: 4-1110 (auto)
├── Akun HPP: 5-1110 (auto)
└── Harga Jual: Rp 500.000/kg
```

---

### Opsi 2: Kategori Produk/Layanan

**Cara Kerja:**
- Gunakan fitur "Product Category" atau "Service Category" bawaan software
- Setup mapping di level kategori
- Saat transaksi, pilih kategori → akun otomatis terisi

**Keuntungan:**
- ✅ Lebih sederhana dari Item List
- ✅ Cocok untuk bisnis dengan layanan yang tidak terlalu banyak variasi
- ✅ Mudah di-maintain

**Kekurangan:**
- ⚠️ Kurang detail untuk tracking per item
- ⚠️ Tidak support pricing per item

**Implementasi:**
1. Setup kategori di master data
2. Assign akun COA default per kategori
3. Saat transaksi, pilih kategori → akun terisi otomatis

---

### Opsi 3: Tags/Labels

**Cara Kerja:**
- Gunakan sistem tagging untuk menandai transaksi
- Setup rule berdasarkan tag
- Saat transaksi, pilih tag → akun otomatis terisi

**Keuntungan:**
- ✅ Fleksibel, bisa multiple tags per transaksi
- ✅ Cocok untuk analisis multi-dimensi

**Kekurangan:**
- ⚠️ Kurang terstruktur
- ⚠️ Risiko inkonsistensi lebih tinggi
- ⚠️ Tidak semua software support

---

## 🏆 REKOMENDASI FINAL

### Untuk PT. Solusi Logistik Nusantara:

**Gunakan OPSI 1: Item/Service List**

**Alasan:**
1. Bisnis logistik memiliki banyak variasi layanan (udara, laut, darat, domestik, internasional)
2. Perlu tracking detail per jenis layanan untuk analisis profitabilitas
3. Harga bisa berbeda per rute/jenis layanan
4. Memudahkan pembuatan invoice dengan item yang sudah ter-setup

**Struktur yang Disarankan:**

```
MASTER SERVICE LIST
├── Jasa Cargo
│   ├── Cargo Udara Domestik
│   │   ├── Jakarta - Surabaya
│   │   ├── Jakarta - Medan
│   │   └── ...
│   ├── Cargo Udara Internasional
│   ├── Cargo Laut (LCL)
│   ├── Cargo Laut (FCL)
│   └── Cargo Darat
├── Jasa Tambahan
│   ├── Asuransi Pengiriman
│   ├── Packing Kayu
│   ├── Packing Kardus
│   └── Packing Bubble Wrap
├── Jasa Gudang
│   ├── Sewa Gudang
│   ├── Jasa Penyimpanan
│   └── Jasa Bongkar Muat
└── Persediaan
    ├── Kardus
    ├── Bubble Wrap
    ├── Kayu Packing
    └── Lakban
```

---

## 🔧 PANDUAN IMPLEMENTASI TEKNIS

### A. Untuk Software Akuntansi Desktop (Accurate, Zahir, MYOB)

**Langkah 1: Setup Master COA**
1. Import COA dari file Excel (gunakan COA_EXPORT_TEMPLATE.md)
2. Pastikan semua akun sudah ter-create dengan benar
3. Verifikasi struktur hierarki (level 1-4)

**Langkah 2: Setup Item/Service List**
1. Buka menu "Master Data" → "Item/Service"
2. Buat kategori sesuai tabel mapping
3. Untuk setiap item, set:
   - Nama item
   - Kategori
   - Jenis
   - Akun Pendapatan (default)
   - Akun HPP (default)
   - Akun Persediaan (untuk inventory)

**Langkah 3: Setup Automation Rule**
- Jika software support custom field & automation:
  - Buat field "Kategori Layanan" (dropdown)
  - Buat field "Jenis Layanan" (dropdown, conditional based on kategori)
  - Setup trigger: onChange Jenis Layanan → auto-fill akun COA

**Langkah 4: Training User**
1. Saat buat invoice: pilih item dari list → akun otomatis terisi
2. Saat buat bill/expense: pilih item → akun otomatis terisi
3. User tidak perlu pilih akun manual

---

### B. Untuk Software Cloud (QuickBooks Online, Xero, Jurnal.id)

**Langkah 1: Setup COA**
1. Import COA via CSV/Excel
2. Mapping ke kategori bawaan software (jika ada)

**Langkah 2: Setup Products & Services**
1. Buka "Products & Services"
2. Buat kategori untuk setiap jenis layanan
3. Set default income account & expense account per kategori

**Langkah 3: Setup Automation (jika support)**
- QuickBooks: Gunakan "Class" atau "Location" untuk tracking tambahan
- Xero: Gunakan "Tracking Categories"
- Jurnal.id: Gunakan "Tag" atau "Project"

---

### C. Untuk Custom Software/ERP

**Langkah 1: Database Schema**
```sql
-- Tabel sudah dibuat di migration 20240148
-- coa_category_mapping
-- chart_of_accounts

-- Function untuk get mapping
SELECT * FROM get_coa_mapping('Jasa Cargo', 'Cargo Udara Domestik');

-- Function untuk get service types
SELECT * FROM get_service_types_by_category('Jasa Cargo');
```

**Langkah 2: Frontend Integration**
- Dropdown kategori → fetch dari `coa_category_mapping.service_category`
- Dropdown jenis → fetch dari `get_service_types_by_category()`
- Auto-fill akun → call `get_coa_mapping()`

**Langkah 3: Validation**
- Pastikan setiap transaksi memiliki kategori & jenis
- Log setiap auto-mapping untuk audit trail

---

## 📊 WORKFLOW TRANSAKSI

### Workflow 1: Penjualan Jasa (Invoice)

```
1. User buat invoice baru
2. User pilih customer
3. User pilih item/service dari dropdown
   ├── Contoh: "Cargo Udara Domestik - Jakarta to Surabaya"
   └── Sistem otomatis mengisi:
       ├── Akun Pendapatan: 4-1110
       ├── Harga: Rp 500.000/kg
       └── PPN: 11%
4. User input quantity (kg)
5. Sistem hitung total otomatis
6. User save invoice
7. Jurnal otomatis ter-create:
   Dr. Piutang Usaha (1-1300)
   Cr. Pend. Cargo Udara Domestik (4-1110)
   Cr. Hutang PPN Keluaran (2-1510)
```

### Workflow 2: Pembelian Biaya (Bill/Expense)

```
1. User buat bill/expense baru
2. User pilih vendor/supplier
3. User pilih kategori: "Jasa Cargo"
4. User pilih jenis: "Cargo Udara Domestik"
5. Sistem otomatis mengisi:
   └── Akun Beban: 5-1110 (Biaya Angkut ke Agen Utama)
6. User input nominal
7. User save bill
8. Jurnal otomatis ter-create:
   Dr. Biaya Angkut ke Agen Utama (5-1110)
   Dr. Piutang Pajak - PPN Masukan (1-1700)
   Cr. Kas di Bank (1-1200)
```

### Workflow 3: Pembelian Persediaan

```
1. User buat purchase order
2. User pilih supplier
3. User pilih kategori: "Persediaan"
4. User pilih jenis: "Pembelian Kardus"
5. Sistem otomatis mengisi:
   └── Akun Aset: 1-1400 (Persediaan Bahan Kemasan)
6. User input quantity & harga
7. User save PO
8. Saat barang diterima, jurnal otomatis:
   Dr. Persediaan Bahan Kemasan (1-1400)
   Dr. Piutang Pajak - PPN Masukan (1-1700)
   Cr. Kas di Bank (1-1200)
```

### Workflow 4: Pemakaian Persediaan

```
1. User buat journal entry untuk pemakaian
2. User pilih kategori: "Jasa Tambahan"
3. User pilih jenis: "Packing Kardus"
4. Sistem otomatis mengisi:
   ├── Akun Beban: 5-1140 (Biaya Kemasan)
   └── Akun Aset: 1-1400 (Persediaan Bahan Kemasan)
5. User input quantity yang dipakai
6. Jurnal otomatis:
   Dr. Biaya Kemasan/Packaging Material (5-1140)
   Cr. Persediaan Bahan Kemasan (1-1400)
```

---

## 🔍 AUDIT TRAIL & REPORTING

### Laporan yang Harus Tersedia:

1. **Laporan Laba Rugi per Kategori Layanan**
   - Pendapatan Jasa Cargo
   - Pendapatan Jasa Tambahan
   - Pendapatan Jasa Gudang
   - HPP per kategori
   - Gross Profit per kategori

2. **Laporan Laba Rugi per Jenis Layanan**
   - Detail profitabilitas per jenis (udara, laut, darat)
   - Comparison antar jenis layanan

3. **Laporan Persediaan**
   - Stock kardus, bubble wrap, kayu, dll
   - Nilai persediaan
   - Pemakaian per periode

4. **Laporan Pajak**
   - PPN Masukan (dari pembelian)
   - PPN Keluaran (dari penjualan)
   - PPh 21, 23, 25

---

## ✅ CHECKLIST IMPLEMENTASI

### Pre-Implementation
- [ ] Review dan approve COA structure
- [ ] Review dan approve mapping rules
- [ ] Pilih software akuntansi (jika belum ada)
- [ ] Backup data existing (jika migrasi)

### Implementation Phase
- [ ] Import COA ke software
- [ ] Setup master item/service list
- [ ] Setup mapping rules
- [ ] Setup automation (jika support)
- [ ] Test dengan sample transactions
- [ ] Verifikasi jurnal yang ter-generate

### Training Phase
- [ ] Training untuk accounting team
- [ ] Training untuk operational team (yang input transaksi)
- [ ] Buat user manual/SOP
- [ ] Setup helpdesk/support

### Go-Live Phase
- [ ] Parallel run (1 bulan)
- [ ] Review dan fix issues
- [ ] Full cutover
- [ ] Monitor dan evaluate

### Post-Implementation
- [ ] Monthly review mapping accuracy
- [ ] Quarterly review COA structure
- [ ] Continuous improvement

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: User Lupa Pilih Kategori/Jenis
**Solution**: 
- Set kategori & jenis sebagai required field
- Tampilkan warning jika tidak dipilih

### Issue 2: Mapping Tidak Sesuai untuk Kasus Khusus
**Solution**:
- Sediakan opsi "Manual Override"
- Log semua manual override untuk review

### Issue 3: Perlu Tambah Kategori/Jenis Baru
**Solution**:
- Buat form request untuk tambah mapping baru
- Approval dari accounting manager
- Update mapping table

### Issue 4: Salah Pilih Kategori/Jenis
**Solution**:
- Sediakan fitur edit transaksi
- Log semua perubahan untuk audit trail

---

## 📞 SUPPORT & MAINTENANCE

### Tim yang Bertanggung Jawab:
1. **Accounting Manager**: Approve COA structure & mapping rules
2. **IT Team**: Technical implementation & maintenance
3. **Operational Team**: Daily usage & feedback

### Maintenance Schedule:
- **Daily**: Monitor error logs
- **Weekly**: Review manual overrides
- **Monthly**: Review mapping accuracy
- **Quarterly**: Review COA structure
- **Yearly**: Full audit & optimization

---

## 📚 REFERENSI

1. **SAK ETAP/EMKM**: Standar Akuntansi Keuangan Indonesia
2. **Peraturan Perpajakan**: UU PPh, UU PPN
3. **Best Practices**: GAAP, IFRS (untuk referensi)

---

## 📝 APPENDIX

### A. Glossary
- **COA**: Chart of Accounts
- **HPP**: Harga Pokok Penjualan (Cost of Goods Sold)
- **PPN**: Pajak Pertambahan Nilai (VAT)
- **PPh**: Pajak Penghasilan (Income Tax)
- **LCL**: Less than Container Load
- **FCL**: Full Container Load

### B. Contact Information
- **Accounting Team**: accounting@perusahaan.com
- **IT Support**: it@perusahaan.com
- **Helpdesk**: +62-xxx-xxxx-xxxx

---

**Dokumen ini dibuat untuk**: PT. Solusi Logistik Nusantara  
**Tanggal**: 2024  
**Versi**: 1.0  
**Status**: Ready for Implementation
