-- Check the most recent cash_disbursement record
SELECT 
  id,
  debit_account_code,
  debit_account_name,
  credit_account_code,
  credit_account_name,
  bank_account,
  account_code,
  account_name,
  payment_method,
  created_at
FROM cash_disbursement
ORDER BY created_at DESC
LIMIT 3;
