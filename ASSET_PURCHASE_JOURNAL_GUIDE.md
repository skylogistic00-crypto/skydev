# Asset Purchase Journal Integration Guide

## Overview
Integrate asset purchases with the accounting journal system following proper double-entry bookkeeping.

## Transaction Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ASSET PURCHASE FLOW                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User Input                2. COA Engine                3. Journal Entry  │
│  ┌────────────────┐          ┌────────────────┐           ┌────────────────┐│
│  │ "Beli mobil    │  ──────► │ Analyze Intent │  ──────►  │ Create Asset   ││
│  │  Toyota Avanza │          │ - intent: ASSET│           │ Record         ││
│  │  B 1234 ABC    │          │ - action: REUSE│           │ ↓              ││
│  │  Rp 250.000.000"│         │ - vehicle_meta │           │ Create Vehicle ││
│  └────────────────┘          │   detected     │           │ (if vehicle)   ││
│                              └────────────────┘           │ ↓              ││
│                                                           │ Post Journal   ││
│                                                           └────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

## API Endpoint

### POST `/functions/v1/supabase-functions-asset-purchase-journal`

**Request Body:**
```json
{
  "asset_name": "Mobil Toyota Avanza",
  "asset_category": "Vehicle",
  "acquisition_date": "2024-01-15",
  "acquisition_cost": 250000000,
  "useful_life_years": 8,
  "coa_account_code": "1-5100",
  "payment_account_code": "1-1110",
  "description": "Pembelian kendaraan operasional",
  "location": "Jakarta",
  "vehicle_data": {
    "brand": "Toyota",
    "model": "Avanza",
    "plate_number": "B 1234 ABC",
    "year_made": 2024,
    "color": "Silver",
    "fuel_type": "bensin"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pembelian aset berhasil dicatat",
  "data": {
    "asset": {
      "id": "uuid",
      "asset_name": "Mobil Toyota Avanza",
      "asset_category": "Vehicle",
      "coa_account_code": "1-5100",
      "status": "active"
    },
    "vehicle": {
      "id": "uuid",
      "brand": "Toyota",
      "model": "Avanza",
      "plate_number": "B 1234 ABC"
    },
    "journal_entry": {
      "id": "uuid",
      "transaction_date": "2024-01-15",
      "description": "Pembelian Aset: Mobil Toyota Avanza",
      "total_debit": 250000000,
      "total_credit": 250000000,
      "status": "posted"
    },
    "journal_lines": [
      {
        "account_code": "1-5100",
        "account_name": "Kendaraan",
        "debit": 250000000,
        "credit": 0
      },
      {
        "account_code": "1-1110",
        "account_name": "Kas",
        "debit": 0,
        "credit": 250000000
      }
    ]
  }
}
```

## Journal Entry Mapping

### Asset Purchase (Standard Double Entry)

| Entry | Account | Debit | Credit |
|-------|---------|-------|--------|
| Dr | Kendaraan (1-5100) | Rp 250.000.000 | - |
| Cr | Kas (1-1110) | - | Rp 250.000.000 |

**Reference Structure:**
```
journal_entries:
  - reference_type: "asset_purchase"
  - reference_id: {asset_id}
```

## Database Tables Involved

### 1. `assets` (Store asset details)
```sql
INSERT INTO assets (
  asset_name,
  asset_category,
  acquisition_date,
  acquisition_cost,
  useful_life_years,
  coa_account_code,
  status
) VALUES (
  'Mobil Toyota Avanza',
  'Vehicle',
  '2024-01-15',
  250000000,
  8,
  '1-5100',
  'active'
);
```

### 2. `vehicles` (Store vehicle-specific details)
```sql
INSERT INTO vehicles (
  asset_id,
  brand,
  model,
  plate_number,
  year_made,
  color,
  fuel_type
) VALUES (
  '{asset_id}',
  'Toyota',
  'Avanza',
  'B 1234 ABC',
  2024,
  'Silver',
  'bensin'
);
```

### 3. `journal_entries` (Header)
```sql
INSERT INTO journal_entries (
  transaction_date,
  description,
  reference_type,
  reference_id,
  total_debit,
  total_credit,
  status
) VALUES (
  '2024-01-15',
  'Pembelian Aset: Mobil Toyota Avanza',
  'asset_purchase',
  '{asset_id}',
  250000000,
  250000000,
  'posted'
);
```

### 4. `journal_entry_lines` (Line items)
```sql
-- Debit line (Asset)
INSERT INTO journal_entry_lines (
  journal_entry_id,
  account_code,
  account_name,
  debit,
  credit
) VALUES (
  '{journal_id}',
  '1-5100',
  'Kendaraan',
  250000000,
  0
);

-- Credit line (Cash)
INSERT INTO journal_entry_lines (
  journal_entry_id,
  account_code,
  account_name,
  debit,
  credit
) VALUES (
  '{journal_id}',
  '1-1110',
  'Kas',
  0,
  250000000
);
```

### 5. `general_ledger` (Posted entries)
Automatically populated from journal_entry_lines for reporting.

## COA Engine Integration

When user enters "Beli mobil Toyota Avanza B 1234 ABC":

1. **COA Engine Analyze** returns:
```json
{
  "intent_code": "ASSET",
  "action_taken": "reused",
  "selected_account_code": "1-5100",
  "asset_category": "Vehicle",
  "vehicle_metadata": {
    "brand": "Toyota",
    "model": "Avanza",
    "plate_number": "B 1234 ABC"
  }
}
```

2. **Result:** 
   - ✅ Reuses existing "Kendaraan" COA
   - ✅ Returns vehicle metadata
   - ❌ Does NOT create new COA for the specific vehicle

## Usage in Frontend

```typescript
import { supabase } from "@/lib/supabase";

// After COA Engine analysis
const handleAssetPurchase = async (coaResult, amount, paymentAccountCode) => {
  const { data, error } = await supabase.functions.invoke(
    "supabase-functions-asset-purchase-journal",
    {
      body: {
        asset_name: coaResult.intent,
        asset_category: coaResult.asset_category || "Equipment",
        acquisition_date: new Date().toISOString().split("T")[0],
        acquisition_cost: amount,
        coa_account_code: coaResult.selected_account_code,
        payment_account_code: paymentAccountCode,
        vehicle_data: coaResult.vehicle_metadata
      }
    }
  );

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Asset purchased:", data);
};
```

## Summary

| Step | Action | Table/Function |
|------|--------|----------------|
| 1 | Analyze description | `coa-engine-analyze` |
| 2 | Get COA code | Reuse existing COA |
| 3 | Create asset record | `assets` table |
| 4 | Create vehicle record (if vehicle) | `vehicles` table |
| 5 | Create journal header | `journal_entries` table |
| 6 | Create journal lines | `journal_entry_lines` table |
| 7 | Post to general ledger | `general_ledger` table |
