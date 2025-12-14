# Fitur Scan OCR - Finance Transactions

## ✅ Fitur Baru Ditambahkan

### Tombol "Scan OCR"
- **Lokasi**: Halaman `/finance/transactions/new` (kanan atas, sebelah header)
- **Fungsi**: Membuka modal OCR Scanner untuk upload dan proses gambar receipt

### Modal OCR Scanner
- Upload gambar receipt
- Preview gambar
- Proses OCR otomatis
- Auto-fill form fields

## 🎯 Cara Menggunakan

### 1. Buka Halaman Form
```
/finance/transactions/new
```

### 2. Klik Tombol "Scan OCR"
- Tombol biru dengan icon ScanLine
- Terletak di kanan atas, sebelah judul halaman

### 3. Upload Gambar di Modal
- Klik area upload atau "Change Image"
- Pilih file gambar receipt (JPG, PNG, dll)
- Preview akan muncul

### 4. Klik "Process OCR"
- Tombol biru "Process OCR"
- Tunggu proses OCR selesai
- Modal akan tertutup otomatis

### 5. Form Auto-Filled
Form akan terisi otomatis dengan data:
- ✅ **Merchant** → dari OCR (nama toko/merchant)
- ✅ **Description** → dari OCR (extracted text, max 200 char)
- ✅ **Date** → tanggal hari ini
- ✅ **Amount** → dari OCR (total nominal)
- ✅ **PPN** → auto-calculated (10%)
- ✅ **Total** → auto-calculated (amount + ppn)
- ✅ **Breakdown Items** → dari OCR (qty, price, subtotal)

### 6. Review & Save
- Review data yang sudah di-fill
- Edit jika perlu
- Klik "Save Transaction"

## 📊 Mapping Data OCR

### Dari OCR Parser (ocrParser.ts)
```
parsed.nama → formData.merchant
fullText → formData.description (max 200 char)
```

### Dari Finance Parser (FinanceOCRParser.ts)
```
financeParsed.total → formData.amount
financeParsed.ppn → formData.ppn
financeParsed.total + ppn → formData.total
financeParsed.breakdown → breakdownItems[]
```

## 🔄 Data Flow

```
1. User klik "Scan OCR"
   ↓
2. Modal terbuka
   ↓
3. User upload gambar
   ↓
4. User klik "Process OCR"
   ↓
5. Edge function "vision-google-ocr" memproses
   ↓
6. Google Vision API ekstrak teks
   ↓
7. Parse dengan ocrParser.ts (merchant, nama)
   ↓
8. Parse dengan FinanceOCRParser.ts (amount, ppn, breakdown)
   ↓
9. Form auto-filled ✅
   ↓
10. File upload ke storage "finance-documents"
   ↓
11. Modal tertutup
   ↓
12. User review & save
```

## 🎨 UI Changes

### Header Section
```
┌─────────────────────────────────────────────────────┐
│  ← New Finance Transaction    [Scan OCR] ◄─ BARU   │
│     Create a new expense transaction                │
└─────────────────────────────────────────────────────┘
```

### Modal OCR Scanner
```
┌─────────────────────────────────────────────────────┐
│  Scan OCR - Upload Receipt                          │
│  Upload gambar receipt untuk ekstrak data otomatis  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  📤 Click to upload receipt image           │   │
│  │  (atau preview gambar jika sudah upload)    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│                    [Cancel] [Process OCR]           │
└─────────────────────────────────────────────────────┘
```

## 📁 Files Modified

### src/components/FinanceTransactionsPage.tsx
**Changes:**
- ✅ Import `ScanLine` icon dari lucide-react
- ✅ Import `Dialog` components
- ✅ Import `parseOCR` dari ocrParser.ts
- ✅ Added state: `showOCRModal`, `ocrFile`, `ocrFilePreview`
- ✅ Added function: `handleOCRFileChange()`
- ✅ Added function: `handleScanOCR()`
- ✅ Added button: "Scan OCR" di header
- ✅ Added modal: OCR Scanner Dialog

## 🔗 Dependencies

### Edge Functions
- ✅ `vision-google-ocr` (sudah ada)

### Parsers
- ✅ `ocrParser.ts` (sudah ada)
- ✅ `FinanceOCRParser.ts` (sudah ada)

### Storage
- ✅ `finance-documents` bucket (sudah ada)

### UI Components
- ✅ Dialog (shadcn)
- ✅ Button (shadcn)
- ✅ Icons (lucide-react)

## ✅ Ready to Use!

**Fitur sudah siap digunakan:**
1. Buka `/finance/transactions/new`
2. Klik tombol "Scan OCR" (kanan atas)
3. Upload gambar receipt
4. Klik "Process OCR"
5. Form auto-filled ✅
6. Save transaction

**Selamat menggunakan! 🎉**
