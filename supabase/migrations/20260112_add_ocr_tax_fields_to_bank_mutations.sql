ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS stamp_amount DECIMAL(18,2) DEFAULT 0;

ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS transaction_type TEXT;

ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS revenue_account_code TEXT;
ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS expense_account_code TEXT;

ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS vat_output_account_code TEXT;
ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS vat_input_account_code TEXT;
