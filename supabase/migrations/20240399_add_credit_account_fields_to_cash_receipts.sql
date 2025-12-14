ALTER TABLE cash_and_bank_receipts
ADD COLUMN IF NOT EXISTS account_type_credit TEXT,
ADD COLUMN IF NOT EXISTS account_name_credit TEXT;

COMMENT ON COLUMN cash_and_bank_receipts.account_type_credit IS 'Account type for credit side of journal entry';
COMMENT ON COLUMN cash_and_bank_receipts.account_name_credit IS 'Account name for credit side of journal entry';
