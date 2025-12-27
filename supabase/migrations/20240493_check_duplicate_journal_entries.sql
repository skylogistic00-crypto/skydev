-- Check the most recent journal entries to identify duplicates
SELECT 
  je.id,
  je.tanggal,
  je.journal_number,
  je.debit_account,
  je.credit_account,
  je.debit,
  je.credit,
  je.reference_type,
  je.reference_id,
  je.created_at
FROM journal_entries je
WHERE je.created_at > NOW() - INTERVAL '30 minutes'
ORDER BY je.created_at DESC, je.journal_number
LIMIT 10;

-- Check for duplicate journal numbers
SELECT 
  journal_number,
  COUNT(*) as count
FROM journal_entries
WHERE created_at > NOW() - INTERVAL '30 minutes'
GROUP BY journal_number
HAVING COUNT(*) > 2;

-- Check all triggers on cash_disbursement
SELECT 
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'cash_disbursement'::regclass;
