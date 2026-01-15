# Tax Extraction AI System

## Overview

The Tax Extraction AI is an intelligent system that automatically extracts tax information from OCR text of invoices and Faktur Pajak (Coretax) documents. It uses OpenAI GPT-4o to intelligently parse documents and fill tax-related fields in bank mutations.

## Key Features

- ✅ **Automatic Tax Extraction** from OCR text
- ✅ **Coretax Faktur Pajak Support** (reads DPP, PPN, Nomor Faktur)
- ✅ **Commercial Invoice Support** (treats total as DPP)
- ✅ **Withholding Tax Detection** (PPh calculation)
- ✅ **Non-Intrusive** (never changes accounting categories or accounts)
- ✅ **Visual UI** with modal and demo page

---

## Architecture

### 1. Database Fields (bank_mutations table)

New fields added via migration `20260114_add_tax_fields_to_bank_mutations.sql`:

```sql
- invoice_id TEXT
- invoice_number TEXT
- dpp_amount DECIMAL(18,2)    -- Dasar Pengenaan Pajak (Tax Base)
- ppn_amount DECIMAL(18,2)    -- PPN (VAT)
- pph_amount DECIMAL(18,2)    -- PPh (Withholding Tax)
- gross_amount DECIMAL(18,2)  -- Total Amount Including Taxes
- tax_extraction_status TEXT  -- pending, extracted, manual, failed
- tax_extraction_confidence DECIMAL(5,2)
- tax_extraction_timestamp TIMESTAMPTZ
- tax_document_type TEXT      -- coretax_faktur, commercial_invoice, etc.
```

### 2. Edge Function

**Location:** `supabase/functions/tax-extraction-ai/index.ts`

**Endpoint:** `POST /functions/v1/tax-extraction-ai`

**Request Body:**
```json
{
  "bank_mutation_id": "uuid",
  "ocr_text": "OCR text from invoice/faktur"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tax data extracted successfully",
  "data": {
    "invoice_id": "010.002-24.12345678",
    "dpp_amount": 10000000,
    "ppn_amount": 1100000,
    "pph_amount": 0,
    "gross_amount": 11100000
  }
}
```

### 3. React Components

#### TaxExtractionModal (`src/components/TaxExtractionModal.tsx`)
- Modal dialog for extracting tax from a bank mutation
- Shows OCR text preview
- Displays extracted tax data
- Used in BankMutationsManagement

#### TaxExtractionDemo (`src/components/TaxExtractionDemo.tsx`)
- Standalone demo page
- Sample documents for testing
- Live extraction demonstration
- Educational UI showing how it works

---

## How It Works

### AI Extraction Rules

The AI follows these rules (defined in the system prompt):

#### 1. Coretax Faktur Pajak
```
Input: Faktur Pajak with "Dasar Pengenaan Pajak", "PPN", "Total"
Output:
  - dpp_amount = Dasar Pengenaan Pajak
  - ppn_amount = PPN value
  - gross_amount = Total
  - invoice_id = Nomor Faktur Pajak
```

#### 2. Commercial Invoice (No Tax)
```
Input: Regular invoice without tax information
Output:
  - dpp_amount = bank_mutation.amount
  - ppn_amount = 0
  - pph_amount = 0
  - gross_amount = bank_mutation.amount
  - invoice_id = invoice number (if found)
```

#### 3. Withholding Tax Detection
```
If bank_mutation.amount < gross_amount:
  pph_amount = gross_amount - bank_mutation.amount
```

**Example:**
- Gross Amount (Invoice): Rp 22,200,000
- Bank Amount (Received): Rp 21,800,000
- PPh Withheld: Rp 400,000 (automatically calculated)

---

## Usage Guide

### In Bank Mutations Management

1. Navigate to Bank Mutations page
2. Find a mutation with OCR text
3. Click the purple **FileText icon** in the Action column
4. Tax Extraction Modal opens
5. Click "Extract Tax Information"
6. Review the extracted data
7. Data is automatically saved to the mutation

**Visual Indicator:**
- Purple FileText icon = OCR text available
- Green CheckCircle badge = Tax already extracted

### Using the Demo Page

1. Go to the Tax Extraction Demo storyboard
2. Choose a sample document (Coretax, Commercial, Withholding)
3. Or paste your own OCR text
4. Enter the bank amount
5. Click "Extract Tax Information"
6. See the results instantly

---

## Integration Points

### BankMutationsManagement.tsx
```tsx
// Import
import { TaxExtractionModal } from "./TaxExtractionModal";

// State
const [taxExtractionModal, setTaxExtractionModal] = useState({
  open: false,
  bankMutationId: "",
  ocrText: "",
});

// Button in table (Action column)
{row.ocr_text && (
  <Button
    onClick={() => 
      setTaxExtractionModal({
        open: true,
        bankMutationId: row.id,
        ocrText: row.ocr_text || "",
      })
    }
  >
    <FileText className="h-4 w-4 text-purple-600" />
  </Button>
)}

// Modal
<TaxExtractionModal
  bankMutationId={taxExtractionModal.bankMutationId}
  ocrText={taxExtractionModal.ocrText}
  open={taxExtractionModal.open}
  onOpenChange={(open) => setTaxExtractionModal({ ...taxExtractionModal, open })}
  onSuccess={() => fetchData()}
/>
```

---

## API Reference

### Edge Function

**POST** `/functions/v1/tax-extraction-ai`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```typescript
interface TaxExtractionRequest {
  bank_mutation_id: string;
  ocr_text: string;
}
```

**Success Response (200):**
```typescript
interface TaxExtractionResponse {
  success: true;
  message: string;
  data: {
    invoice_id: string;
    dpp_amount: number;
    ppn_amount: number;
    pph_amount: number;
    gross_amount: number;
  }
}
```

**Error Response (500):**
```typescript
interface TaxExtractionError {
  success: false;
  error: string;
}
```

---

## Testing

### Sample Documents

#### 1. Coretax Faktur Pajak
```
FAKTUR PAJAK
Nomor: 010.002-24.12345678
Dasar Pengenaan Pajak: Rp 10.000.000
PPN 11%: Rp 1.100.000
Total yang harus dibayar: Rp 11.100.000
```

Expected Output:
- invoice_id: "010.002-24.12345678"
- dpp_amount: 10000000
- ppn_amount: 1100000
- pph_amount: 0
- gross_amount: 11100000

#### 2. Commercial Invoice
```
INVOICE
No: INV-2024-001
TOTAL: Rp 8.000.000
```

Expected Output:
- invoice_id: "INV-2024-001"
- dpp_amount: 8000000
- ppn_amount: 0
- pph_amount: 0
- gross_amount: 8000000

#### 3. Faktur with Withholding
```
FAKTUR PAJAK
Nomor: 010.003-24.98765432
Dasar Pengenaan Pajak: Rp 20.000.000
PPN 11%: Rp 2.200.000
Total: Rp 22.200.000
PPh Pasal 23 (2%): Rp 400.000
Jumlah yang dibayarkan: Rp 21.800.000
```

Bank Amount: 21,800,000

Expected Output:
- invoice_id: "010.003-24.98765432"
- dpp_amount: 20000000
- ppn_amount: 2200000
- pph_amount: 400000 (calculated)
- gross_amount: 22200000

---

## Important Notes

### What This System Does:
✅ Extracts tax values from OCR text
✅ Fills invoice ID/number
✅ Calculates withholding tax (PPh)
✅ Stores extraction status and confidence

### What This System Does NOT Do:
❌ Change accounting categories
❌ Modify debit_account_code
❌ Modify credit_account_code
❌ Create journal entries
❌ Approve transactions

The Tax Extraction AI is purely a **data extraction tool**. All accounting logic and approvals remain under user control.

---

## Troubleshooting

### Issue: "Not authenticated"
**Solution:** Ensure user is logged in and has valid session

### Issue: "OPEN_AI_KEY not configured"
**Solution:** Set OPEN_AI_KEY in Supabase Edge Function secrets

### Issue: "Failed to extract tax data"
**Solution:** Check:
- OCR text quality
- Document format
- OpenAI API availability
- Network connectivity

### Issue: "Bank mutation not found"
**Solution:** Verify bank_mutation_id exists in database

---

## Future Enhancements

- [ ] Support for more document types (receipts, contracts)
- [ ] Multiple currency support
- [ ] Batch extraction
- [ ] Confidence threshold alerts
- [ ] Manual correction interface
- [ ] Audit trail for tax changes
- [ ] Integration with Coretax API
- [ ] OCR preprocessing (image enhancement)

---

## Files Changed/Created

### Database
- `supabase/migrations/20260114_add_tax_fields_to_bank_mutations.sql`

### Edge Functions
- `supabase/functions/tax-extraction-ai/index.ts`
- `supabase/functions/tax-extraction-ai/deno.json`

### React Components
- `src/components/TaxExtractionModal.tsx` (Modal UI)
- `src/components/TaxExtractionDemo.tsx` (Demo page)

### Integration
- `src/components/BankMutationsManagement.tsx` (Updated)
- `src/types/supabase.ts` (Auto-generated types)

### Storyboards
- `src/tempobook/pages/untitled-page-2d40a527/TaxExtractionDemo-cc53c1c6.tsx`

---

## Conclusion

The Tax Extraction AI system provides intelligent, automated extraction of tax information from Indonesian invoices and Faktur Pajak documents. It leverages OpenAI's powerful language model to accurately parse documents while maintaining the integrity of your accounting system.

For questions or issues, refer to the troubleshooting section or check the demo page for examples.
