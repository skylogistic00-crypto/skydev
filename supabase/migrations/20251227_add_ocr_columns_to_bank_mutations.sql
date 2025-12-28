ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS evidence_url TEXT;
ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS ocr_text TEXT;
ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS ocr_detected_amount TEXT;
ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS ocr_detected_date TEXT;
ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS ocr_detected_counterparty TEXT;
ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS transaction_direction TEXT;
ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS debit_account_code TEXT;
ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS credit_account_code TEXT;
