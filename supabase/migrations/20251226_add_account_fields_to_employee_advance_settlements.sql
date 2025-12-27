ALTER TABLE employee_advance_settlements
ADD COLUMN IF NOT EXISTS debit_account_code TEXT,
ADD COLUMN IF NOT EXISTS debit_account_name TEXT,
ADD COLUMN IF NOT EXISTS credit_account_code TEXT,
ADD COLUMN IF NOT EXISTS credit_account_name TEXT,
ADD COLUMN IF NOT EXISTS bukti TEXT;

UPDATE employee_advance_settlements
SET bukti = bukti_url
WHERE bukti IS NULL AND bukti_url IS NOT NULL;

UPDATE employee_advance_settlements
SET credit_account_code = '1-1500',
    credit_account_name = 'Uang Muka Karyawan'
WHERE credit_account_code IS NULL;

UPDATE employee_advance_settlements
SET debit_account_code = expense_account_code,
    debit_account_name = COALESCE(expense_account_name, category)
WHERE debit_account_code IS NULL AND expense_account_code IS NOT NULL;
