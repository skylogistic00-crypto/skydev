ALTER TABLE employee_advances
ADD COLUMN IF NOT EXISTS debit_account_code TEXT,
ADD COLUMN IF NOT EXISTS debit_account_name TEXT,
ADD COLUMN IF NOT EXISTS credit_account_code TEXT,
ADD COLUMN IF NOT EXISTS credit_account_name TEXT;
