ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS autofill_status TEXT DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_ocr_results_autofill_status ON ocr_results(autofill_status);
