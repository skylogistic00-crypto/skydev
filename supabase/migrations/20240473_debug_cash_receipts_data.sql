-- Debug: Check the actual data and trigger execution
SELECT 
  id,
  transaction_date,
  approval_status,
  debit_account_code,
  debit_account_name,
  credit_account_code,
  credit_account_name,
  amount,
  description,
  coa_cash_code,
  coa_contra_code,
  bukti
FROM cash_and_bank_receipts
ORDER BY created_at DESC;
