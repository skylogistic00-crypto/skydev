-- Remove duplicate trigger on cash_disbursement
DROP TRIGGER IF EXISTS trigger_journal_from_cash_disbursement ON cash_disbursement CASCADE;

-- Verify only one trigger remains
SELECT 
  tablename,
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_tables tb ON t.tgrelid = tb.tablename::regclass
WHERE schemaname = 'public'
  AND tablename = 'cash_disbursement'
  AND t.tgname NOT LIKE 'RI_%'
ORDER BY t.tgname;
