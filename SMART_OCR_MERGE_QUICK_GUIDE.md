# SMART OCR MERGE ENGINE - Quick Guide

## ✅ Status: AKTIF (UDFM v3)

SMART OCR MERGE ENGINE sudah diaktifkan di halaman Sign Up dengan fitur:
- Smart Merge dengan Meta Protection
- Namespace Storage per Document Type
- Workflow Routing berdasarkan dokumen
- Auto-create Supabase Columns

---

## 🔄 Workflow Routing (NEW!)

### Dokumen → Workflow Suggestions

| Scan | Workflow | Icon |
|------|----------|------|
| INVOICE | Buat transaksi pembelian / jurnal | 📄 |
| STNK / PAJAK_KENDARAAN | Tambah kendaraan ke master asset | 🚗 |
| KTP + KK | Buat master data karyawan/customer | 👤 |
| KTP saja | Buat master data customer | 👤 |
| AWB | Buat data shipment / tracking | 📦 |
| IJAZAH + CV | Buat profil kandidat | 📋 |
| IJAZAH saja | Tambah data pendidikan | 🎓 |
| NPWP | Tambah data pajak | 📊 |
| SIM | Tambah data SIM ke driver | 🪪 |
| BPJS | Tambah data BPJS | 🏥 |

---

## 🏷️ Source Badges (NEW!)

| Badge | Color | Meaning |
|-------|-------|---------|
| [KTP] | Green | Data dari KTP |
| [KK] | Orange | Data dari KK |
| [IJAZAH] | Blue | Data dari Ijazah |
| [STNK] | Red | Data dari STNK |
| [SIM] | Yellow | Data dari SIM |
| [NPWP] | Indigo | Data dari NPWP |
| [AWB] | Cyan | Data dari AWB |
| [U] | Purple | User Edited (PROTECTED) |

---

## 🎯 Cara Kerja

### 4 Aturan Utama:
1. **Jangan timpa field yang sudah terisi** ⊗
2. **Jangan isi field dengan data kosong** ⊗
3. **Tambahkan field baru atau isi field kosong** ✔
4. **CRITICAL: Jangan pernah mengosongkan nilai yang sudah berhasil diisi dari OCR sebelumnya** ⊗

### Namespace Storage:
Setiap dokumen disimpan dalam namespace terpisah:
- KTP → `signUpData.details.ktp`
- KK → `signUpData.details.kk`
- Ijazah → `signUpData.details.ijazah`
- SKCK → `signUpData.details.skck`
- CV → `signUpData.details.cv`

## 📋 Hasil Implementasi

### ✓ Scan KTP → data muncul
```json
{
  "nama": "John Doe",
  "nik": "1234567890123456",
  "details": {
    "ktp": { "nama": "John Doe", "nik": "1234567890123456", ... }
  }
}
```

### ✓ Scan KK → data muncul tanpa menghapus KTP
```json
{
  "nama": "John Doe",           // ✔ Tidak ditimpa
  "nik": "1234567890123456",    // ✔ Tidak ditimpa
  "nomor_kk": "9876543210123456", // ✔ Ditambahkan
  "details": {
    "ktp": { ... },             // ✔ Tetap ada
    "kk": { "nomor_kk": "9876543210123456", ... }  // ✔ Ditambahkan
  }
}
```

### ✓ Scan Ijazah → data muncul tanpa menghapus KTP/KK
```json
{
  "nama": "John Doe",           // ✔ Tidak ditimpa
  "nik": "1234567890123456",    // ✔ Tidak ditimpa
  "nomor_kk": "9876543210123456", // ✔ Tidak ditimpa
  "nomor_ijazah": "IJZ-123456", // ✔ Ditambahkan
  "nama_sekolah": "SMA Negeri 1", // ✔ Ditambahkan
  "jurusan": "IPA",             // ✔ Ditambahkan
  "tahun_lulus": "2020",        // ✔ Ditambahkan
  "details": {
    "ktp": { ... },             // ✔ Tetap ada
    "kk": { ... },              // ✔ Tetap ada
    "ijazah": { 
      "nomor_ijazah": "IJZ-123456",
      "nama_sekolah": "SMA Negeri 1",
      "jurusan": "IPA",
      "tahun_lulus": "2020",
      ...
    }  // ✔ Ditambahkan
  }
}
```

### ✓ Field tetap lengkap sampai user melakukan Submit
- Semua field ditampilkan di UI
- Semua field dapat diedit
- Data tidak hilang sampai Submit

## 📄 IJAZAH Fields yang Diekstrak

| Field | Deskripsi |
|-------|-----------|
| nomor_ijazah | Nomor ijazah/sertifikat |
| nama | Nama lengkap pemilik ijazah |
| tempat_lahir | Tempat lahir |
| tanggal_lahir | Tanggal lahir (yyyy-MM-dd) |
| nama_sekolah | Nama sekolah/institusi |
| jenjang | Jenjang pendidikan (SD/SMP/SMA/SMK/D3/S1/S2/S3) |
| jurusan | Jurusan/program studi |
| tahun_lulus | Tahun kelulusan |
| tanggal_lulus | Tanggal kelulusan (yyyy-MM-dd) |
| nomor_peserta_ujian | Nomor peserta ujian |
| nisn | Nomor Induk Siswa Nasional |

## 📋 Contoh Penggunaan

### Scan KTP → Scan KK

**Setelah scan KTP:**
```json
{
  "nama": "John Doe",
  "nik": "1234567890123456",
  "tempat_lahir": "Jakarta"
}
```

**Setelah scan KK:**
```json
{
  "nama": "John Doe",              // ✔ Tidak ditimpa
  "nik": "1234567890123456",       // ✔ Tidak ditimpa
  "tempat_lahir": "Jakarta",       // ✔ Tidak ditimpa
  "nomor_kk": "9876543210123456",  // ✔ Ditambahkan
  "rt_rw": "001/002"               // ✔ Ditambahkan
}
```

## 🔍 Cara Cek

Lihat console log saat scan dokumen:

```
✔ SMART MERGE: nik = 1234567890123456  (ditambahkan)
⊗ SMART MERGE: nama already exists, skipping  (di-skip)
```

## 📁 Files

- **Edge Function:** `supabase/functions/smart-ocr-merge/index.ts`
- **Frontend:** `src/components/AuthForm.tsx` (line 219-360)
- **Dokumentasi:** `SMART_OCR_MERGE_ENGINE.md`

## 🚀 Supported Documents

- ✅ KTP
- ✅ KK (dengan anggota_keluarga)
- ✅ Ijazah
- ✅ SKCK
- ✅ CV

## 💡 Tips

1. Scan dokumen dalam urutan apapun - hasilnya sama
2. Data tidak akan hilang atau tertimpa
3. Check console log untuk debugging
4. Semua field kosong/null otomatis di-skip

## ⚠️ Troubleshooting

**Q: Data tidak masuk?**
A: Check console log - mungkin field sudah ada (⊗ symbol)

**Q: Data tertimpa?**
A: Tidak mungkin dengan SMART MERGE - check log untuk konfirmasi

**Q: Data kosong masuk?**
A: SMART MERGE otomatis skip nilai kosong/null/undefined

---

**Dokumentasi lengkap:** Lihat `SMART_OCR_MERGE_ENGINE.md`
