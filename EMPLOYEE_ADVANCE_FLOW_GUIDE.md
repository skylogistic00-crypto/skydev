# Employee Advance End-to-End Flow Guide

## Overview
This guide explains the complete flow for managing employee advances from creation to settlement.

---

## A. Buat Uang Muka (Create Advance)

**Status:** `requested`  
**Jurnal:** ❌ BELUM ADA (No journal entry yet)

### Process:
1. Go to **Buat Uang Muka** tab
2. Fill in the form:
   - **Karyawan**: Select employee
   - **Jumlah**: Enter advance amount
   - **Tanggal Pengajuan**: Date of request
   - **Catatan**: Optional notes
   - **Akun COA**: Select the advance account (1-14xx)

3. Click **Buat Uang Muka**

### Result:
- Advance record created with status `requested`
- Advance number generated (e.g., ADV-0001)
- **NO journal entry created yet** - this is intentional
- Appears in "Daftar Uang Muka" list

---

## B. Cairkan Uang Muka (Disburse Advance)

**Status:** `requested` → `disbursed`  
**Jurnal:** ✅ BUAT JURNAL OTOMATIS

### Process:
1. Go to **Cairkan Uang Muka** tab
2. Select the advance to disburse from dropdown
3. Fill in disbursement details:
   - **Metode Pencairan**: Choose Kas or Bank
   - **Akun Sumber Dana**: 
     - If Kas → Select Kas Besar (1-1101) or Kas Kecil (1-1102)
     - If Bank → Select Bank Account (1-12xx)
   - **Tanggal Pencairan**: Date of disbursement (can differ from request date)
   - **No. Bukti/Reference**: Receipt or reference number for audit

4. Click **Cairkan Uang Muka**

### Automatic Journal Entry Created:
```
Dr Uang Muka Karyawan (1-14xx)     Rp X.XXX
    Cr Kas / Bank (1-11xx / 1-12xx)           Rp X.XXX
```

### Result:
- Advance status changes to `disbursed`
- Journal entry automatically posted
- Appears in "Riwayat Pencairan" list
- Ready for employee to use

---

## C. Serahkan Struk / Pertanggungjawaban (Submit Receipts)

**Status:** `disbursed` → `settled` or `partially_settled`  
**Jurnal:** ✅ BUAT JURNAL UNTUK SETIAP STRUK

### Process:
1. Employee submits receipts/proof of expenses
2. For each receipt:
   - **Jika dibelanjakan** (Spent):
     - Create settlement entry
     - Allocate to expense account (Beban)
     - Journal: Dr Beban / Cr Uang Muka
   
   - **Jika ada sisa** (Remaining):
     - Create return entry
     - Return cash to Kas/Bank
     - Journal: Dr Kas/Bank / Cr Uang Muka

### Journal Entries:
**For Expenses:**
```
Dr Beban (5-xxx)                   Rp X.XXX
    Cr Uang Muka Karyawan (1-14xx)           Rp X.XXX
```

**For Returns:**
```
Dr Kas / Bank (1-11xx / 1-12xx)    Rp X.XXX
    Cr Uang Muka Karyawan (1-14xx)           Rp X.XXX
```

---

## D. Tutup / Lunasi (Close/Settle)

**Status:** `settled`  
**Condition:** Saldo uang muka = 0

### Process:
1. All receipts submitted and processed
2. All expenses allocated to appropriate accounts
3. All remaining cash returned
4. Advance balance becomes 0

### Result:
- Advance status: `settled`
- All journal entries posted
- Advance fully closed
- Ready for audit trail

---

## Status Flow Diagram

```
┌─────────────┐
│  requested  │  (Uang muka dibuat, belum ada jurnal)
└──────┬──────┘
       │ Cairkan Uang Muka
       ↓
┌─────────────┐
│ disbursed   │  (Jurnal: Dr Uang Muka / Cr Kas/Bank)
└──────┬──────┘
       │ Serahkan Struk
       ├─→ Dibelanjakan → Dr Beban / Cr Uang Muka
       ├─→ Dikembalikan → Dr Kas/Bank / Cr Uang Muka
       ↓
┌─────────────────────┐
│ settled / partially │  (Saldo = 0 atau sebagian)
│    _settled         │
└─────────────────────┘
```

---

## COA Accounts Used

| Account Code | Account Name | Type | Usage |
|---|---|---|---|
| 1-14xx | Uang Muka Karyawan | Asset | Advance tracking |
| 1-1101 | Kas Besar | Asset | Cash disbursement |
| 1-1102 | Kas Kecil | Asset | Petty cash disbursement |
| 1-12xx | Bank Accounts | Asset | Bank disbursement |
| 5-xxx | Expense Accounts | Expense | Expense allocation |

---

## Key Features

✅ **Automatic Journal Generation**
- Disbursement creates journal automatically
- Settlement creates journal for each receipt
- Returns create journal for cash return

✅ **Audit Trail**
- Reference numbers for tracking
- Disbursement dates recorded
- All transactions linked to advance

✅ **Flexible Disbursement**
- Support both Kas and Bank
- Different disbursement date from request
- Multiple account options

✅ **Status Tracking**
- Clear status progression
- Balance tracking
- Settlement history

---

## Tips & Best Practices

1. **Always record disbursement date** - helps with cash flow tracking
2. **Use reference numbers** - essential for audit and reconciliation
3. **Submit receipts promptly** - reduces outstanding advances
4. **Allocate to correct expense accounts** - ensures accurate reporting
5. **Return remaining cash immediately** - closes advance faster

---

## Troubleshooting

**Q: Why is my advance not showing in the disburse list?**
- A: Advance must have status `requested`. Check if it's already `disbursed`.

**Q: Can I change the disbursement date?**
- A: Yes, disbursement date can differ from request date.

**Q: What if employee loses receipts?**
- A: Create settlement entry with best estimate and note in description.

**Q: How do I cancel an advance?**
- A: Update status to `cancelled` (requires admin access).

---

## Related Components

- `EmployeeAdvanceForm.tsx` - Create advance
- `EmployeeAdvanceDisbursement.tsx` - Disburse advance
- `supabase/functions/employee-advance-disburse/` - Disbursement logic
- `vw_employee_advance_summary` - View for listing advances
