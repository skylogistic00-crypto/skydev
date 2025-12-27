ALTER TABLE employee_advances
DROP COLUMN IF EXISTS debit_account_code,
DROP COLUMN IF EXISTS debit_account_name,
DROP COLUMN IF EXISTS credit_account_code,
DROP COLUMN IF EXISTS credit_account_name;
