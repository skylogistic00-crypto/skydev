-- Check all triggers on journal_entries table
SELECT 
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  p.proname AS function_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'journal_entries'::regclass
  AND t.tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers
ORDER BY t.tgname;

-- Check all triggers on cash_disbursement table
SELECT 
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  p.proname AS function_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'cash_disbursement'::regclass
  AND t.tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers
ORDER BY t.tgname;
