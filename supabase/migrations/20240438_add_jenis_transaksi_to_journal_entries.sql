-- Add jenis_transaksi column to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS jenis_transaksi TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_jenis_transaksi 
ON journal_entries(jenis_transaksi);

-- Update existing records based on reference_type
UPDATE journal_entries
SET jenis_transaksi = CASE
  WHEN reference_type = 'employee_advance_advance' THEN 'Uang Muka'
  WHEN reference_type = 'employee_advance_settlement' THEN 'Penyelesaian Uang Muka'
  WHEN reference_type = 'employee_advance_return' THEN 'Pengembalian Uang Muka'
  WHEN reference_type LIKE '%cash_disbursement%' THEN 'Pengeluaran Kas'
  WHEN reference_type LIKE '%cash_receipt%' THEN 'Penerimaan Kas'
  WHEN reference_type LIKE '%bank_mutation%' THEN 'Mutasi Bank'
  WHEN reference_type LIKE '%purchase%' THEN 'Pembelian'
  WHEN reference_type LIKE '%sales%' THEN 'Penjualan'
  WHEN reference_type LIKE '%general_journal%' THEN 'Jurnal Umum'
  ELSE '-'
END
WHERE jenis_transaksi IS NULL;
