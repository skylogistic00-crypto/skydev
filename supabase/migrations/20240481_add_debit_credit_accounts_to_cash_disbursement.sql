-- Add debit and credit account columns to cash_disbursement table
-- This allows the trigger to create proper journal entries like cash_and_bank_receipts

ALTER TABLE cash_disbursement 
ADD COLUMN IF NOT EXISTS debit_account_code TEXT,
ADD COLUMN IF NOT EXISTS debit_account_name TEXT,
ADD COLUMN IF NOT EXISTS credit_account_code TEXT,
ADD COLUMN IF NOT EXISTS credit_account_name TEXT,
ADD COLUMN IF NOT EXISTS transaction_type TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_disbursement_debit_account 
ON cash_disbursement(debit_account_code);

CREATE INDEX IF NOT EXISTS idx_cash_disbursement_credit_account 
ON cash_disbursement(credit_account_code);

COMMENT ON COLUMN cash_disbursement.debit_account_code IS 'Account code for debit entry (expense account)';
COMMENT ON COLUMN cash_disbursement.debit_account_name IS 'Account name for debit entry (expense account)';
COMMENT ON COLUMN cash_disbursement.credit_account_code IS 'Account code for credit entry (cash/bank account)';
COMMENT ON COLUMN cash_disbursement.credit_account_name IS 'Account name for credit entry (cash/bank account)';
COMMENT ON COLUMN cash_disbursement.transaction_type IS 'Type of transaction (e.g., Pengeluaran, Beban Operasional)';
