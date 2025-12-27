-- Delete old journal entries from cash_receipts
DELETE FROM journal_entries WHERE reference_type = 'cash_receipts';

-- Update cash_and_bank_receipts to trigger new entries
UPDATE cash_and_bank_receipts
SET approval_status = 'pending'
WHERE approval_status = 'approved';

UPDATE cash_and_bank_receipts
SET approval_status = 'approved'
WHERE approval_status = 'pending';

-- Verify results
SELECT 
  'Total journal entries' as info,
  COUNT(*) as count
FROM journal_entries
WHERE reference_type = 'cash_receipts';
