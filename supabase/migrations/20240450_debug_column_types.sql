-- Debug: Check actual column types
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'chart_of_accounts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'journal_entry_lines' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check sample data
SELECT 
  account_code,
  pg_typeof(account_code) as account_code_type,
  account_name
FROM chart_of_accounts
LIMIT 5;

SELECT 
  account_code,
  pg_typeof(account_code) as account_code_type,
  account_name
FROM journal_entry_lines
LIMIT 5;
