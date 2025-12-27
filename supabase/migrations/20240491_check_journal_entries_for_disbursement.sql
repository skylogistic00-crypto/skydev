-- Check journal entries for the recent cash_disbursement
SELECT 
  je.id,
  je.tanggal,
  je.journal_number,
  je.debit_account,
  je.debit_account_name,
  je.credit_account,
  je.credit_account_name,
  je.debit,
  je.credit,
  je.amount,
  je.reference_type,
  je.reference_id
FROM journal_entries je
WHERE je.reference_type = 'cash_disbursement'
  AND je.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY je.created_at DESC, je.journal_number;

-- Check if there are duplicate triggers
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name,
  tgenabled AS enabled
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgname LIKE '%cash_disbursement%'
ORDER BY tgname;
