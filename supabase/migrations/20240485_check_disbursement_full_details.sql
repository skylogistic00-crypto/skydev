-- Check full details of cash_disbursement records
SELECT 
  id,
  transaction_date,
  document_number,
  approval_status,
  category,
  account_code,
  account_name,
  bank_account,
  payment_method,
  debit_account_code,
  credit_account_code,
  amount,
  description
FROM cash_disbursement
ORDER BY created_at DESC;
