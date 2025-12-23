-- Debug: Check general_ledger data and matching with COA

-- Check general_ledger content
SELECT 
  'General Ledger Count' as info,
  COUNT(*) as count,
  COUNT(DISTINCT account_code) as unique_accounts
FROM general_ledger;

-- Check if account_code exists and has data
SELECT 
  account_code,
  account_name,
  SUM(debit) as total_debit,
  SUM(credit) as total_credit
FROM general_ledger
WHERE account_code IS NOT NULL
GROUP BY account_code, account_name
ORDER BY account_code
LIMIT 10;

-- Check COA accounts that should have balances
SELECT 
  coa.account_code,
  coa.account_name,
  COUNT(gl.id) as gl_entries
FROM chart_of_accounts coa
LEFT JOIN general_ledger gl ON coa.account_code = gl.account_code
GROUP BY coa.account_code, coa.account_name
HAVING COUNT(gl.id) > 0
ORDER BY COUNT(gl.id) DESC
LIMIT 10;
