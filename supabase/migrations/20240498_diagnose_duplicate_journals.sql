-- Check for ALL triggers on cash_disbursement
SELECT 
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  p.proname AS function_name,
  CASE 
    WHEN t.tgtype & 2 > 0 THEN 'BEFORE'
    WHEN t.tgtype & 4 > 0 THEN 'AFTER'
    ELSE 'UNKNOWN'
  END AS timing,
  CASE 
    WHEN t.tgtype & 4 > 0 THEN 'INSERT'
    WHEN t.tgtype & 8 > 0 THEN 'DELETE'
    WHEN t.tgtype & 16 > 0 THEN 'UPDATE'
    ELSE 'UNKNOWN'
  END AS event
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'cash_disbursement'::regclass
  AND t.tgname NOT LIKE 'RI_%'
ORDER BY t.tgname;

-- Check for ALL triggers on cash_and_bank_receipts
SELECT 
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  p.proname AS function_name,
  CASE 
    WHEN t.tgtype & 2 > 0 THEN 'BEFORE'
    WHEN t.tgtype & 4 > 0 THEN 'AFTER'
    ELSE 'UNKNOWN'
  END AS timing,
  CASE 
    WHEN t.tgtype & 4 > 0 THEN 'INSERT'
    WHEN t.tgtype & 8 > 0 THEN 'DELETE'
    WHEN t.tgtype & 16 > 0 THEN 'UPDATE'
    ELSE 'UNKNOWN'
  END AS event
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'cash_and_bank_receipts'::regclass
  AND t.tgname NOT LIKE 'RI_%'
ORDER BY t.tgname;

-- Check journal entries for recent cash_disbursement
SELECT 
  je.id,
  je.journal_number,
  je.debit_account,
  je.credit_account,
  je.debit,
  je.credit,
  je.reference_type,
  je.reference_id,
  je.created_at
FROM journal_entries je
WHERE je.reference_type = 'cash_disbursement'
  AND je.created_at > NOW() - INTERVAL '1 hour'
ORDER BY je.reference_id, je.created_at;

-- Check journal entries for recent cash_and_bank_receipts
SELECT 
  je.id,
  je.journal_number,
  je.debit_account,
  je.credit_account,
  je.debit,
  je.credit,
  je.reference_type,
  je.reference_id,
  je.created_at
FROM journal_entries je
WHERE je.reference_type = 'cash_receipts'
  AND je.created_at > NOW() - INTERVAL '1 hour'
ORDER BY je.reference_id, je.created_at;
