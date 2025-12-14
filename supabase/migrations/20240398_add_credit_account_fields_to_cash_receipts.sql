ALTER TABLE cash_and_bank_receipts
ADD COLUMN IF NOT EXISTS account_type_credit TEXT,
ADD COLUMN IF NOT EXISTS account_name_credit TEXT;
