ALTER TABLE cash_and_bank_receipts 
ADD COLUMN IF NOT EXISTS bukti TEXT;

CREATE INDEX IF NOT EXISTS idx_cash_receipts_bukti ON cash_and_bank_receipts(bukti);
