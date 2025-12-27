-- Test if trigger is working by updating existing records
-- This will force the trigger to fire

UPDATE cash_and_bank_receipts
SET approval_status = 'pending'
WHERE approval_status = 'approved';

UPDATE cash_and_bank_receipts
SET approval_status = 'approved'
WHERE approval_status = 'pending';

-- Check results
SELECT 
  'cash_and_bank_receipts' as source_table,
  COUNT(*) as total_records
FROM cash_and_bank_receipts
UNION ALL
SELECT 
  'journal_entries' as source_table,
  COUNT(*) as total_records
FROM journal_entries
WHERE reference_type = 'cash_receipts';
