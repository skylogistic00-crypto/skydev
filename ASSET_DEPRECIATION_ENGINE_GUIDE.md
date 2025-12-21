# Asset Depreciation Engine Guide

## Overview
Automatic calculation and journaling of asset depreciation using straight-line method.

## Database Schema

### asset_depreciation Table
```sql
CREATE TABLE asset_depreciation (
  id UUID PRIMARY KEY,
  asset_id UUID REFERENCES assets(id),
  period DATE,
  period_year INTEGER,
  period_month INTEGER,
  depreciation_amount DECIMAL(15, 2),
  accumulated_depreciation DECIMAL(15, 2),
  book_value DECIMAL(15, 2),
  depreciation_method TEXT DEFAULT 'straight_line',
  journal_entry_id UUID REFERENCES journal_entries(id),
  status TEXT ('draft', 'posted', 'cancelled'),
  created_at TIMESTAMPTZ
);
```

### Assets Table (Updated)
- `salvage_value` - Residual value at end of useful life
- `depreciation_method` - Method (straight_line)
- `depreciation_start_date` - When depreciation starts
- `total_depreciation` - Accumulated total
- `current_book_value` - Current value after depreciation

## Depreciation Formula

### Straight-Line Method
```
Monthly Depreciation = (Acquisition Cost - Salvage Value) / (Useful Life Years × 12)
```

**Example:**
- Acquisition Cost: Rp 250,000,000
- Salvage Value: Rp 50,000,000
- Useful Life: 8 years

```
Monthly Depreciation = (250,000,000 - 50,000,000) / (8 × 12)
                     = 200,000,000 / 96
                     = Rp 2,083,333.33
```

## API Endpoint

### POST `/functions/v1/supabase-functions-asset-depreciation-engine`

**Request Body:**
```json
{
  "asset_id": "uuid (optional - if omitted, process all active assets)",
  "period_year": 2024,
  "period_month": 6,
  "auto_post": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Penyusutan berhasil dihitung untuk 3 aset",
  "period": "6/2024",
  "auto_posted": true,
  "data": [
    {
      "asset_id": "uuid",
      "asset_name": "Mobil Toyota Avanza",
      "depreciation_amount": 2083333.33,
      "accumulated_depreciation": 10416666.65,
      "book_value": 239583333.35,
      "journal_entry_id": "uuid",
      "status": "posted"
    }
  ]
}
```

## Journal Entry Mapping

### Depreciation Entry (Double Entry)
| Entry | Account | Debit | Credit |
|-------|---------|-------|--------|
| Dr | Beban Penyusutan Kendaraan (6-4100) | Rp 2,083,333 | - |
| Cr | Akumulasi Penyusutan Kendaraan (1-5900) | - | Rp 2,083,333 |

### COA Account Mapping by Asset Category

| Category | Expense Account | Accumulated Account |
|----------|-----------------|---------------------|
| Vehicle/Kendaraan | 6-4100 | 1-5900 |
| Equipment/Peralatan | 6-4200 | 1-5910 |
| Building/Bangunan | 6-4300 | 1-5920 |

## Usage Flow

### 1. Monthly Depreciation (Batch All Assets)
```typescript
const { data, error } = await supabase.functions.invoke(
  "supabase-functions-asset-depreciation-engine",
  {
    body: {
      period_year: 2024,
      period_month: 6,
      auto_post: true
    }
  }
);
```

### 2. Single Asset Depreciation
```typescript
const { data, error } = await supabase.functions.invoke(
  "supabase-functions-asset-depreciation-engine",
  {
    body: {
      asset_id: "asset-uuid",
      period_year: 2024,
      period_month: 6,
      auto_post: true
    }
  }
);
```

### 3. Preview Only (Draft Mode)
```typescript
const { data, error } = await supabase.functions.invoke(
  "supabase-functions-asset-depreciation-engine",
  {
    body: {
      period_year: 2024,
      period_month: 6,
      auto_post: false // Creates draft records without journal entries
    }
  }
);
```

## Business Rules

1. **Skip if already processed**: Duplicate depreciation for same asset/period prevented by unique index
2. **Fully depreciated check**: Skip if total_depreciation >= (acquisition_cost - salvage_value)
3. **Final period adjustment**: Last depreciation amount adjusted to exact remaining value
4. **Active assets only**: Only assets with status = 'active' are processed

## Integration with Asset Purchase

When an asset is purchased via `asset-purchase-journal`:
1. Asset record created with acquisition_cost
2. current_book_value set to acquisition_cost
3. total_depreciation = 0
4. Monthly depreciation engine can then process

## Depreciation Schedule Example

**Asset:** Mobil Toyota Avanza
- Acquisition: Rp 250,000,000
- Salvage: Rp 50,000,000
- Life: 8 years
- Monthly: Rp 2,083,333.33

| Period | Depreciation | Accumulated | Book Value |
|--------|-------------|-------------|------------|
| 2024-01 | 2,083,333 | 2,083,333 | 247,916,667 |
| 2024-02 | 2,083,333 | 4,166,666 | 245,833,334 |
| 2024-03 | 2,083,333 | 6,249,999 | 243,750,001 |
| ... | ... | ... | ... |
| 2032-01 | 2,083,337 | 200,000,000 | 50,000,000 |

## Summary

| Component | Description |
|-----------|-------------|
| Table | `asset_depreciation` |
| Method | Straight-line (monthly) |
| Expense Account | 6-41xx (by category) |
| Accumulated Account | 1-59xx (by category) |
| Auto-post | Creates journal entries when true |
| Batch processing | Processes all active assets if asset_id omitted |
