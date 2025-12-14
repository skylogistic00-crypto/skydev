# OCR Scanner Integration Guide

## ✅ Completed Implementation

### 1. Reusable OCR Scanner Component
**Location:** `src/components/OCRScanner/index.tsx`

A fully reusable React component that handles:
- File upload with validation (image files only, max 10MB)
- Image preview
- OCR processing via Supabase Edge Function
- Result callback to parent component

**Props:**
```typescript
interface OCRScannerProps {
  onResult: (data: OCRResult) => void;  // Callback with extracted data
  buttonText?: string;                   // Custom button text
  buttonVariant?: "default" | "outline" | "ghost" | "secondary";
  showPreview?: boolean;                 // Show/hide image preview
}

interface OCRResult {
  nominal: number;        // Extracted amount
  tanggal: string;        // Date in YYYY-MM-DD format
  deskripsi: string;      // Description/merchant name
  extractedText?: string; // Full OCR text
}
```

**Usage Example:**
```tsx
import OCRScanner from "@/components/OCRScanner";

<OCRScanner
  onResult={(data) => {
    setNominal(data.nominal.toString());
    setTanggal(data.tanggal);
    setDescription(data.deskripsi);
  }}
  buttonText="📷 Upload & Scan Receipt"
  buttonVariant="default"
  showPreview={true}
/>
```

---

### 2. Edge Function for Google Vision OCR
**Location:** `supabase/functions/ocr-google-vision/index.ts`

**Endpoint:** `supabase-functions-ocr-google-vision`

**Request:**
```json
{
  "file_base64": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "nominal": 150000,
  "tanggal": "2024-01-15",
  "deskripsi": "STARBUCKS COFFEE",
  "extractedText": "Full OCR text..."
}
```

**Features:**
- Calls Google Vision API for text detection
- Parses extracted text to find:
  - **Nominal:** Currency amounts (Rp, IDR, Total, etc.)
  - **Tanggal:** Dates in various formats (DD/MM/YYYY, YYYY-MM-DD)
  - **Deskripsi:** Merchant/store name from receipt
- Returns structured JSON data
- Handles errors gracefully

**Parsing Logic:**
- **Nominal:** Searches for patterns like "Total: Rp 100.000", "IDR 100000", etc.
- **Tanggal:** Converts dates to YYYY-MM-DD format
- **Deskripsi:** Extracts merchant name from first few lines (usually in caps)

---

### 3. Integration with Transaksi Keuangan Form
**Location:** `src/components/TransaksiKeuanganForm.tsx`

The OCR Scanner has been integrated into the transaction form:
- Positioned before the "Nominal + Date" section
- Styled with blue gradient background for visibility
- Auto-fills form fields when OCR completes:
  - `nominal` → Nominal field
  - `tanggal` → Tanggal field
  - `deskripsi` → Deskripsi field
- Shows success toast with extracted data

---

## 🚀 How to Use

### In Transaksi Keuangan Form:
1. Navigate to the transaction form
2. Scroll to the "Scan Receipt dengan OCR" section
3. Click "📷 Upload & Scan Receipt"
4. Select a receipt image
5. Preview the image
6. Click "Process OCR"
7. Wait for processing (shows loading spinner)
8. Form fields are automatically filled
9. Review and adjust data if needed
10. Submit transaction

---

## 🔧 Technical Details

### Environment Variables Required:
- `VITE_GOOGLE_VISION_API_KEY` - Google Vision API key (already configured)

### Dependencies:
- Google Vision API
- Supabase Edge Functions
- React hooks (useState, useRef)
- shadcn/ui components (Button, Label, Toast)

### File Upload:
- Accepts: `image/*`
- Max size: 10MB
- Converts to base64 before sending to edge function

### Error Handling:
- File type validation
- File size validation
- API error handling
- User-friendly error messages via toast

---

## 📊 OCR Parsing Patterns

### Nominal Detection:
```regex
/(?:total|jumlah|amount|bayar|grand\s*total|harga\s*jual)[:\s]*(?:rp\.?|idr)?\s*([\d.,]+)/i
/(?:rp\.?|idr)\s*([\d.,]+)/i
/(\d{1,3}(?:[.,]\d{3})+)/g
```

### Date Detection:
```regex
/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/  // DD/MM/YYYY
/(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/  // YYYY-MM-DD
```

### Description Detection:
- Looks for merchant name in first 5 lines
- Filters out numbers and dates
- Prefers lines with capital letters
- Falls back to first non-empty line

---

## 🎯 Benefits

1. **Reusable Component:** Can be used in any form across the application
2. **Automatic Data Entry:** Reduces manual typing errors
3. **Time Saving:** Faster transaction entry
4. **Flexible:** Customizable button text, variant, and preview
5. **User Friendly:** Clear feedback with loading states and error messages
6. **Accurate:** Uses Google Vision API for high-quality OCR

---

## 🧪 Testing

### Test with Demo Storyboard:
A demo storyboard has been created to test the OCR Scanner component in isolation.

**Location:** Canvas → "OCRScannerDemo" storyboard

**Features:**
- Upload and scan receipts
- View extracted data
- See raw OCR text
- Test different receipt formats

---

## 📝 Future Enhancements

Potential improvements:
1. Support for multiple languages
2. Better parsing for itemized receipts
3. Tax/PPN extraction
4. Merchant database matching
5. Receipt template recognition
6. Batch processing for multiple receipts

---

## ✅ Deployment Status

- ✅ OCR Scanner component created
- ✅ Edge function deployed
- ✅ Integrated into Transaksi Keuangan form
- ✅ Demo storyboard created
- ✅ Documentation completed

**Ready to use!** 🎉
