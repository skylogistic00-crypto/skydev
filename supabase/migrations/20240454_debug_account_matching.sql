-- Debug: Check account_code matching between tables

-- Check journal_entry_lines data
SELECT 
  'journal_entry_lines' as source,
  COUNT(*) as total_rows,
  COUNT(DISTINCT account_code) as unique_accounts
FROM journal_entry_lines;

-- Sample account codes from journal_entry_lines
SELECT DISTINCT 
  account_code,
  account_name,
  SUM(debit) as total_debit,
  SUM(credit) as total_credit
FROM journal_entry_lines
WHERE account_code IS NOT NULL
GROUP BY account_code, account_name
ORDER BY account_code
LIMIT 10;

-- Check if these account_codes exist in chart_of_accounts
SELECT 
  jel.account_code as jel_code,
  coa.account_code as coa_code,
  CASE WHEN coa.account_code IS NULL THEN 'NOT FOUND IN COA' ELSE 'FOUND' END as status
FROM (
  SELECT DISTINCT account_code
  FROM journal_entry_lines
  WHERE account_code IS NOT NULL
  LIMIT 10
) jel
LEFT JOIN chart_of_accounts coa ON jel.account_code = coa.account_code;
