ALTER TABLE cash_and_bank_receipts 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'waiting_approval',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_cash_receipts_approval_status ON cash_and_bank_receipts(approval_status);
