-- Check if credit_account_code and debit_account_code columns exist
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'cash_disbursement'
  AND column_name IN ('debit_account_code', 'debit_account_name', 'credit_account_code', 'credit_account_name', 'bank_account')
ORDER BY column_name;

-- Check the actual data in recent records
SELECT 
  id,
  debit_account_code,
  debit_account_name,
  credit_account_code,
  credit_account_name,
  bank_account,
  account_code,
  account_name,
  created_at
FROM cash_disbursement
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 5;
