# SMART OCR MERGE ENGINE - Dokumentasi Lengkap

## Overview
SMART OCR MERGE ENGINE adalah sistem yang memastikan data dari berbagai dokumen OCR (KTP, KK, Ijazah, SKCK, CV) dapat digabungkan dengan aman tanpa menimpa data yang sudah ada.

## Prinsip Kerja

### 1. SMART MERGE Rules
```typescript
// Rule 1: Jangan timpa field yang sudah terisi
if (existingField && existingField !== "" && existingField !== null) {
  console.log("⊗ Field already exists, skipping");
  return; // Skip
}

// Rule 2: Jangan isi field dengan data kosong
if (newValue === null || newValue === undefined || newValue === "") {
  console.log("⊗ Empty value, skipping");
  return; // Skip
}

// Rule 3: Tambahkan field baru atau isi field kosong
if (!existingField || existingField === "" || existingField === null) {
  updatedData[field] = newValue;
  console.log("✔ SMART MERGE: field added");
}

// Rule 4: CRITICAL - Jangan pernah mengosongkan nilai yang sudah berhasil diisi dari OCR sebelumnya
// This rule is enforced by Rule 1 and Rule 2 combined
```

### 2. Document Namespaces
Setiap jenis dokumen memiliki namespace sendiri untuk menghindari konflik:

```typescript
const namespaces = {
  ktp: "details.ktp",
  kk: "details.kk",
  ijazah: "details.ijazah",
  skck: "details.skck",
  cv: "details.cv"
};
```

**Contoh struktur data:**
```json
{
  "nama": "John Doe",
  "nik": "1234567890123456",
  "details": {
    "ktp": {
      "nama": "John Doe",
      "nik": "1234567890123456",
      "alamat": "Jl. Contoh No. 123"
    },
    "kk": {
      "nomor_kk": "9876543210123456",
      "nama_kepala_keluarga": "John Doe",
      "anggota_keluarga": [...]
    },
    "ijazah": {
      "nomor_ijazah": "IJZ-123456",
      "pendidikan_terakhir": "S1"
    }
  }
}
```

## Implementasi

### Namespace Storage (NEW)
Ketika document_type berbeda, data disimpan dalam namespace:

```typescript
// Initialize details object if not exists
if (!updatedSignUpData.details) {
  updatedSignUpData.details = {};
}

// Store full OCR data in namespace based on document type
if (docTypeForMerge) {
  // Initialize namespace if not exists
  if (!updatedSignUpData.details[docTypeForMerge]) {
    updatedSignUpData.details[docTypeForMerge] = {};
  }
  
  // Store all cleaned OCR data in the namespace
  Object.entries(cleanedOcrData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      // Only add if not already exists in namespace
      if (!updatedSignUpData.details[docTypeForMerge][key] ||
          updatedSignUpData.details[docTypeForMerge][key] === "" ||
          updatedSignUpData.details[docTypeForMerge][key] === null) {
        updatedSignUpData.details[docTypeForMerge][key] = value;
        console.log(`✔ NAMESPACE [${docTypeForMerge}]: ${key} = ${value}`);
      }
    }
  });
}
```

## Implementasi

### Edge Function: `smart-ocr-merge`

**Endpoint:**
```
POST https://gfmokpjnnnbnjlqxhoux.supabase.co/functions/v1/supabase-functions-smart-ocr-merge
```

**Request Body:**
```json
{
  "userId": "uuid-string",
  "existingSignUpData": {
    "nama": "John Doe",
    "email": "john@example.com"
  },
  "newOcrData": {
    "nik": "1234567890123456",
    "tempat_lahir": "Jakarta",
    "tanggal_lahir": "1990-01-01"
  },
  "docType": "ktp"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OCR data merged successfully",
  "mergedData": {
    "nama": "John Doe",
    "email": "john@example.com",
    "nik": "1234567890123456",
    "tempat_lahir": "Jakarta",
    "tanggal_lahir": "1990-01-01",
    "details": {
      "ktp": {
        "nik": "1234567890123456",
        "tempat_lahir": "Jakarta",
        "tanggal_lahir": "1990-01-01"
      }
    }
  },
  "docType": "ktp",
  "fieldsAdded": 5
}
```

### Frontend Integration (AuthForm.tsx)

**Aktivasi SMART MERGE:**
```typescript
// 1. Tentukan document type
const docTypeMap: Record<string, string> = {
  "KTP": "ktp",
  "KK": "kk",
  "IJAZAH": "ijazah",
  "SKCK": "skck",
  "CV": "cv"
};
const docTypeForMerge = docTypeMap[jenis_dokumen] || null;

// 2. Filter data OCR (hapus technical fields)
const skipKeys = [
  "jenis_dokumen", "raw_text", "clean_text", "ocr_engine", 
  "id", "created_at", "updated_at", "debug_notes"
];

const cleanedOcrData: Record<string, any> = {};
Object.entries(structuredData).forEach(([key, value]) => {
  if (!skipKeys.includes(key)) {
    cleanedOcrData[key] = value;
  }
});

// 3. SMART MERGE logic
Object.entries(cleanedOcrData).forEach(([key, value]) => {
  const normalizedKey = key.replace(/[^a-zA-Z0-9_]/g, "");
  
  // SMART MERGE: Only add if value is not empty AND field is empty or doesn't exist
  if (value !== null && value !== undefined && value !== "") {
    if (!updatedSignUpData[normalizedKey] || 
        updatedSignUpData[normalizedKey] === "" || 
        updatedSignUpData[normalizedKey] === null || 
        updatedSignUpData[normalizedKey] === undefined) {
      updatedSignUpData[normalizedKey] = value;
      console.log(`✔ SMART MERGE: ${normalizedKey} = ${value}`);
    } else {
      console.log(`⊗ SMART MERGE: ${normalizedKey} already exists, skipping`);
    }
  }
});
```

## Skenario Penggunaan

### Skenario 1: Scan KTP Dulu, Lalu KK

**Step 1: Scan KTP**
```json
// Input OCR KTP
{
  "nama": "John Doe",
  "nik": "1234567890123456",
  "tempat_lahir": "Jakarta",
  "tanggal_lahir": "1990-01-01"
}

// Result after SMART MERGE
{
  "nama": "John Doe",
  "nik": "1234567890123456",
  "tempat_lahir": "Jakarta",
  "tanggal_lahir": "1990-01-01"
}
```

**Step 2: Scan KK**
```json
// Input OCR KK
{
  "nomor_kk": "9876543210123456",
  "nama_kepala_keluarga": "John Doe",
  "nama": "John Doe",  // Sudah ada, tidak akan ditimpa
  "nik": "1234567890123456",  // Sudah ada, tidak akan ditimpa
  "rt_rw": "001/002",
  "kelurahan_desa": "Kelurahan Contoh"
}

// Result after SMART MERGE
{
  "nama": "John Doe",  // ✔ Tidak ditimpa
  "nik": "1234567890123456",  // ✔ Tidak ditimpa
  "tempat_lahir": "Jakarta",  // ✔ Tetap ada
  "tanggal_lahir": "1990-01-01",  // ✔ Tetap ada
  "nomor_kk": "9876543210123456",  // ✔ Ditambahkan
  "nama_kepala_keluarga": "John Doe",  // ✔ Ditambahkan
  "rt_rw": "001/002",  // ✔ Ditambahkan
  "kelurahan_desa": "Kelurahan Contoh"  // ✔ Ditambahkan
}
```

### Skenario 2: Scan KK Dulu, Lalu KTP

**Step 1: Scan KK**
```json
// Input OCR KK
{
  "nomor_kk": "9876543210123456",
  "nama_kepala_keluarga": "John Doe",
  "nama": "John Doe",
  "nik": "1234567890123456",
  "rt_rw": "001/002"
}

// Result after SMART MERGE
{
  "nomor_kk": "9876543210123456",
  "nama_kepala_keluarga": "John Doe",
  "nama": "John Doe",
  "nik": "1234567890123456",
  "rt_rw": "001/002"
}
```

**Step 2: Scan KTP**
```json
// Input OCR KTP
{
  "nama": "John Doe",  // Sudah ada, tidak akan ditimpa
  "nik": "1234567890123456",  // Sudah ada, tidak akan ditimpa
  "tempat_lahir": "Jakarta",
  "tanggal_lahir": "1990-01-01",
  "alamat": "Jl. Contoh No. 123"
}

// Result after SMART MERGE
{
  "nomor_kk": "9876543210123456",  // ✔ Tetap ada
  "nama_kepala_keluarga": "John Doe",  // ✔ Tetap ada
  "nama": "John Doe",  // ✔ Tidak ditimpa
  "nik": "1234567890123456",  // ✔ Tidak ditimpa
  "rt_rw": "001/002",  // ✔ Tetap ada
  "tempat_lahir": "Jakarta",  // ✔ Ditambahkan
  "tanggal_lahir": "1990-01-01",  // ✔ Ditambahkan
  "alamat": "Jl. Contoh No. 123"  // ✔ Ditambahkan
}
```

### Skenario 3: Scan Multiple Documents

**Urutan: KTP → KK → Ijazah → SKCK → CV**

Setiap dokumen akan menambahkan field baru tanpa menimpa field yang sudah ada:

```json
// After KTP
{
  "nama": "John Doe",
  "nik": "1234567890123456",
  "tempat_lahir": "Jakarta"
}

// After KK (added)
{
  "nama": "John Doe",  // ✔ Tidak ditimpa
  "nik": "1234567890123456",  // ✔ Tidak ditimpa
  "tempat_lahir": "Jakarta",  // ✔ Tidak ditimpa
  "nomor_kk": "9876543210123456",  // ✔ Ditambahkan
  "rt_rw": "001/002"  // ✔ Ditambahkan
}

// After Ijazah (added)
{
  "nama": "John Doe",  // ✔ Tidak ditimpa
  "nik": "1234567890123456",  // ✔ Tidak ditimpa
  "tempat_lahir": "Jakarta",  // ✔ Tidak ditimpa
  "nomor_kk": "9876543210123456",  // ✔ Tidak ditimpa
  "rt_rw": "001/002",  // ✔ Tidak ditimpa
  "nomor_ijazah": "IJZ-123456",  // ✔ Ditambahkan
  "pendidikan_terakhir": "S1"  // ✔ Ditambahkan
}

// And so on...
```

## Special Handling: KK dengan Anggota Keluarga

Dokumen KK memiliki handling khusus karena berisi array `anggota_keluarga`:

```typescript
if (jenis_dokumen === "KK" && structuredData.anggota_keluarga) {
  // 1. SMART MERGE: anggota_keluarga
  if (!updatedSignUpData["anggota_keluarga"]) {
    updatedSignUpData["anggota_keluarga"] = structuredData.anggota_keluarga;
  }
  
  // 2. SMART MERGE: KK header fields
  const kkHeaderFields = [
    "nomor_kk", "nama_kepala_keluarga", "rt_rw", 
    "kelurahan_desa", "kecamatan", "kabupaten_kota", 
    "provinsi", "kode_pos", "tanggal_dikeluarkan"
  ];
  
  kkHeaderFields.forEach(field => {
    if (structuredData[field] && !updatedSignUpData[field]) {
      updatedSignUpData[field] = structuredData[field];
    }
  });
  
  // 3. SMART MERGE: Kepala keluarga data
  const kepalaKeluarga = structuredData.anggota_keluarga.find(
    (a: any) => a.status_hubungan_keluarga === "KEPALA KELUARGA"
  );
  
  if (kepalaKeluarga) {
    if (!updatedSignUpData["nama"]) {
      updatedSignUpData["nama"] = kepalaKeluarga.nama;
    }
    if (!updatedSignUpData["nik"]) {
      updatedSignUpData["nik"] = kepalaKeluarga.nik;
    }
    // ... dan seterusnya
  }
}
```

## Logging & Debugging

### Console Logs
SMART MERGE ENGINE menghasilkan log yang jelas:

```
=== ACTIVATING SMART OCR MERGE ENGINE ===
Document type for merge: ktp
Existing signUpData before merge: { nama: "John Doe" }
Cleaned OCR data (without skip keys): { nik: "1234567890123456", ... }

✔ SMART MERGE: nik = 1234567890123456
✔ SMART MERGE: tempat_lahir = Jakarta
⊗ SMART MERGE: nama already exists, skipping

=== MERGED DATA ===
Total fields: 5
```

### Symbols
- `✔` = Field berhasil ditambahkan
- `⊗` = Field di-skip karena sudah ada

## Testing

### Test Case 1: Empty to Filled
```typescript
// Before
signUpData = {}

// OCR Input
ocrData = { nama: "John", nik: "123" }

// After SMART MERGE
signUpData = { nama: "John", nik: "123" }  // ✔ All added
```

### Test Case 2: Filled to Filled (No Overwrite)
```typescript
// Before
signUpData = { nama: "John", nik: "123" }

// OCR Input
ocrData = { nama: "Jane", nik: "456", alamat: "Jl. X" }

// After SMART MERGE
signUpData = { 
  nama: "John",  // ✔ Not overwritten
  nik: "123",    // ✔ Not overwritten
  alamat: "Jl. X"  // ✔ Added
}
```

### Test Case 3: Null/Empty Values
```typescript
// Before
signUpData = { nama: "John" }

// OCR Input
ocrData = { nama: "", nik: null, alamat: "Jl. X" }

// After SMART MERGE
signUpData = { 
  nama: "John",  // ✔ Not overwritten
  alamat: "Jl. X"  // ✔ Added
}
// nik not added because it's null
```

## Database Integration

SMART MERGE ENGINE menyimpan hasil merge ke database menggunakan Pica Passthrough API:

```typescript
const sqlQuery = `
  UPDATE users
  SET sign_up_data = '${JSON.stringify(mergedData).replace(/'/g, "''")}'::jsonb
  WHERE id = '${userId}';
`;

await fetch(
  `https://api.picaos.com/v1/passthrough/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
  {
    method: "POST",
    headers: {
      "x-pica-secret": PICA_SECRET_KEY,
      "x-pica-connection-key": PICA_SUPABASE_CONNECTION_KEY,
      "x-pica-action-id": ACTION_ID,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: sqlQuery })
  }
);
```

## Keuntungan SMART MERGE ENGINE

1. **Aman**: Tidak ada data yang hilang atau tertimpa
2. **Fleksibel**: Bisa scan dokumen dalam urutan apapun
3. **Konsisten**: Hasil merge selalu predictable
4. **Traceable**: Log yang jelas untuk debugging
5. **Scalable**: Mudah menambahkan jenis dokumen baru

## Troubleshooting

### Problem: Data tidak masuk
**Solution:** Check console log untuk melihat apakah field di-skip:
```
⊗ SMART MERGE: nama already exists, skipping
```

### Problem: Data kosong masuk
**Solution:** SMART MERGE otomatis skip nilai kosong/null/undefined

### Problem: Data tertimpa
**Solution:** Tidak mungkin terjadi dengan SMART MERGE. Check log untuk konfirmasi.

## Kesimpulan

SMART OCR MERGE ENGINE memastikan:
- ✅ Data KTP masuk
- ✅ Data KK masuk TANPA menimpa data KTP
- ✅ Data Ijazah, SKCK, CV masuk TANPA menimpa data sebelumnya
- ✅ Semua hasil OCR digabung dengan aman
- ✅ Tidak ada overwrite total object
- ✅ Namespace opsional untuk setiap jenis dokumen

**Status: AKTIF dan SIAP DIGUNAKAN** ✅
