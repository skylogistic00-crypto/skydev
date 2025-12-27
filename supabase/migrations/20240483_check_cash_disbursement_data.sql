-- Check all columns in cash_disbursement table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cash_disbursement' 
ORDER BY ordinal_position;

-- Check cash_disbursement data
SELECT 
  id,
  transaction_date,
  approval_status,
  account_code,
  account_name,
  amount,
  description
FROM cash_disbursement
ORDER BY created_at DESC
LIMIT 5;
