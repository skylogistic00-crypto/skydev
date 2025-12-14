-- Add bukti column to cash_disbursement table for storing uploaded document URLs

ALTER TABLE cash_disbursement 
ADD COLUMN IF NOT EXISTS bukti TEXT;

CREATE INDEX IF NOT EXISTS idx_cash_disbursement_bukti 
ON cash_disbursement(bukti) WHERE bukti IS NOT NULL;
