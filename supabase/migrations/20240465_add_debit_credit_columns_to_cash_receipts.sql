-- Add debit and credit account columns to cash_and_bank_receipts

ALTER TABLE cash_and_bank_receipts ADD COLUMN IF NOT EXISTS debit_account_code TEXT;
ALTER TABLE cash_and_bank_receipts ADD COLUMN IF NOT EXISTS debit_account_name TEXT;
ALTER TABLE cash_and_bank_receipts ADD COLUMN IF NOT EXISTS credit_account_code TEXT;
ALTER TABLE cash_and_bank_receipts ADD COLUMN IF NOT EXISTS credit_account_name TEXT;

COMMENT ON COLUMN cash_and_bank_receipts.debit_account_code IS 'Debit account code (Bank) for Pendapatan transactions';
COMMENT ON COLUMN cash_and_bank_receipts.debit_account_name IS 'Debit account name (Bank) for Pendapatan transactions';
COMMENT ON COLUMN cash_and_bank_receipts.credit_account_code IS 'Credit account code (Akun Pendapatan) for Pendapatan transactions';
COMMENT ON COLUMN cash_and_bank_receipts.credit_account_name IS 'Credit account name (Akun Pendapatan) for Pendapatan transactions';
