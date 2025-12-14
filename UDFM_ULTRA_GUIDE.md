# UDFM ULTRA - Universal Document Field Mapper

## Versi: Final (v3)

UDFM ULTRA adalah sistem OCR universal yang dapat memproses berbagai jenis dokumen Indonesia dan mengekstrak data secara otomatis.

## 🎯 Tujuan Utama

- ✅ Menerima dokumen apapun (KTP, KK, IJAZAH, NPWP, SIM, STNK, PAJAK, AWB, INVOICE, CV, dll)
- ✅ Menentukan jenis dokumen otomatis
- ✅ Menstrukturkan data ke bentuk JSON rapi
- ✅ Memetakan field ke signUpData secara aman dan pintar
- ✅ Tidak menimpa data yang sudah benar (user edit / OCR confidence tinggi)
- ✅ Membuat kolom di Supabase otomatis jika perlu
- ✅ Merender semua field di UI sebagai dynamic fields
- ✅ Memicu workflow lanjutan sesuai jenis dokumen (routing v3)

## 📋 Document Type Detection (Classifier)

Dari `clean_text` / `raw_text`, sistem mendeteksi jenis dokumen dengan aturan:

| Keyword | Document Type |
|---------|---------------|
| "KARTU KELUARGA", "NOMOR KK" | KK |
| "NIK" + "Tempat/Tgl Lahir" | KTP |
| "IJAZAH", "SEKOLAH MENENGAH", "NISN" | IJAZAH |
| "NPWP", "NOMOR POKOK WAJIB PAJAK" | NPWP |
| "SURAT IZIN MENGEMUDI", "SIM" + "GOLONGAN" | SIM |
| "SURAT TANDA NOMOR KENDARAAN", "STNK" | STNK |
| "PAJAK KENDARAAN BERMOTOR", "PKB", "SAMSAT" | PAJAK_KENDARAAN |
| "AIR WAYBILL", "AWB", "CONSIGNEE" + "SHIPPER" | AWB |
| "INVOICE", "FAKTUR", "BILL TO" | INVOICE |
| "CURRICULUM VITAE", "RIWAYAT HIDUP" | CV |
| "BPJS", "JAMINAN KESEHATAN" | BPJS |
| "AKTA KELAHIRAN" | AKTA_LAHIR |
| "SURAT KETERANGAN", "SKCK" | SURAT_KETERANGAN |
| Tidak jelas | UNKNOWN |

## 📄 Supported Document Types & Fields

### KTP (Kartu Tanda Penduduk)
```json
{
  "nik": "16-digit NIK",
  "nama": "Full name",
  "tempat_lahir": "Place of birth",
  "tanggal_lahir": "yyyy-MM-dd",
  "jenis_kelamin": "LAKI-LAKI/PEREMPUAN",
  "alamat": "Full address",
  "rt_rw": "RT/RW",
  "kelurahan_desa": "Village",
  "kecamatan": "District",
  "kabupaten_kota": "City",
  "provinsi": "Province",
  "agama": "Religion",
  "status_perkawinan": "Marital status",
  "pekerjaan": "Occupation",
  "kewarganegaraan": "Nationality",
  "berlaku_hingga": "Valid until",
  "golongan_darah": "Blood type"
}
```

### KK (Kartu Keluarga)
```json
{
  "nomor_kk": "16-digit KK number",
  "nama_kepala_keluarga": "Head of family",
  "alamat": "Address",
  "rt_rw": "RT/RW",
  "kelurahan_desa": "Village",
  "kecamatan": "District",
  "kabupaten_kota": "City",
  "provinsi": "Province",
  "kode_pos": "Postal code",
  "tanggal_dikeluarkan": "Issue date",
  "anggota_keluarga": [{ "nama", "nik", "jenis_kelamin", ... }]
}
```

### IJAZAH (Diploma/Certificate)
```json
{
  "nomor_ijazah": "Certificate number",
  "nama": "Graduate name",
  "tempat_lahir": "Place of birth",
  "tanggal_lahir": "yyyy-MM-dd",
  "nama_sekolah": "School name",
  "jenjang": "SD/SMP/SMA/SMK/D3/S1/S2/S3",
  "jurusan": "Major",
  "program_studi": "Study program",
  "fakultas": "Faculty",
  "tahun_lulus": "Graduation year",
  "tanggal_lulus": "yyyy-MM-dd",
  "nomor_peserta_ujian": "Exam number",
  "nisn": "National Student ID",
  "gelar": "Academic degree",
  "ipk": "GPA",
  "akreditasi": "Accreditation",
  "nomor_seri_ijazah": "Serial number",
  "kepala_sekolah": "Principal name"
}
```

### NPWP (Tax ID)
```json
{
  "nomor_npwp": "NPWP number",
  "nama": "Taxpayer name",
  "alamat": "Address",
  "kelurahan": "Village",
  "kecamatan": "District",
  "kota": "City",
  "provinsi": "Province",
  "tanggal_terdaftar": "Registration date",
  "kpp": "Tax office"
}
```

### SIM (Driving License)
```json
{
  "nomor_sim": "SIM number",
  "nama": "Full name",
  "tempat_lahir": "Place of birth",
  "tanggal_lahir": "yyyy-MM-dd",
  "alamat": "Address",
  "golongan_sim": "A/B1/B2/C/D",
  "berlaku_hingga": "Valid until",
  "tinggi_badan": "Height",
  "golongan_darah": "Blood type",
  "pekerjaan": "Occupation"
}
```

### STNK (Vehicle Registration)
```json
{
  "nomor_polisi": "License plate",
  "nama_pemilik": "Owner name",
  "alamat": "Address",
  "merk": "Brand",
  "tipe": "Type",
  "model": "Model",
  "tahun_pembuatan": "Year",
  "warna": "Color",
  "nomor_rangka": "Chassis number",
  "nomor_mesin": "Engine number",
  "bahan_bakar": "Fuel type",
  "isi_silinder": "Engine capacity",
  "masa_berlaku": "Valid until"
}
```

### AWB (Air Waybill)
```json
{
  "awb_number": "AWB number",
  "shipper_name": "Shipper name",
  "shipper_address": "Shipper address",
  "consignee_name": "Consignee name",
  "consignee_address": "Consignee address",
  "origin": "Origin",
  "destination": "Destination",
  "pieces": "Number of pieces",
  "weight": "Weight",
  "description": "Goods description",
  "declared_value": "Declared value",
  "flight_number": "Flight number",
  "flight_date": "Flight date"
}
```

### INVOICE (Faktur)
```json
{
  "nomor_invoice": "Invoice number",
  "tanggal_invoice": "Invoice date",
  "nama_penjual": "Seller name",
  "alamat_penjual": "Seller address",
  "npwp_penjual": "Seller NPWP",
  "nama_pembeli": "Buyer name",
  "alamat_pembeli": "Buyer address",
  "npwp_pembeli": "Buyer NPWP",
  "items": [{ "nama_barang", "quantity", "harga_satuan", "jumlah" }],
  "subtotal": "Subtotal",
  "ppn": "VAT",
  "total": "Total",
  "tanggal_jatuh_tempo": "Due date"
}
```

### CV (Curriculum Vitae)
```json
{
  "nama": "Full name",
  "tempat_lahir": "Place of birth",
  "tanggal_lahir": "Date of birth",
  "alamat": "Address",
  "email": "Email",
  "telepon": "Phone",
  "pendidikan": [{ "institusi", "jurusan", "tahun_lulus", "gelar" }],
  "pengalaman_kerja": [{ "perusahaan", "posisi", "tahun_mulai", "tahun_selesai" }],
  "keahlian": ["skill1", "skill2"],
  "bahasa": ["language1", "language2"],
  "sertifikasi": ["cert1", "cert2"]
}
```

## 🔄 SMART MERGE Rules

1. **Jangan timpa field yang sudah terisi** ⊗
2. **Jangan isi field dengan data kosong** ⊗
3. **Tambahkan field baru atau isi field kosong** ✔
4. **CRITICAL: Jangan pernah mengosongkan nilai yang sudah berhasil diisi dari OCR sebelumnya** ⊗

## 📁 Namespace Storage (Per Document Type)

### Konsep
Setiap dokumen yang di-scan disimpan dalam namespace terpisah di `signUpData.details[document_type]`. Ini memastikan:
- ✅ Data dari dokumen berbeda tidak saling menimpa
- ✅ Multi-document workflow didukung penuh
- ✅ Setiap dokumen memiliki structured_data lengkap tersimpan
- ✅ Mudah diakses untuk rendering UI atau validasi per dokumen

### Struktur Data
```typescript
interface SignUpData {
  details: {
    [documentType: string]: Record<string, any>;
  };
  // ... other fields
}
```

### Contoh Namespace Storage
```javascript
signUpData.details = {
  KTP: {
    nik: "1234567890123456",
    nama: "John Doe",
    tempat_lahir: "Jakarta",
    tanggal_lahir: "1990-01-01",
    alamat: "Jl. Sudirman No. 1",
    // ... all KTP fields
  },
  KK: {
    nomor_kk: "1234567890123456",
    nama_kepala_keluarga: "John Doe",
    anggota_keluarga: [
      { nama: "John Doe", nik: "...", ... },
      { nama: "Jane Doe", nik: "...", ... }
    ],
    // ... all KK fields
  },
  IJAZAH: {
    nomor_ijazah: "ABC123",
    nama_sekolah: "SMA Negeri 1",
    jenjang: "SMA",
    jurusan: "IPA",
    tahun_lulus: "2008",
    // ... all IJAZAH fields
  },
  STNK: {
    nomor_polisi: "B 1234 XYZ",
    nama_pemilik: "John Doe",
    merk: "Toyota",
    tipe: "Avanza",
    // ... all STNK fields
  },
  PAJAK_KENDARAAN: {
    nomor_polisi: "B 1234 XYZ",
    pkb_pokok: 1500000,
    swdkllj: 143000,
    total_bayar: 1643000,
    // ... all PAJAK fields
  },
  AWB: {
    awb_number: "123-45678901",
    shipper_name: "PT ABC",
    consignee_name: "PT XYZ",
    origin: "Jakarta",
    destination: "Singapore",
    // ... all AWB fields
  },
  INVOICE: {
    nomor_invoice: "INV-2024-001",
    tanggal_invoice: "2024-01-15",
    nama_penjual: "PT ABC",
    nama_pembeli: "PT XYZ",
    total: 10000000,
    // ... all INVOICE fields
  },
  CV: {
    nama: "John Doe",
    email: "john@example.com",
    telepon: "08123456789",
    pendidikan: [...],
    pengalaman_kerja: [...],
    // ... all CV fields
  }
}
```

### Implementasi di AuthForm.tsx
```typescript
// Initialize details object
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
  
  console.log(`✔ Document data stored in details.${docTypeForMerge}`);
}
```

### Keuntungan Namespace Storage
1. **Isolasi Data**: Setiap dokumen memiliki namespace sendiri
2. **No Data Loss**: Scan dokumen baru tidak menghapus data dokumen lain
3. **Multi-Document Support**: Bisa scan KTP, KK, IJAZAH, STNK, dll secara berurutan
4. **Easy Access**: Akses data per dokumen dengan `signUpData.details[documentType]`
5. **Validation**: Validasi per dokumen lebih mudah
6. **UI Rendering**: Render dynamic fields per dokumen type

### Workflow
```
1. User scan KTP → data masuk ke signUpData.details.KTP
2. User scan KK → data masuk ke signUpData.details.KK (KTP tetap ada)
3. User scan IJAZAH → data masuk ke signUpData.details.IJAZAH (KTP & KK tetap ada)
4. User scan STNK → data masuk ke signUpData.details.STNK (semua dokumen sebelumnya tetap ada)
5. Submit → semua data dari semua dokumen tersimpan ke database
```

---

## 🔧 UDFM Namespace Helper Edge Function

### Purpose
Helper function untuk mengelola namespace storage dengan aman. Mendukung merge, query, dan validasi data per document type.

### Endpoint
```
POST /functions/v1/supabase-functions-udfm-namespace-helper
```

### Actions

#### 1. Merge Document Data
```typescript
const { data } = await supabase.functions.invoke('supabase-functions-udfm-namespace-helper', {
  body: {
    action: 'merge',
    signUpData: currentSignUpData,
    document_type: 'KTP',
    structured_data: {
      nik: '1234567890123456',
      nama: 'John Doe',
      // ... other fields
    }
  }
});

// Response:
// {
//   success: true,
//   signUpData: { details: { KTP: {...}, KK: {...} } },
//   message: "Document data merged into details.KTP"
// }
```

#### 2. Get Scanned Document Types
```typescript
const { data } = await supabase.functions.invoke('supabase-functions-udfm-namespace-helper', {
  body: {
    action: 'get_scanned_types',
    signUpData: currentSignUpData
  }
});

// Response:
// {
//   success: true,
//   document_types: ['KTP', 'KK', 'IJAZAH']
// }
```

#### 3. Get Document Data
```typescript
const { data } = await supabase.functions.invoke('supabase-functions-udfm-namespace-helper', {
  body: {
    action: 'get_document_data',
    signUpData: currentSignUpData,
    document_type: 'KTP'
  }
});

// Response:
// {
//   success: true,
//   document_type: 'KTP',
//   data: { nik: '...', nama: '...', ... },
//   exists: true
// }
```

#### 4. Check Document Type Exists
```typescript
const { data } = await supabase.functions.invoke('supabase-functions-udfm-namespace-helper', {
  body: {
    action: 'has_document_type',
    signUpData: currentSignUpData,
    document_type: 'IJAZAH'
  }
});

// Response:
// {
//   success: true,
//   document_type: 'IJAZAH',
//   exists: true
// }
```

### Usage Example in Frontend
```typescript
// After OCR processing
const ocrResult = await supabase.functions.invoke('supabase-functions-udfm-ultra-ocr', {
  body: { ocr_text: rawText }
});

// Merge into signUpData using namespace helper
const { data: mergeResult } = await supabase.functions.invoke('supabase-functions-udfm-namespace-helper', {
  body: {
    action: 'merge',
    signUpData: currentSignUpData,
    document_type: ocrResult.data.document_type,
    structured_data: ocrResult.data.structured_data
  }
});

// Update state with merged data
setSignUpData(mergeResult.signUpData);

// Check what documents have been scanned
const { data: typesResult } = await supabase.functions.invoke('supabase-functions-udfm-namespace-helper', {
  body: {
    action: 'get_scanned_types',
    signUpData: mergeResult.signUpData
  }
});

console.log('Scanned documents:', typesResult.document_types);
// Output: ['KTP', 'KK', 'IJAZAH']
```

## 🔧 Auto-Create Columns

Jika field baru muncul dari OCR, sistem akan:
1. Mendeteksi field yang tidak ada di database
2. Memanggil `auto-create-user-fields` Edge Function
3. Membuat kolom baru di Supabase dengan tipe data yang sesuai
4. Menyimpan data ke kolom baru

## 🎨 UI Dynamic Fields

Semua field hasil OCR akan:
1. Ditambahkan ke `dynamicFields` array
2. Dirender di section "Data Dokumen (Auto-Extracted)"
3. Dapat diedit oleh user
4. Disimpan saat Submit

## 📊 Edge Functions

| Function | Version | Description |
|----------|---------|-------------|
| `hybrid-ocr-processor` | v11 | UDFM ULTRA classifier & extractor |
| `udfm-ultra-ocr` | v1 | PICA OpenAI passthrough for standardized OCR output |
| `udfm-field-normalizer` | v1 | Field normalization & canonical mapping |
| `udfm-namespace-helper` | v1 | Namespace storage helper for multi-document workflows |
| `smart-merge-with-meta` | v1 | Smart merge with metadata protection for user data |
| `udfm-global-merge` | v1 | **NEW** Complete global merge with auto-create columns |
| `auto-create-user-fields` | v20 | Auto-create database columns |
| `signup-multi-entity` | v218 | Save all OCR fields to users table |

## 🔌 UDFM ULTRA OCR Edge Function (PICA Integration)

### Endpoint
```
POST /functions/v1/supabase-functions-udfm-ultra-ocr
```

### Request Body
```json
{
  "ocr_text": "<raw OCR text from document>",
  "document_type_hint": "KTP" // optional
}
```

### Response Structure
```json
{
  "success": true,
  "document_type": "KTP",
  "jenis_dokumen": "KTP",
  "structured_data": {
    "nik": "1234567890123456",
    "nama": "John Doe",
    ...
  },
  "data": { ... },
  "fields_detected": ["nik", "nama", ...],
  "confidence_per_field": {
    "nik": 0.95,
    "nama": 0.92,
    ...
  },
  "debug_notes": "Some fields have lower confidence...",
  "raw_text": "<original OCR text>",
  "ocr_engine": "udfm_ultra_pica_openai"
}
```

### Usage in Frontend
```typescript
const { data, error } = await supabase.functions.invoke('supabase-functions-udfm-ultra-ocr', {
  body: { 
    ocr_text: rawOcrText,
    document_type_hint: 'IJAZAH' // optional
  }
});

if (data.success) {
  console.log('Document type:', data.document_type);
  console.log('Extracted data:', data.structured_data);
  console.log('Confidence:', data.confidence_per_field);
}
```

---

## 🔄 UDFM Field Normalizer Edge Function

### Purpose
Normalizes all keys to `snake_case` and maps them to canonical field names for consistent data handling.

### Endpoint
```
POST /functions/v1/supabase-functions-udfm-field-normalizer
```

### Request Body
```json
{
  "structured_data": {
    "nik": "1234567890123456",
    "nama": "John Doe",
    "tempat_lahir": "Jakarta",
    ...
  },
  "existingData": {} // optional - existing user data to preserve
}
```

### Response Structure
```json
{
  "success": true,
  "signUpData": {
    "ktpNumber": "1234567890123456",
    "fullName": "John Doe",
    "placeOfBirth": "Jakarta",
    ...
  },
  "dynamicFields": {
    "custom_field_1": "value1",
    "custom_field_2": "value2"
  },
  "stats": {
    "totalInputFields": 15,
    "canonicalFieldsMapped": 12,
    "dynamicFieldsPreserved": 3
  }
}
```

### Canonical Mapping Examples
```
nik, no_ktp, nomor_ktp → ktpNumber
nama, nama_lengkap → fullName
tempat_lahir, birth_place → placeOfBirth
tanggal_lahir, tgl_lahir → dateOfBirth
alamat, alamat_ktp → address
nomor_kk, no_kk → familyCardNumber
jurusan, program_studi → major
tahun_lulus → graduationYear
nomor_ijazah → ijazahNumber
nomor_polisi → plateNumber
awb_number → awbNumber
```

### Usage in Frontend
```typescript
// Step 1: Get OCR data from UDFM ULTRA OCR
const ocrResponse = await supabase.functions.invoke('supabase-functions-udfm-ultra-ocr', {
  body: { ocr_text: rawOcrText }
});

// Step 2: Normalize and map fields
const { data: normalizedData } = await supabase.functions.invoke('supabase-functions-udfm-field-normalizer', {
  body: { 
    structured_data: ocrResponse.data.structured_data,
    existingData: currentSignUpData // optional
  }
});

// Step 3: Use normalized data
console.log('Canonical fields:', normalizedData.signUpData);
console.log('Dynamic fields:', normalizedData.dynamicFields);

// Merge into signUpData
const updatedSignUpData = {
  ...currentSignUpData,
  ...normalizedData.signUpData
};
```

### Behavior
- **Normalization**: Converts all keys to `snake_case` (e.g., `NamaLengkap` → `nama_lengkap`)
- **Canonical Mapping**: Maps normalized keys to canonical field names (e.g., `nama_lengkap` → `fullName`)
- **Dynamic Fields**: Preserves unmapped keys in `dynamicFields` for flexibility
- **Data Preservation**: If `existingData` is provided, avoids overwriting existing high-confidence data
- **Recursive Processing**: Handles nested objects and arrays automatically

---

## 🛡️ Smart Merge With Meta (User Data Protection)

### Purpose
Protects user-edited data from being overwritten by OCR while allowing intelligent updates based on confidence levels.

### Metadata Structure
```typescript
interface FieldMeta {
  source: "user" | "ocr";
  document_type: string;
  confidence: number; // 0-1
  last_updated_at: string; // ISO string
}

// Example:
signUpMeta = {
  "nik": {
    "source": "user",
    "document_type": "KTP",
    "confidence": 1.0,
    "last_updated_at": "2025-02-01T12:00:00Z"
  },
  "nama": {
    "source": "ocr",
    "document_type": "KTP",
    "confidence": 0.95,
    "last_updated_at": "2025-02-01T12:00:00Z"
  }
}
```

### Merge Rules

1. **User Data Protection**: If `source = "user"` → NEVER overwrite
2. **Empty Value Rejection**: If new value is `null`, `""`, or `undefined` → ignore
3. **New Field Addition**: If no old value exists → use new value
4. **Confidence-Based Update**: If old value from OCR → only overwrite if `new confidence > old confidence`

### Endpoint
```
POST /functions/v1/supabase-functions-smart-merge-with-meta
```

### Request Body
```json
{
  "oldData": {
    "nik": "1234567890123456",
    "nama": "John Doe",
    "alamat": "123 Old St"
  },
  "oldMeta": {
    "nik": {
      "source": "user",
      "document_type": "KTP",
      "confidence": 1.0,
      "last_updated_at": "2025-01-01T12:00:00Z"
    },
    "nama": {
      "source": "ocr",
      "document_type": "KTP",
      "confidence": 0.7,
      "last_updated_at": "2025-01-01T12:00:00Z"
    },
    "alamat": {
      "source": "ocr",
      "document_type": "KTP",
      "confidence": 0.5,
      "last_updated_at": "2025-01-01T12:00:00Z"
    }
  },
  "newData": {
    "nik": "9999999999999999",
    "nama": "Johnathan Doe",
    "alamat": "123 New St",
    "email": "john@example.com"
  },
  "newMeta": {
    "nik": {
      "source": "ocr",
      "document_type": "KTP",
      "confidence": 0.9,
      "last_updated_at": "2025-02-01T12:00:00Z"
    },
    "nama": {
      "source": "ocr",
      "document_type": "KTP",
      "confidence": 0.9,
      "last_updated_at": "2025-02-01T12:00:00Z"
    },
    "alamat": {
      "source": "ocr",
      "document_type": "KTP",
      "confidence": 0.9,
      "last_updated_at": "2025-02-01T12:00:00Z"
    },
    "email": {
      "source": "ocr",
      "document_type": "KTP",
      "confidence": 0.95,
      "last_updated_at": "2025-02-01T12:00:00Z"
    }
  },
  "documentType": "KTP"
}
```

### Response
```json
{
  "success": true,
  "mergedData": {
    "nik": "1234567890123456",
    "nama": "Johnathan Doe",
    "alamat": "123 New St",
    "email": "john@example.com"
  },
  "mergedMeta": {
    "nik": {
      "source": "user",
      "document_type": "KTP",
      "confidence": 1.0,
      "last_updated_at": "2025-01-01T12:00:00Z"
    },
    "nama": {
      "source": "ocr",
      "document_type": "KTP",
      "confidence": 0.9,
      "last_updated_at": "2025-02-01T12:00:00Z"
    },
    "alamat": {
      "source": "ocr",
      "document_type": "KTP",
      "confidence": 0.9,
      "last_updated_at": "2025-02-01T12:00:00Z"
    },
    "email": {
      "source": "ocr",
      "document_type": "KTP",
      "confidence": 0.95,
      "last_updated_at": "2025-02-01T12:00:00Z"
    }
  },
  "stats": {
    "totalFields": 4,
    "newFields": 1,
    "updatedFields": 2,
    "protectedFields": 1
  },
  "documentType": "KTP"
}
```

### Usage Example
```typescript
// After OCR extraction
const ocrResult = await supabase.functions.invoke('supabase-functions-udfm-ultra-ocr', {
  body: { ocr_text: rawText }
});

// Smart merge with existing data
const { data: mergeResult } = await supabase.functions.invoke('supabase-functions-smart-merge-with-meta', {
  body: {
    oldData: currentSignUpData,
    oldMeta: currentSignUpMeta,
    newData: ocrResult.data.structured_data,
    newMeta: ocrResult.data.confidence_per_field,
    documentType: ocrResult.data.document_type
  }
});

// Update state with protected merge
setSignUpData(mergeResult.mergedData);
setSignUpMeta(mergeResult.mergedMeta);

console.log('Protected fields:', mergeResult.stats.protectedFields);
console.log('Updated fields:', mergeResult.stats.updatedFields);
```

### Database Storage
```sql
-- users table now has field_meta column
ALTER TABLE users ADD COLUMN field_meta JSONB DEFAULT '{}';

-- Example storage:
{
  "nik": {
    "source": "user",
    "document_type": "KTP",
    "confidence": 1.0,
    "last_updated_at": "2025-02-01T12:00:00Z"
  },
  "nama": {
    "source": "ocr",
    "document_type": "KTP",
    "confidence": 0.95,
    "last_updated_at": "2025-02-01T12:00:00Z"
  }
}
```

### Benefits
```
✓ User-edited data is NEVER overwritten by OCR
✓ OCR can update fields with higher confidence
✓ Empty/null values are rejected automatically
✓ Full audit trail with source, confidence, and timestamp
✓ Per-field metadata tracking
✓ Intelligent merge based on data quality
```

---

## ✅ Hasil

```
✓ Scan KTP → data muncul
✓ Scan KK → data muncul tanpa menghapus KTP
✓ Scan IJAZAH → data muncul tanpa menghapus KTP/KK
✓ Scan NPWP → data muncul tanpa menghapus dokumen lain
✓ Scan SIM → data muncul tanpa menghapus dokumen lain
✓ Scan STNK → data muncul tanpa menghapus dokumen lain
✓ Scan AWB → data muncul tanpa menghapus dokumen lain
✓ Scan INVOICE → data muncul tanpa menghapus dokumen lain
✓ Scan CV → data muncul tanpa menghapus dokumen lain
✓ Field tetap lengkap sampai user melakukan Submit
✓ Semua field editable di UI
✓ Auto-create kolom di Supabase untuk field baru
✓ User-edited data PROTECTED from OCR overwrites
✓ Confidence-based intelligent updates
✓ Full metadata tracking per field
```

---

## 🔄 Workflow Routing (UDFM v3)

### Purpose
Setelah document_type & structured_data didapat, sistem menampilkan saran workflow berdasarkan dokumen yang sudah di-scan.

### Workflow Suggestions

| Document Type(s) | Workflow Type | Label |
|------------------|---------------|-------|
| INVOICE | `create_purchase_transaction` | Buat transaksi pembelian / jurnal akuntansi dari invoice ini |
| STNK / PAJAK_KENDARAAN | `create_vehicle_asset` | Tambah kendaraan ke master asset / jadwalkan pengingat pajak |
| KTP + KK | `create_employee_master` | Buat master data karyawan/customer baru |
| KTP | `create_customer_master` | Buat master data customer dari KTP |
| AWB | `create_shipment` | Buat data shipment / tracking order |
| IJAZAH + CV | `create_candidate_profile` | Buat profil kandidat / karyawan |
| IJAZAH | `add_education_data` | Tambah data pendidikan ke profil |
| NPWP | `add_tax_data` | Tambah data pajak ke profil |
| SIM | `add_driver_license` | Tambah data SIM ke profil driver |
| BPJS | `add_insurance_data` | Tambah data BPJS ke profil karyawan |

### Response Format
```json
{
  "workflow_suggestions": [
    {
      "type": "create_employee_master",
      "label": "Buat master data karyawan dari KTP + KK",
      "document_types_required": ["KTP", "KK"],
      "icon": "👤"
    },
    {
      "type": "add_education_data",
      "label": "Tambah data pendidikan ke profil",
      "document_types_required": ["IJAZAH"],
      "icon": "🎓"
    }
  ]
}
```

### UI Implementation
```tsx
// State for workflow suggestions
const [workflowSuggestions, setWorkflowSuggestions] = useState<{
  type: string;
  label: string;
  document_types_required: string[];
  icon?: string;
}[]>([]);

// Track scanned document types
const [scannedDocTypes, setScannedDocTypes] = useState<Set<string>>(new Set());

// Render workflow suggestions
{workflowSuggestions.length > 0 && (
  <div className="space-y-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
    <h3 className="text-sm font-medium text-amber-700">
      💡 Workflow Suggestions ({workflowSuggestions.length})
    </h3>
    <div className="space-y-2">
      {workflowSuggestions.map((suggestion, idx) => (
        <div 
          key={idx}
          className="flex items-center gap-2 p-2 bg-white rounded border border-amber-200 hover:bg-amber-100 cursor-pointer"
          onClick={() => handleWorkflow(suggestion.type)}
        >
          <span className="text-lg">{suggestion.icon}</span>
          <div className="flex-1">
            <p className="text-sm">{suggestion.label}</p>
            <p className="text-xs text-slate-500">
              Dokumen: {suggestion.document_types_required.join(" + ")}
            </p>
          </div>
          <span className="text-amber-500">→</span>
        </div>
      ))}
    </div>
  </div>
)}
```

### Workflow Icons
```
📄 INVOICE → create_purchase_transaction
🚗 STNK/PAJAK_KENDARAAN → create_vehicle_asset
👤 KTP/KK → create_employee_master / create_customer_master
📦 AWB → create_shipment
📋 IJAZAH+CV → create_candidate_profile
🎓 IJAZAH → add_education_data
📊 NPWP → add_tax_data
🪪 SIM → add_driver_license
🏥 BPJS → add_insurance_data
```

---

## 🔒 Prinsip Keamanan Data

### Rules
1. **Jangan mengarang data sensitif**: NIK, NPWP, nomor dokumen harus dari OCR
2. **Jika tidak yakin**: Set `null` dan jelaskan di `debug_notes`
3. **Jangan timpa edit manual user**: `source: "user"` → PROTECTED
4. **Jangan hapus data dokumen lama**: Multi-document workflow harus preserve semua data

### Implementation
```typescript
// Rule 1: Never fabricate sensitive data
if (!isValidNIK(nik)) {
  result.nik = null;
  result.debug_notes.push("NIK tidak valid, set null untuk keamanan");
}

// Rule 2: Set null if uncertain
if (confidence < 0.5) {
  result[field] = null;
  result.debug_notes.push(`${field} confidence rendah (${confidence}), set null`);
}

// Rule 3: Never overwrite user edits
if (signUpMeta[field]?.source === "user") {
  console.log(`⊗ PROTECTED [${field}]: User-edited field`);
  continue; // Skip this field
}

// Rule 4: Preserve data from other documents
setSignUpData(prev => smartMerge(prev, newData)); // Merge, don't replace
```

### Sensitive Fields
```
NIK (16 digit)
NPWP (15 digit)
Nomor KK (16 digit)
Nomor SIM
Nomor Paspor
Nomor Rekening
Nomor Kartu Kredit
```

### Debug Notes Example
```json
{
  "debug_notes": [
    "NIK tidak lengkap (hanya 14 digit), set null",
    "Nama tidak terbaca jelas, confidence 0.3",
    "Alamat terpotong, hanya sebagian yang terdeteksi"
  ]
}

---

## 🎨 UI Rendering (Dynamic Fields)

### Overview
The AuthForm.tsx component renders dynamic OCR fields with source badges and user edit protection.

### Features
1. **Standard Fields**: email, password, nama, phone, dll.
2. **Dynamic Fields Section**: "Data Dokumen (Auto-Extracted)"
3. **Source Badges**: Visual indicators showing field origin
4. **User Edit Protection**: Fields edited by user are marked and protected

### Source Badge Colors
```
[KTP]    → Green   (bg-green-100 text-green-700)
[KK]     → Orange  (bg-orange-100 text-orange-700)
[IJAZAH] → Blue    (bg-blue-100 text-blue-700)
[STNK]   → Red     (bg-red-100 text-red-700)
[SIM]    → Yellow  (bg-yellow-100 text-yellow-700)
[NPWP]   → Indigo  (bg-indigo-100 text-indigo-700)
[AWB]    → Cyan    (bg-cyan-100 text-cyan-700)
[U]      → Purple  (bg-purple-100 text-purple-700) - User Edited
```

### Implementation
```tsx
// State for metadata tracking
const [signUpMeta, setSignUpMeta] = useState<Record<string, {
  source: "user" | "ocr";
  document_type: string;
  confidence: number;
  last_updated_at: string;
}>>({});

// Render dynamic fields with source badges
{dynamicFields.map((field) => {
  const meta = signUpMeta[field.name];
  const isUserEdited = meta?.source === "user";
  const docType = meta?.document_type || "";
  
  return (
    <div key={field.name}>
      <Label>
        {field.label}
        {/* Source Badge */}
        {isUserEdited ? (
          <span className="bg-purple-100 text-purple-700">[U]</span>
        ) : docType ? (
          <span className={getDocTypeBadgeClass(docType)}>[{docType}]</span>
        ) : (
          <span>(editable)</span>
        )}
      </Label>
      <Input
        value={signUpData[field.name] ?? field.value ?? ''}
        onChange={(e) => {
          setSignUpData({ ...signUpData, [field.name]: e.target.value });
          // Mark as user-edited
          setSignUpMeta(prev => ({
            ...prev,
            [field.name]: {
              source: "user",
              document_type: prev[field.name]?.document_type || "",
              confidence: 1.0,
              last_updated_at: new Date().toISOString()
            }
          }));
        }}
        className={isUserEdited ? 'border-purple-300' : 'border-blue-200'}
      />
    </div>
  );
})}
```

### User Edit Protection Flow
```
1. User scans KTP → field "nama" gets meta: { source: "ocr", document_type: "KTP" }
2. User edits "nama" manually → meta changes to: { source: "user", document_type: "KTP" }
3. User scans KK → "nama" is PROTECTED because source = "user"
4. Badge shows [U] instead of [KTP] to indicate user edit
5. Border color changes to purple to highlight user-edited fields
```

### JSON/JSONB Fields
```tsx
// Complex data like anggota_keluarga is rendered as JSON
{field.type === 'json' || field.type === 'jsonb' ? (
  <div className="bg-white border rounded-md p-2 max-h-40 overflow-auto">
    <pre className="text-xs whitespace-pre-wrap">
      {JSON.stringify(signUpData[field.name] ?? field.value, null, 2)}
    </pre>
  </div>
) : (
  <Input ... />
)}
```

### Benefits
```
✓ Visual indication of field source (KTP, KK, IJAZAH, etc.)
✓ User-edited fields clearly marked with [U] badge
✓ Purple border for user-edited fields
✓ All fields editable by user
✓ JSON/JSONB fields displayed as formatted JSON
✓ Responsive grid layout (2 columns)
✓ Full-width for JSON fields (col-span-2)
```

---

## 🌐 UDFM Global Merge Edge Function (Complete Solution)

### Purpose
All-in-one Edge Function that combines:
1. Field normalization (raw → snake_case)
2. Canonical mapping (snake_case → canonical field names)
3. Smart merge with metadata protection
4. Namespace storage per document type
5. Auto-create Supabase columns for new fields

### Endpoint
```
POST /functions/v1/supabase-functions-udfm-global-merge
```

### Request Body
```json
{
  "structured_data": {
    "nik": "1234567890123456",
    "nama": "John Doe",
    "tempat_lahir": "Jakarta",
    "tanggal_lahir": "1990-01-01",
    "alamat": "Jl. Sudirman No. 1",
    "anggota_keluarga": [...]
  },
  "confidence_per_field": {
    "nik": 0.95,
    "nama": 0.92,
    "tempat_lahir": 0.88
  },
  "document_type": "KTP",
  "signUpData": { ... },
  "signUpMeta": { ... },
  "autoCreateColumns": true
}
```

### Response
```json
{
  "success": true,
  "signUpData": {
    "ktpNumber": "1234567890123456",
    "fullName": "John Doe",
    "placeOfBirth": "Jakarta",
    "dateOfBirth": "1990-01-01",
    "address": "Jl. Sudirman No. 1",
    "details": {
      "KTP": { ... original structured_data ... }
    }
  },
  "signUpMeta": {
    "ktpNumber": {
      "source": "ocr",
      "document_type": "KTP",
      "confidence": 0.95,
      "last_updated_at": "2025-02-01T12:00:00Z"
    },
    ...
  },
  "dynamicFields": {
    "custom_field_1": "value1"
  },
  "newFields": ["ktpNumber", "fullName", "placeOfBirth"],
  "columnsCreated": ["ktp_number", "full_name", "place_of_birth"],
  "stats": {
    "totalInputFields": 15,
    "canonicalFieldsMapped": 12,
    "dynamicFieldsPreserved": 3,
    "totalMergedFields": 15,
    "newFieldsDetected": 5,
    "columnsCreated": 5,
    "protectedFields": 2
  },
  "documentType": "KTP"
}
```

### Canonical Mapping (100+ rules)
```
KTP:
  nik, no_ktp, nomor_ktp → ktpNumber
  nama, nama_lengkap → fullName
  tempat_lahir → placeOfBirth
  tanggal_lahir → dateOfBirth
  alamat → address
  jenis_kelamin → gender
  agama → religion
  status_perkawinan → maritalStatus
  pekerjaan → occupation

KK:
  nomor_kk → familyCardNumber
  nama_kepala_keluarga → familyHeadName
  anggota_keluarga → kkMembers (JSONB)
  kelurahan_desa → kelurahanDesa
  kecamatan → district
  kabupaten_kota → city
  provinsi → province

IJAZAH:
  nomor_ijazah → ijazahNumber
  nama_sekolah → schoolName
  jurusan, program_studi → major
  tahun_lulus → graduationYear
  jenjang → educationLevel
  ipk → gpa
  gelar → degree

STNK:
  nomor_polisi → plateNumber
  nama_pemilik → ownerName
  merk → vehicleBrand
  tipe → vehicleType
  nomor_rangka → chassisNumber
  nomor_mesin → engineNumber

AWB:
  awb_number → awbNumber
  shipper_name → shipperName
  consignee_name → consigneeName
  origin → origin
  destination → destination
```

### JSONB Fields (Auto-detected)
```
kkMembers, anggota_keluarga → JSONB
educationHistory, pendidikan → JSONB
workExperience, pengalaman_kerja → JSONB
skills, keahlian → JSONB
languages, bahasa → JSONB
certifications, sertifikasi → JSONB
invoiceItems, items → JSONB
rawOcr → JSONB
details → JSONB
```

### Auto-Create Column Types
```
Array/Object → JSONB
Number (integer) → INTEGER
Number (decimal) → NUMERIC
Boolean → BOOLEAN
String → TEXT (default)
```

### Usage Example
```typescript
// After OCR extraction
const ocrResult = await supabase.functions.invoke('supabase-functions-udfm-ultra-ocr', {
  body: { ocr_text: rawText }
});

// Global merge with auto-create columns
const { data: mergeResult } = await supabase.functions.invoke('supabase-functions-udfm-global-merge', {
  body: {
    structured_data: ocrResult.data.structured_data,
    confidence_per_field: ocrResult.data.confidence_per_field,
    document_type: ocrResult.data.document_type,
    signUpData: currentSignUpData,
    signUpMeta: currentSignUpMeta,
    autoCreateColumns: true
  }
});

// Update state
setSignUpData(mergeResult.signUpData);
setSignUpMeta(mergeResult.signUpMeta);

console.log('New columns created:', mergeResult.columnsCreated);
console.log('Protected fields:', mergeResult.stats.protectedFields);
```

### Multi-Document Workflow
```
1. Scan KTP:
   - ktpNumber, fullName, address, dateOfBirth → signUpData
   - details.KTP → full structured_data
   - Columns created: ktp_number, full_name, address, date_of_birth

2. Scan KK:
   - familyCardNumber, familyHeadName, kkMembers → signUpData
   - details.KK → full structured_data
   - KTP data PRESERVED
   - Columns created: family_card_number, family_head_name, kk_members (JSONB)

3. Scan IJAZAH:
   - ijazahNumber, schoolName, major, graduationYear → signUpData
   - details.IJAZAH → full structured_data
   - KTP + KK data PRESERVED
   - Columns created: ijazah_number, school_name, major, graduation_year

4. User edits fullName manually:
   - signUpMeta.fullName.source = "user"
   - Future OCR scans will NOT overwrite fullName

5. Submit:
   - All data saved to users table
   - All columns exist (auto-created)
   - field_meta saved for audit trail
```

### Benefits
```
✓ Single API call for complete OCR → signUpData flow
✓ Automatic field normalization and canonical mapping
✓ Smart merge with user data protection
✓ Namespace storage for multi-document support
✓ Auto-create columns with correct types
✓ JSONB for arrays and complex objects
✓ Full metadata tracking per field
✓ No data loss between document scans
```
