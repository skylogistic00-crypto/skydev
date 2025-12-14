ALTER TABLE cash_and_bank_receipts 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_cash_receipts_created_by ON cash_and_bank_receipts(created_by);
