# Journal COA Integration Guide

## Overview

Sistem jurnal akuntansi telah diperbaiki agar setiap baris jurnal entries dan general_ledger SELALU memiliki `account_id`, `account_code`, dan `account_name` secara otomatis.

## Perubahan Database

### Kolom Baru
- `account_id` (UUID) - ID referensi ke tabel `chart_of_accounts`
- `account_name` (TEXT) - Nama akun yang di-resolve dari COA

### Tabel yang Terpengaruh
1. `general_ledger`
2. `journal_entries`
3. `journal_entry_lines`

### Trigger Otomatis
Database trigger akan otomatis mengisi `account_code` dan `account_name` jika:
- User mengirim `account_id` saja → trigger akan lookup `account_code` dan `account_name`
- User mengirim `account_code` saja → trigger akan lookup `account_id` dan `account_name`

## Helper Functions

### SQL Functions

```sql
-- Get COA by ID
SELECT * FROM get_account_coa('uuid-here');

-- Get COA by Code
SELECT * FROM get_account_coa_by_code('1-1001');
```

### Edge Function Helper

File: `supabase/functions/_shared/coa-helper.ts`

```typescript
import { getAccountCOA, getAccountCOAByCode, resolveCOA } from "@shared/coa-helper.ts";

// Get by ID
const coa = await getAccountCOA(supabase, accountId);

// Get by Code
const coa = await getAccountCOAByCode(supabase, "1-1001");

// Resolve (accepts either)
const coa = await resolveCOA(supabase, { account_id: "..." });
const coa = await resolveCOA(supabase, { account_code: "1-1001" });
```

## Edge Functions

### 1. Employee Advance Journal
**Slug:** `supabase-functions-employee-advance-journal`

**Payload:**
```json
{
  "type": "advance" | "settlement" | "return",
  "employee_name": "John Doe",
  "amount": 1000000,
  "date": "2024-01-15",
  "coa_account_id": "uuid-of-advance-account",
  "expense_account_id": "uuid-of-expense-account",
  "cash_account_id": "uuid-of-cash-account"
}
```

### 2. Manual Journal
**Slug:** `supabase-functions-manual-journal`

**Payload:**
```json
{
  "date": "2024-01-15",
  "description": "Manual journal entry",
  "entries": [
    {
      "account_id": "uuid-of-debit-account",
      "debit": 1000000,
      "credit": 0
    },
    {
      "account_id": "uuid-of-credit-account",
      "debit": 0,
      "credit": 1000000
    }
  ]
}
```

### 3. Cash Receipt Journal
**Slug:** `supabase-functions-cash-receipt-journal`

**Payload:**
```json
{
  "receipt_id": "uuid-optional",
  "date": "2024-01-15",
  "amount": 1000000,
  "description": "Penerimaan dari pelanggan",
  "debit_account_id": "uuid-of-cash-account",
  "credit_account_id": "uuid-of-revenue-account",
  "tax_amount": 100000,
  "tax_account_id": "uuid-of-tax-account"
}
```

### 4. Cash Disbursement Journal
**Slug:** `supabase-functions-cash-disbursement-journal`

**Payload:**
```json
{
  "disbursement_id": "uuid-optional",
  "date": "2024-01-15",
  "amount": 1000000,
  "description": "Pembayaran beban operasional",
  "debit_account_id": "uuid-of-expense-account",
  "credit_account_id": "uuid-of-cash-account",
  "tax_amount": 100000,
  "tax_account_id": "uuid-of-tax-account"
}
```

## Views

### 1. view_general_ledger
View lengkap general ledger dengan detail COA.

```sql
SELECT * FROM view_general_ledger
WHERE date BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY date;
```

### 2. vw_trial_balance_complete
Trial balance dengan detail COA lengkap.

```sql
SELECT * FROM vw_trial_balance_complete
WHERE balance != 0
ORDER BY account_code;
```

### 3. vw_profit_loss_complete
Laporan laba rugi dengan detail COA.

```sql
SELECT * FROM vw_profit_loss_complete
ORDER BY account_code;
```

### 4. vw_balance_sheet_complete
Neraca dengan detail COA.

```sql
SELECT * FROM vw_balance_sheet_complete
ORDER BY account_code;
```

## Frontend Usage

### Menggunakan account_id sebagai payload utama

```typescript
// Contoh: Membuat jurnal manual
const { data, error } = await supabase.functions.invoke(
  'supabase-functions-manual-journal',
  {
    body: {
      date: '2024-01-15',
      description: 'Pembayaran gaji',
      entries: [
        {
          account_id: selectedExpenseAccountId, // UUID dari COA
          debit: 5000000,
          credit: 0
        },
        {
          account_id: selectedCashAccountId, // UUID dari COA
          debit: 0,
          credit: 5000000
        }
      ]
    }
  }
);
```

### Mengambil data COA untuk dropdown

```typescript
const { data: coaAccounts } = await supabase
  .from('chart_of_accounts')
  .select('id, account_code, account_name, account_type, level')
  .eq('is_active', true)
  .eq('is_header', false)
  .order('account_code');

// Gunakan id sebagai value, tampilkan account_code + account_name
<Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
  {coaAccounts.map(acc => (
    <SelectItem key={acc.id} value={acc.id}>
      {acc.account_code} - {acc.account_name}
    </SelectItem>
  ))}
</Select>
```

## Backfill Data Lama

Jika ada jurnal lama yang tidak memiliki `account_id` atau `account_name`, jalankan:

```sql
-- Backfill general_ledger
UPDATE general_ledger gl
SET 
  account_id = coa.id,
  account_name = coa.account_name
FROM chart_of_accounts coa
WHERE gl.account_code = coa.account_code
  AND (gl.account_id IS NULL OR gl.account_name IS NULL);

-- Backfill journal_entries
UPDATE journal_entries je
SET 
  account_id = coa.id,
  account_name = coa.account_name
FROM chart_of_accounts coa
WHERE je.account_code = coa.account_code
  AND (je.account_id IS NULL OR je.account_name IS NULL);

-- Backfill journal_entry_lines
UPDATE journal_entry_lines jel
SET 
  account_id = coa.id,
  account_name = coa.account_name
FROM chart_of_accounts coa
WHERE jel.account_code = coa.account_code
  AND (jel.account_id IS NULL OR jel.account_name IS NULL);
```

## Troubleshooting

### Error: COA not found
Pastikan `account_id` atau `account_code` yang dikirim valid dan ada di tabel `chart_of_accounts`.

### Error: Journal not balanced
Total debit harus sama dengan total credit. Periksa kembali nilai yang dikirim.

### Data tidak muncul di laporan
1. Pastikan jurnal sudah di-post (status = 'posted')
2. Periksa apakah `account_code` dan `account_name` terisi
3. Jalankan backfill SQL jika perlu
