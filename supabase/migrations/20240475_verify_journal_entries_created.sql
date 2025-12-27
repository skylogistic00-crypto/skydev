-- Check if journal entries were created
SELECT 
  'cash_and_bank_receipts' as table_name,
  COUNT(*) as count
FROM cash_and_bank_receipts
UNION ALL
SELECT 
  'journal_entries (cash_receipts)' as table_name,
  COUNT(*) as count
FROM journal_entries
WHERE reference_type = 'cash_receipts';

-- Show the journal entries details
SELECT 
  journal_number,
  tanggal,
  debit_account,
  debit_account_name,
  credit_account,
  credit_account_name,
  amount,
  description,
  jenis_transaksi,
  reference_type
FROM journal_entries
WHERE reference_type = 'cash_receipts'
ORDER BY journal_number, debit_account DESC NULLS LAST;
