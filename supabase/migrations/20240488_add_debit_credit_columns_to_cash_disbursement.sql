-- Add missing columns to cash_disbursement table if they don't exist
ALTER TABLE cash_disbursement
ADD COLUMN IF NOT EXISTS debit_account_code TEXT,
ADD COLUMN IF NOT EXISTS debit_account_name TEXT,
ADD COLUMN IF NOT EXISTS credit_account_code TEXT,
ADD COLUMN IF NOT EXISTS credit_account_name TEXT,
ADD COLUMN IF NOT EXISTS transaction_type TEXT;

-- Verify columns added
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'cash_disbursement'
  AND column_name IN ('debit_account_code', 'debit_account_name', 'credit_account_code', 'credit_account_name', 'transaction_type')
ORDER BY column_name;
